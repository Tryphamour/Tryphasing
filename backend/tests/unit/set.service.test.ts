import { SetService } from '../../src/services/set.service';
import { SetRepository } from '../../src/repositories/set.repository';
import { CardRepository } from '../../src/repositories/card.repository';
import { Set, Card, Rarity, Prisma } from '@prisma/client';

// Mock the repositories with proper Jest mock types
const mockSetRepository = {
  create: jest.fn<Promise<Set>, [Prisma.SetCreateInput]>(),
  findAll: jest.fn<Promise<Set[]>, []>(),
  findById: jest.fn<Promise<Set | null>, [string]>(),
  update: jest.fn<Promise<Set>, [string, Prisma.SetUpdateInput]>(),
  delete: jest.fn<Promise<Set>, [string]>(),
};

const mockCardRepository = {
  findAll: jest.fn<Promise<Card[]>, []>(), // Used for checking associated cards before deletion
  // Add other methods if needed for other tests
};

describe('SetService', () => {
  let setService: SetService;

  beforeEach(() => {
    // Explicitly pass the mocked repositories to the service constructor
    setService = new SetService(mockSetRepository as unknown as SetRepository, mockCardRepository as unknown as CardRepository);
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  const mockSet: Set = {
    id: 'set123',
    name: 'Test Set',
    image: 'http://example.com/set.png',
    totalCards: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCard: Card = {
    id: 'card456',
    name: 'Associated Card',
    description: 'Desc',
    image: 'url',
    rarity: Rarity.COMMON,
    setId: 'set123', // Associated with mockSet
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // --- createSet tests ---
  it('should create a set successfully', async () => {
    mockSetRepository.create.mockResolvedValue(mockSet);

    const result = await setService.createSet({
      name: 'New Set',
      image: 'http://example.com/new_set.png',
    });

    expect(result).toEqual(mockSet);
    expect(mockSetRepository.create).toHaveBeenCalledWith({
      name: 'New Set',
      image: 'http://example.com/new_set.png',
    });
  });

  // --- findAllSets tests ---
  it('should return all sets', async () => {
    mockSetRepository.findAll.mockResolvedValue([mockSet]);

    const result = await setService.findAllSets();

    expect(result).toEqual([mockSet]);
    expect(mockSetRepository.findAll).toHaveBeenCalledTimes(1);
  });

  // --- findSetById tests ---
  it('should return a set by its ID', async () => {
    mockSetRepository.findById.mockResolvedValue(mockSet);

    const result = await setService.findSetById('set123');

    expect(result).toEqual(mockSet);
    expect(mockSetRepository.findById).toHaveBeenCalledWith('set123');
  });

  it('should return null if set not found', async () => {
    mockSetRepository.findById.mockResolvedValue(null);

    const result = await setService.findSetById('nonExistent');

    expect(result).toBeNull();
    expect(mockSetRepository.findById).toHaveBeenCalledWith('nonExistent');
  });

  // --- updateSet tests ---
  it('should update a set successfully', async () => {
    mockSetRepository.update.mockResolvedValue({ ...mockSet, name: 'Updated Set' });

    const result = await setService.updateSet('set123', { name: 'Updated Set' });

    expect(result).toEqual({ ...mockSet, name: 'Updated Set' });
    expect(mockSetRepository.update).toHaveBeenCalledWith('set123', { name: 'Updated Set' });
  });

  // --- deleteSet tests ---
  it('should delete a set successfully if no associated cards', async () => {
    mockCardRepository.findAll.mockResolvedValue([]); // No associated cards
    mockSetRepository.delete.mockResolvedValue(mockSet);

    const result = await setService.deleteSet('set123');

    expect(result).toEqual(mockSet);
    expect(mockCardRepository.findAll).toHaveBeenCalledTimes(1);
    expect(mockSetRepository.delete).toHaveBeenCalledWith('set123');
  });

  it('should throw an error if trying to delete a set with associated cards', async () => {
    mockCardRepository.findAll.mockResolvedValue([mockCard]); // One associated card

    await expect(setService.deleteSet('set123')).rejects.toThrow('Cannot delete Set with ID set123 because it still contains 1 associated cards.');
    expect(mockCardRepository.findAll).toHaveBeenCalledTimes(1);
    expect(mockSetRepository.delete).not.toHaveBeenCalled(); // Delete should not be called
  });
});