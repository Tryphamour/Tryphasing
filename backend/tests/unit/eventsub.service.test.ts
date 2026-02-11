import { TwitchEventSubService } from '../../src/twitch/eventsub.service';
import { PackOpeningQueue, PackOpeningRequest } from '../../src/queue/pack-opening.queue';
import { ViewerService } from '../../src/services/viewer.service';
import WebSocket from 'ws';
import { Viewer } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

// Mock required environment variables
const MOCK_CLIENT_ID = 'mockClientId';
const MOCK_CLIENT_SECRET = 'mockClientSecret';
const MOCK_EVENTSUB_SECRET = 'mockEventSubSecret';
const MOCK_CHANNEL_ID = 'mockChannelId';
const MOCK_PACK_OPENING_REWARD_ID = 'mockPackOpeningRewardId';
const MOCK_DEFAULT_SET_ID = 'mockDefaultSetId';

// Set environment variables for the test
process.env.TWITCH_CLIENT_ID = MOCK_CLIENT_ID;
process.env.TWITCH_CLIENT_SECRET = MOCK_CLIENT_SECRET;
process.env.TWITCH_EVENTSUB_SECRET = MOCK_EVENTSUB_SECRET;
process.env.TWITCH_CHANNEL_ID = MOCK_CHANNEL_ID;
process.env.TWITCH_PACK_OPENING_REWARD_ID = MOCK_PACK_OPENING_REWARD_ID;
process.env.TWITCH_DEFAULT_SET_ID = MOCK_DEFAULT_SET_ID;


// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(),
}));

// Mock WebSocket
jest.mock('ws', () => {
  return jest.fn().mockImplementation(() => ({
    onopen: jest.fn(),
    onmessage: jest.fn(),
    onerror: jest.fn(),
    onclose: jest.fn(),
    close: jest.fn(),
    readyState: WebSocket.OPEN, // Simulate always open for some tests
    OPEN: WebSocket.OPEN, // Define static property
    CONNECTING: WebSocket.CONNECTING,
  }));
});

// Explicitly cast WebSocket to any to avoid TS2352 errors when accessing mock properties
const MockWebSocket = WebSocket as any;

// Mock fetch (global object)
const mockFetch = jest.fn();
(global as any).fetch = mockFetch;


// --- Mock Services with correct Jest types using jest.fn() ---
// Using `as unknown as Type` for the mock object, but `jest.fn()` for the methods
const mockPackOpeningQueue = {
  enqueue: jest.fn<void, [PackOpeningRequest]>(),
  resolveAnimationComplete: jest.fn(),
};

const mockViewerService = {
  findOrCreateViewer: jest.fn<Promise<Viewer>, [string, string]>(),
};


