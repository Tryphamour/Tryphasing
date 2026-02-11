import { CardService } from '../../src/services/card.service';
import { CardRepository } from '../../src/repositories/card.repository';
import { SetRepository } from '../../src/repositories/set.repository';
import { Card, Rarity, Prisma, Set } from '@prisma/client';

// Mock the repositories with proper Jest mock types
const mockCardRepository = {
  create: jest.fn<Promise<Card>, [Prisma.CardCreateInput]>(),
  findAll: jest.fn<Promise<Card[]>, []>(),
  findById: jest.fn<Promise<Card | null>, [string]>(),
  update: jest.fn<Promise<Card>, [string, Prisma.CardUpdateInput]>(),
  delete: jest.fn<Promise<Card>, [string]>(),
};

const mockSetRepository = {
  findById: jest.fn<Promise<Set | null>, [string]>(),
};

describe('CardService', () => {
  let cardService: CardService;

  beforeEach(() => {
    // Explicitly pass the mocked repositories to the service constructor
    cardService = new CardService(mockCardRepository as unknown as CardRepository, mockSetRepository as unknown as SetRepository);
    // Reset mocks before each test
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

  const mockExistingSet: Set = {
    id: 'set456',
    name: 'Test Set',
    image: 'http://example.com/set.png',
    totalCards: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // --- createCard tests ---
  it('should create a card successfully if set exists', async () => {
    mockSetRepository.findById.mockResolvedValue(mockExistingSet);
    mockCardRepository.create.mockResolvedValue(mockCard);

    const inputData = {
      name: 'New Card',
      rarity: Rarity.COMMON,
      image: 'http://example.com/new.png',
      setId: 'set456',
    };

    const result = await cardService.createCard(inputData);

    expect(result).toEqual(mockCard);
    expect(mockSetRepository.findById).toHaveBeenCalledWith(inputData.setId);
    expect(mockCardRepository.create).toHaveBeenCalledWith({
      name: inputData.name,
      rarity: inputData.rarity,
      image: inputData.image,
      set: { connect: { id: inputData.setId } },
    });
  });

  it('should throw an error if trying to create a card for a non-existent set', async () => {
    mockSetRepository.findById.mockResolvedValue(null);

    const inputData = {
      name: 'New Card',
      rarity: Rarity.COMMON,
      image: 'http://example.com/new.png',
      setId: 'nonExistentSet',
    };

    await expect(cardService.createCard(inputData)).rejects.toThrow(`Set with ID ${inputData.setId} not found.`);
    expect(mockSetRepository.findById).toHaveBeenCalledWith(inputData.setId);
    expect(mockCardRepository.create).not.toHaveBeenCalled();
  });

  // --- findAllCards tests ---
  it('should return all cards', async () => {
    mockCardRepository.findAll.mockResolvedValue([mockCard]);

    const result = await cardService.findAllCards();

    expect(result).toEqual([mockCard]);
    expect(mockCardRepository.findAll).toHaveBeenCalledTimes(1);
  });

  // --- findCardById tests ---
  it('should return a card by its ID', async () => {
    mockCardRepository.findById.mockResolvedValue(mockCard);

    const result = await cardService.findCardById('card123');

    expect(result).toEqual(mockCard);
    expect(mockCardRepository.findById).toHaveBeenCalledWith('card123');
  });

  it('should return null if card not found', async () => {
    mockCardRepository.findById.mockResolvedValue(null);

    const result = await cardService.findCardById('nonExistent');

    expect(result).toBeNull();
    expect(mockCardRepository.findById).toHaveBeenCalledWith('nonExistent');
  });

  // --- updateCard tests ---
  it('should update a card successfully', async () => {
    mockSetRepository.findById.mockResolvedValue(mockExistingSet); // Not called if setId is not updated
    mockCardRepository.update.mockResolvedValue({ ...mockCard, name: 'Updated Card' });

    const inputData = { name: 'Updated Card' };
    const result = await cardService.updateCard('card123', inputData);

    expect(result).toEqual({ ...mockCard, name: 'Updated Card' });
    expect(mockSetRepository.findById).not.toHaveBeenCalled(); // setId was not in inputData
    expect(mockCardRepository.update).toHaveBeenCalledWith('card123', inputData);
  });

  it('should update a card and change its set successfully', async () => {
    const newSetId = 'newSet789';
    const mockNewSet: Set = {
      id: newSetId,
      name: 'New Test Set',
      image: 'http://example.com/new_set.png',
      totalCards: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockSetRepository.findById.mockResolvedValue(mockNewSet);
    mockCardRepository.update.mockResolvedValue({ ...mockCard, name: 'Moved Card', setId: newSetId });

    const inputData = { name: 'Moved Card', setId: newSetId };
    const result = await cardService.updateCard('card123', inputData);

    expect(result).toEqual({ ...mockCard, name: 'Moved Card', setId: newSetId });
    expect(mockSetRepository.findById).toHaveBeenCalledWith(newSetId);
    expect(mockCardRepository.update).toHaveBeenCalledWith('card123', {
      name: inputData.name,
      set: { connect: { id: inputData.setId } },
    });
  });

  it('should throw an error if trying to update a card with a non-existent setId', async () => {
    mockSetRepository.findById.mockResolvedValue(null);

    const inputData = { setId: 'nonExistentSet' };
    await expect(cardService.updateCard('card123', inputData)).rejects.toThrow(`Set with ID ${inputData.setId} not found.`);
    expect(mockSetRepository.findById).toHaveBeenCalledWith(inputData.setId);
    expect(mockCardRepository.update).not.toHaveBeenCalled();
  });

  // --- deleteCard tests ---
  it('should delete a card successfully', async () => {
    mockCardRepository.delete.mockResolvedValue(mockCard);

    const result = await cardService.deleteCard('card123');

    expect(result).toEqual(mockCard);
    expect(mockCardRepository.delete).toHaveBeenCalledWith('card123');
  });
});
