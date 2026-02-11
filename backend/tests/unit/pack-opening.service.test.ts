import { PackOpeningService } from '../../src/services/pack-opening.service';
import { ViewerService } from '../../src/services/viewer.service';
import { CollectionService } from '../../src/services/collection.service';
import { DropRateService } from '../../src/services/drop-rate.service';
import { CardRepository } from '../../src/repositories/card.repository';
import { SetRepository } from '../../src/repositories/set.repository';
import { Card, Rarity, Set, Viewer, Collection } from '@prisma/client';

// Mock repositories and services
const mockViewerService = {
  findViewerById: jest.fn<Promise<Viewer | null>, [string]>(),
};

const mockCollectionService = {
  addCardToCollection: jest.fn<Promise<Collection>, [string, string, number]>(),
  getDistinctCardsInSet: jest.fn<Promise<number>, [string, string]>(),
  getTotalDistinctCards: jest.fn<Promise<number>, [string]>(),
};

const mockDropRateService = {
  findAllDropRates: jest.fn<Promise<{ rarity: Rarity; rate: number }[]>, []>(),
};

const mockCardRepository = {
  findAll: jest.fn<Promise<Card[]>, []>(),
};

const mockSetRepository = {
  findById: jest.fn<Promise<Set | null>, [string]>(),
};

