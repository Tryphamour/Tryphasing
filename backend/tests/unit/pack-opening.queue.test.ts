import { PackOpeningQueue, PackOpeningRequest } from '../../src/queue/pack-opening.queue';
import { PackOpeningService, PackOpeningResult } from '../../src/services/pack-opening.service';
import { Server as SocketIOServer } from 'socket.io';
import { Card, Rarity, Viewer } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid'; // Import uuid for mocking

// Mock Socket.IO Server
const mockIo = {
  emit: jest.fn(),
  on: jest.fn(),
  to: jest.fn().mockReturnThis(), // Allow chaining .to().emit()
};

// Mock PackOpeningService
const mockPackOpeningService = {
  openPack: jest.fn<Promise<PackOpeningResult>, [string, string]>(),
};

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(),
}));

describe('PackOpeningQueue', () => {
  let packOpeningQueue: PackOpeningQueue;
  let consoleSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    packOpeningQueue = new PackOpeningQueue(mockIo as unknown as SocketIOServer, mockPackOpeningService as unknown as PackOpeningService);
    jest.clearAllMocks();
    (uuidv4 as jest.Mock).mockReturnValue('mock-request-id');

    // Suppress console output during tests
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  const mockViewer: Viewer = {
    id: 'viewer123',
    twitchId: 'twitch123',
    username: 'testuser',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCard: Card = {
    id: 'card123',
    name: 'Test Card',
    description: '',
    image: '',
    rarity: Rarity.COMMON,
    setId: 'set456',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPackOpeningResult: PackOpeningResult = {
    openedCard: mockCard,
    distinctCardsInSet: 1,
    totalDistinctCards: 1,
  };

  // Helper to create a request with a unique ID
  const createRequest = (idSuffix: string = '') => ({
    viewerId: mockViewer.id,
    twitchId: mockViewer.twitchId,
    username: mockViewer.username,
    setId: 'set456',
    requestId: `req-${idSuffix || uuidv4()}`,
  });

  it('should enqueue a request and start processing', async () => {
    const request = createRequest('1');
    mockPackOpeningService.openPack.mockResolvedValue(mockPackOpeningResult);
    
    // Simulate animation completion immediately for this test
    setTimeout(() => {
        packOpeningQueue.resolveAnimationComplete(request.requestId, mockPackOpeningResult);
    }, 20); // Increased delay

    packOpeningQueue.enqueue(request);

    // Give some time for the queue to process
    await new Promise(resolve => setTimeout(resolve, 100)); // Increased delay

    expect(mockPackOpeningService.openPack).toHaveBeenCalledWith(request.viewerId, request.setId);
    expect(mockIo.emit).toHaveBeenCalledWith('packOpeningStarted', expect.any(Object));
    expect(mockIo.emit).toHaveBeenCalledWith('packOpeningComplete', { requestId: request.requestId });
  });

  it('should process requests sequentially', async () => {
    const request1 = createRequest('1');
    const request2 = createRequest('2');

    mockPackOpeningService.openPack
      .mockResolvedValueOnce({ ...mockPackOpeningResult, openedCard: { ...mockCard, id: 'cardA' } })
      .mockResolvedValueOnce({ ...mockPackOpeningResult, openedCard: { ...mockCard, id: 'cardB' } });

    packOpeningQueue.enqueue(request1);
    packOpeningQueue.enqueue(request2);

    setTimeout(() => {
        packOpeningQueue.resolveAnimationComplete(request1.requestId, mockPackOpeningResult);
    }, 20); // Increased delay

    setTimeout(() => {
        packOpeningQueue.resolveAnimationComplete(request2.requestId, mockPackOpeningResult);
    }, 40); // Increased delay

    await new Promise(resolve => setTimeout(resolve, 150)); // Increased delay

    expect(mockPackOpeningService.openPack).toHaveBeenCalledTimes(2);
    expect(mockPackOpeningService.openPack).toHaveBeenNthCalledWith(1, request1.viewerId, request1.setId);
    expect(mockPackOpeningService.openPack).toHaveBeenNthCalledWith(2, request2.viewerId, request2.setId);
    expect(mockIo.emit).toHaveBeenCalledWith('packOpeningStarted', expect.objectContaining({ requestId: request1.requestId }));
    expect(mockIo.emit).toHaveBeenCalledWith('packOpeningComplete', { requestId: request1.requestId });
    expect(mockIo.emit).toHaveBeenCalledWith('packOpeningStarted', expect.objectContaining({ requestId: request2.requestId }));
    expect(mockIo.emit).toHaveBeenCalledWith('packOpeningComplete', { requestId: request2.requestId });
  });

  it('should emit packOpeningError if packOpeningService fails', async () => {
    const request = createRequest('error');
    const errorMessage = 'Failed to open pack';
    mockPackOpeningService.openPack.mockRejectedValue(new Error(errorMessage));

    packOpeningQueue.enqueue(request);

    await new Promise(resolve => setTimeout(resolve, 50)); // Give it time to process and error

    expect(mockPackOpeningService.openPack).toHaveBeenCalledWith(request.viewerId, request.setId);
    expect(mockIo.emit).not.toHaveBeenCalledWith('packOpeningStarted', expect.any(Object));
    expect(mockIo.emit).toHaveBeenCalledWith('packOpeningError', { requestId: request.requestId, error: errorMessage });
    expect(mockIo.emit).not.toHaveBeenCalledWith('packOpeningComplete', expect.any(Object));
  });

  it('should not process if queue is empty', async () => {
    await new Promise(resolve => setTimeout(resolve, 10)); // Give it a moment

    expect(mockPackOpeningService.openPack).not.toHaveBeenCalled();
    expect(mockIo.emit).not.toHaveBeenCalled();
  });

  it('should resolve animation completion promise when resolveAnimationComplete is called', async () => {
    const request = createRequest('resolve');
    mockPackOpeningService.openPack.mockResolvedValue(mockPackOpeningResult);

    // Enqueue the request
    packOpeningQueue.enqueue(request);

    // Manually trigger animation completion after a short delay
    setTimeout(() => {
      packOpeningQueue.resolveAnimationComplete(request.requestId, mockPackOpeningResult);
    }, 20); // Give queue time to process packOpeningService and await promise

    // Wait for the queue to complete processing
    await new Promise(resolve => setTimeout(resolve, 100)); // Increased wait time

    expect(mockPackOpeningService.openPack).toHaveBeenCalledWith(request.viewerId, request.setId);
    // Check that both started and complete events were emitted
    expect(mockIo.emit).toHaveBeenCalledWith('packOpeningStarted', expect.objectContaining({ requestId: request.requestId }));
    expect(mockIo.emit).toHaveBeenCalledWith('packOpeningComplete', { requestId: request.requestId });
  });
});
