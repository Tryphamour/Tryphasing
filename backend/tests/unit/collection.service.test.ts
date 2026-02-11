import { CollectionService } from '../../src/services/collection.service';
import { CollectionRepository } from '../../src/repositories/collection.repository';
import { CardRepository } from '../../src/repositories/card.repository';
import { SetRepository } from '../../src/repositories/set.repository';
import { Collection, Card, Set, Prisma, Rarity } from '@prisma/client';
// No longer importing prisma client directly in tests as service no longer uses it

// Mock the repositories with proper Jest mock types
const mockCollectionRepository = {
  upsert: jest.fn<Promise<Collection>, [string, string, number]>(),
  findManyDistinctByViewerId: jest.fn<Promise<Collection[]>, [string]>(),
  findManyDistinctByViewerIdAndCardIds: jest.fn<Promise<Collection[]>, [string, string[]]>(),
};

const mockCardRepository = {
  findById: jest.fn<Promise<Card | null>, [string]>(),
  findAll: jest.fn<Promise<Card[]>, []>(),
};

const mockSetRepository = {
  findById: jest.fn<Promise<Set | null>, [string]>(),
};

// No longer mocking prisma.client directly here, as service doesn't use it
// jest.mock('../../src/repositories/prisma.client', () => ({ ... }));

describe('CollectionService', () => {
  let collectionService: CollectionService;

  beforeEach(() => {
    collectionService = new CollectionService(
      mockCollectionRepository as unknown as CollectionRepository,
      mockCardRepository as unknown as CardRepository,
      mockSetRepository as unknown as SetRepository,
    );
    jest.clearAllMocks();
  });

  const mockCard: Card = {
    id: 'card123',
    name: 'Test Card',
    description: 'A test description',
    image: 'http://example.com/test.png',
    rarity: Rarity.COMMON,
    setId: 'set456',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCollection: Collection = {
    id: 'collection123',
    viewerId: 'viewer123',
    cardId: 'card123',
    quantity: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockViewerId = 'viewer123';
  const mockSetId = 'set456';

  // --- addCardToCollection tests ---
  it('should add a card to collection successfully if card exists', async () => {
    mockCardRepository.findById.mockResolvedValue(mockCard);
    mockCollectionRepository.upsert.mockResolvedValue(mockCollection);

    const result = await collectionService.addCardToCollection(mockViewerId, mockCard.id, 1);

    expect(result).toEqual(mockCollection);
    expect(mockCardRepository.findById).toHaveBeenCalledWith(mockCard.id);
    expect(mockCollectionRepository.upsert).toHaveBeenCalledWith(mockViewerId, mockCard.id, 1);
  });

  it('should throw an error if card does not exist when adding to collection', async () => {
    mockCardRepository.findById.mockResolvedValue(null);

    await expect(collectionService.addCardToCollection(mockViewerId, 'nonExistentCard', 1)).rejects.toThrow('Card with ID nonExistentCard not found.');
    expect(mockCardRepository.findById).toHaveBeenCalledWith('nonExistentCard');
    expect(mockCollectionRepository.upsert).not.toHaveBeenCalled();
  });

  // --- getDistinctCardsInSet tests ---
  it('should return the correct count of distinct cards in a set for a viewer', async () => {
    const cardsInSet: Card[] = [
      { ...mockCard, id: 'card1', setId: mockSetId },
      { ...mockCard, id: 'card2', setId: mockSetId },
      { ...mockCard, id: 'card3', setId: 'otherSet' }, // Not in this set
    ];
    // Mock the inefficient findAll for now
    mockCardRepository.findAll.mockResolvedValue(cardsInSet);

    // Mock new repository method
    mockCollectionRepository.findManyDistinctByViewerIdAndCardIds.mockResolvedValue([
      { ...mockCollection, cardId: 'card1' },
      { ...mockCollection, cardId: 'card2' },
    ]);

    const result = await collectionService.getDistinctCardsInSet(mockViewerId, mockSetId);

    expect(result).toBe(2);
    expect(mockCardRepository.findAll).toHaveBeenCalledTimes(1);
    expect(mockCollectionRepository.findManyDistinctByViewerIdAndCardIds).toHaveBeenCalledWith(
      mockViewerId,
      ['card1', 'card2'],
    );
  });

  // --- getTotalDistinctCards tests ---
  it('should return the correct total count of distinct cards for a viewer', async () => {
    // Mock new repository method
    mockCollectionRepository.findManyDistinctByViewerId.mockResolvedValue([
      { ...mockCollection, cardId: 'card1' },
      { ...mockCollection, cardId: 'card2' },
      { ...mockCollection, cardId: 'card4' },
    ]);

    const result = await collectionService.getTotalDistinctCards(mockViewerId);

    expect(result).toBe(3);
    expect(mockCollectionRepository.findManyDistinctByViewerId).toHaveBeenCalledWith(mockViewerId);
  });
});