describe('TwitchEventSubService', () => {
  let service: TwitchEventSubService;
  let wsInstance: any; // To access mock WebSocket instance properties
  let consoleSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  // Define mockViewer here to be in scope
  const mockViewer: Viewer = {
    id: 'dbViewerId123',
    twitchId: 'testUserId',
    username: 'testuser',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TwitchEventSubService(mockPackOpeningQueue as unknown as PackOpeningQueue, mockViewerService as unknown as ViewerService);
    
    // Moved wsInstance assignment inside tests where service.start() is called
    MockWebSocket.mockClear(); // Clear mock calls on the constructor itself

    (uuidv4 as jest.Mock).mockReturnValue('mock-request-id-from-uuid');

    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  // Helper to simulate WebSocket message
  const simulateWsMessage = (message: any) => {
    // Call the onmessage handler of the current wsInstance
    wsInstance.onmessage({ data: JSON.stringify(message) });
  };

  // Helper to mock a successful token fetch
  const mockSuccessfulTokenFetch = () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ access_token: 'mockAppAccessToken', expires_in: 3600 }),
    });
  };

  // Helper to mock a successful subscription fetch
  const mockSuccessfulSubscriptionFetch = () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: [{ id: 'mockSubId', status: 'enabled' }] }),
    });
  };


  // --- Constructor and Start tests ---
  it('should throw error if environment variables are missing', () => {
    const originalClientId = process.env.TWITCH_CLIENT_ID;
    delete process.env.TWITCH_CLIENT_ID; // Temporarily unset
    expect(() => new TwitchEventSubService(mockPackOpeningQueue as unknown as PackOpeningQueue, mockViewerService as unknown as ViewerService)).toThrow('Missing Twitch environment variables.');
    process.env.TWITCH_CLIENT_ID = originalClientId; // Restore
  });

  it('should connect WebSocket and fetch app access token on start', async () => {
    mockSuccessfulTokenFetch();
    await service.start();
    wsInstance = MockWebSocket.mock.results[MockWebSocket.mock.results.length - 1]?.value; // Get the latest instance

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ method: 'POST', body: expect.stringContaining('grant_type=client_credentials') }),
    );
    expect(MockWebSocket).toHaveBeenCalledWith('wss://eventsub-beta.twitch.tv/ws');
  });


  // --- handleWebSocketMessage tests ---
  it('should handle session_welcome message and subscribe', async () => {
    mockSuccessfulTokenFetch();
    mockSuccessfulSubscriptionFetch();
    await service.start(); // This connects WS and fetches token
    wsInstance = MockWebSocket.mock.results[MockWebSocket.mock.results.length - 1]?.value; // Get the latest instance

    // Simulate session_welcome message
    const welcomeMessage = {
      metadata: { message_type: 'session_welcome' },
      payload: { session: { id: 'testSessionId' } },
    };
    await simulateWsMessage(welcomeMessage);

    expect(service['sessionId']).toBe('testSessionId');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.twitch.tv/helix/eventsub/subscriptions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'Client-ID': MOCK_CLIENT_ID }),
        body: expect.stringContaining(`broadcaster_user_id\":\"${MOCK_CHANNEL_ID}\"`)
      }),
    );
  });

  it('should handle notification message for pack opening reward', async () => {
    mockViewerService.findOrCreateViewer.mockResolvedValue(mockViewer);
    mockPackOpeningQueue.enqueue.mockImplementation(() => {});

    // Simulate a notification message
    const notificationMessage = {
      metadata: { message_type: 'notification' },
      payload: {
        subscription: { type: 'channel.channel_points_custom_reward_redemption.add' },
        event: {
          reward_id: MOCK_PACK_OPENING_REWARD_ID,
          user_id: mockViewer.twitchId,
          user_name: mockViewer.username,
          reward: { title: 'Open Pack' },
          user_input: '',
        },
      },
    };
    await service['handleNotification'](notificationMessage.payload.event);

    expect(mockViewerService.findOrCreateViewer).toHaveBeenCalledWith(mockViewer.twitchId, mockViewer.username);
    expect(mockPackOpeningQueue.enqueue).toHaveBeenCalledWith(expect.objectContaining({
      viewerId: mockViewer.id,
      twitchId: mockViewer.twitchId,
      username: mockViewer.username,
      setId: MOCK_DEFAULT_SET_ID,
      requestId: 'mock-request-id-from-uuid',
    }));
  });

  it('should ignore notification message for other rewards', async () => {
    const notificationMessage = {
      metadata: { message_type: 'notification' },
      payload: {
        subscription: { type: 'channel.channel_points_custom_reward_redemption.add' },
        event: {
          reward_id: 'someOtherRewardId',
          user_id: 'testUserId',
          user_name: 'testuser',
          reward: { title: 'Some Other Reward' },
          user_input: '',
        },
      },
    };
    await service['handleNotification'](notificationMessage.payload.event);

    expect(mockViewerService.findOrCreateViewer).not.toHaveBeenCalled();
    expect(mockPackOpeningQueue.enqueue).not.toHaveBeenCalled();
  });

  it('should handle session_reconnect message by closing WebSocket', async () => {
    mockSuccessfulTokenFetch();
    await service.start(); // Connects WS
    wsInstance = MockWebSocket.mock.results[MockWebSocket.mock.results.length - 1]?.value; // Get the latest instance

    const reconnectMessage = {
      metadata: { message_type: 'session_reconnect' },
      payload: {},
    };
    await simulateWsMessage(reconnectMessage);
    expect(wsInstance.close).toHaveBeenCalledTimes(1);
  });
});