describe('PackOpeningService', () => {
  let packOpeningService: PackOpeningService;

  beforeEach(() => {
    packOpeningService = new PackOpeningService(
      mockViewerService as unknown as ViewerService,
      mockCollectionService as unknown as CollectionService,
      mockDropRateService as unknown as DropRateService,
      mockCardRepository as unknown as CardRepository,
      mockSetRepository as unknown as SetRepository,
    );
    jest.clearAllMocks();
  });

  const mockViewer: Viewer = {
    id: 'viewer123',
    twitchId: 'twitch123',
    username: 'testuser',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSet: Set = {
    id: 'set456',
    name: 'Test Set',
    image: 'http://example.com/set.png',
    totalCards: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCards: Card[] = [
    { id: 'cardC1', name: 'Common Card 1', rarity: Rarity.COMMON, setId: 'set456', description: '', image: '', createdAt: new Date(), updatedAt: new Date() },
    { id: 'cardC2', name: 'Common Card 2', rarity: Rarity.COMMON, setId: 'set456', description: '', image: '', createdAt: new Date(), updatedAt: new Date() },
    { id: 'cardU1', name: 'Uncommon Card 1', rarity: Rarity.UNCOMMON, setId: 'set456', description: '', image: '', createdAt: new Date(), updatedAt: new Date() },
    { id: 'cardR1', name: 'Rare Card 1', rarity: Rarity.RARE, setId: 'set456', description: '', image: '', createdAt: new Date(), updatedAt: new Date() },
  ];

  const mockDropRates = [
    { rarity: Rarity.COMMON, rate: 0.7 },
    { rarity: Rarity.UNCOMMON, rate: 0.2 },
    { rarity: Rarity.RARE, rate: 0.1 },
  ];

  // Mock Math.random to control rarity determination
  const mockMathRandom = jest.spyOn(Math, 'random');

  // --- openPack tests ---
  it('should open a pack and return the opened card and stats', async () => {
    mockViewerService.findViewerById.mockResolvedValue(mockViewer);
    mockSetRepository.findById.mockResolvedValue(mockSet);
    mockDropRateService.findAllDropRates.mockResolvedValue(mockDropRates);
    mockCardRepository.findAll.mockResolvedValue(mockCards);
    mockCollectionService.addCardToCollection.mockResolvedValue({} as Collection); // Mock successful add
    mockCollectionService.getDistinctCardsInSet.mockResolvedValue(10);
    mockCollectionService.getTotalDistinctCards.mockResolvedValue(20);

    // Mock Math.random to ensure a specific rarity is picked (e.g., Common)
    mockMathRandom.mockReturnValue(0.5); // This falls into COMMON (0 to 0.7)

    const result = await packOpeningService.openPack(mockViewer.id, mockSet.id);

    expect(mockViewerService.findViewerById).toHaveBeenCalledWith(mockViewer.id);
    expect(mockSetRepository.findById).toHaveBeenCalledWith(mockSet.id);
    expect(mockDropRateService.findAllDropRates).toHaveBeenCalledTimes(1);
    expect(mockCardRepository.findAll).toHaveBeenCalledTimes(1);
    expect(mockCollectionService.addCardToCollection).toHaveBeenCalledWith(mockViewer.id, expect.any(String));
    expect(mockCollectionService.getDistinctCardsInSet).toHaveBeenCalledWith(mockViewer.id, mockSet.id);
    expect(mockCollectionService.getTotalDistinctCards).toHaveBeenCalledWith(mockViewer.id);
    expect(result.openedCard.rarity).toBe(Rarity.COMMON);
    expect(result.distinctCardsInSet).toBe(10);
    expect(result.totalDistinctCards).toBe(20);
  });

  it('should throw an error if viewer not found', async () => {
    mockViewerService.findViewerById.mockResolvedValue(null);

    await expect(packOpeningService.openPack('nonExistentViewer', mockSet.id)).rejects.toThrow('Viewer with ID nonExistentViewer not found.');
  });

  it('should throw an error if set not found', async () => {
    mockViewerService.findViewerById.mockResolvedValue(mockViewer);
    mockSetRepository.findById.mockResolvedValue(null);

    await expect(packOpeningService.openPack(mockViewer.id, 'nonExistentSet')).rejects.toThrow('Set with ID nonExistentSet not found.');
  });

  it('should throw an error if no cards found for determined rarity in the set', async () => {
    mockViewerService.findViewerById.mockResolvedValue(mockViewer);
    mockSetRepository.findById.mockResolvedValue(mockSet);
    mockDropRateService.findAllDropRates.mockResolvedValue(mockDropRates);
    mockCardRepository.findAll.mockResolvedValue([]); // No cards at all

    mockMathRandom.mockReturnValue(0.5); // Will pick COMMON

    await expect(packOpeningService.openPack(mockViewer.id, mockSet.id)).rejects.toThrow(`No cards found for rarity ${Rarity.COMMON} in Set ID ${mockSet.id}.`);
  });

  // --- determineDroppedRarity tests (private method, tested indirectly or by casting for direct testing) ---
  // Direct testing by casting the method to 'any' is possible for private methods
  it('should determine COMMON rarity correctly', () => {
    mockMathRandom.mockReturnValue(0.6); // 0.6 is < 0.7 (COMMON)
    const result = (packOpeningService as any).determineDroppedRarity(mockDropRates);
    expect(result).toBe(Rarity.COMMON);
  });

  it('should determine UNCOMMON rarity correctly', () => {
    mockMathRandom.mockReturnValue(0.8); // 0.8 is > 0.7 and < 0.7+0.2=0.9 (UNCOMMON)
    const result = (packOpeningService as any).determineDroppedRarity(mockDropRates);
    expect(result).toBe(Rarity.UNCOMMON);
  });

  it('should determine RARE rarity correctly', () => {
    mockMathRandom.mockReturnValue(0.95); // 0.95 is > 0.9 and < 0.9+0.1=1.0 (RARE)
    const result = (packOpeningService as any).determineDroppedRarity(mockDropRates);
    expect(result).toBe(Rarity.RARE);
  });

  it('should handle empty drop rates', () => {
    const result = (packOpeningService as any).determineDroppedRarity([]);
    expect(result).toBeNull();
  });

  it('should normalize rates if sum is not 1 and still pick correctly', () => {
    const skewedDropRates = [
      { rarity: Rarity.COMMON, rate: 0.3 }, // Should become 0.3 / 0.6 = 0.5
      { rarity: Rarity.UNCOMMON, rate: 0.3 }, // Should become 0.3 / 0.6 = 0.5
    ]; // Total = 0.6

    mockMathRandom.mockReturnValue(0.4); // This should fall into COMMON after normalization
    const resultCommon = (packOpeningService as any).determineDroppedRarity(skewedDropRates);
    expect(resultCommon).toBe(Rarity.COMMON);

    mockMathRandom.mockReturnValue(0.7); // This should fall into UNCOMMON after normalization
    const resultUncommon = (packOpeningService as any).determineDroppedRarity(skewedDropRates);
    expect(resultUncommon).toBe(Rarity.UNCOMMON);
  });
});
