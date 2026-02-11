import WebSocket from 'ws';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { PackOpeningQueue, PackOpeningRequest } from '../queue/pack-opening.queue';
import { ViewerService } from '../services/viewer.service';
import { v4 as uuidv4 } from 'uuid'; // For generating request IDs

dotenv.config(); // Load environment variables

const TWITCH_EVENTSUB_WEBSOCKET_URL = 'wss://eventsub-beta.twitch.tv/ws'; // Using beta for now, can change to prod
const TWITCH_API_BASE_URL = 'https://api.twitch.tv/helix';
const TWITCH_AUTH_BASE_URL = 'https://id.twitch.tv/oauth2';

// --- Type Definitions for Twitch API Responses ---
interface TwitchSubscriptionResponse {
  data: Array<{ id: string; status: string }>; // Includes status for error checking
  error?: string;
  message?: string;
  status?: number;
}

interface TwitchAppAccessTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

export class TwitchEventSubService {
  private ws: WebSocket | null = null;
  private sessionId: string | null = null;
  private appAccessToken: string | null = null;
  private appAccessTokenExpiry: number = 0; // Timestamp

  private readonly CLIENT_ID = process.env.TWITCH_CLIENT_ID as string;
  private readonly CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET as string;
  private readonly EVENTSUB_SECRET = process.env.TWITCH_EVENTSUB_SECRET as string;
  private readonly CHANNEL_ID = process.env.TWITCH_CHANNEL_ID as string;
  private readonly PACK_OPENING_REWARD_ID = process.env.TWITCH_PACK_OPENING_REWARD_ID as string; // Specific reward ID for pack opening

  private packOpeningQueue: PackOpeningQueue;
  private viewerService: ViewerService;

  constructor(packOpeningQueue: PackOpeningQueue, viewerService: ViewerService) {
    if (!this.CLIENT_ID || !this.CLIENT_SECRET || !this.EVENTSUB_SECRET || !this.CHANNEL_ID || !this.PACK_OPENING_REWARD_ID) {
      throw new Error('Missing Twitch environment variables. Please check .env file.');
    }
    this.packOpeningQueue = packOpeningQueue;
    this.viewerService = viewerService;
  }

  public async start(): Promise<void> {
    await this.ensureAppAccessToken(); // Get initial token
    this.connectWebSocket();
  }

  private connectWebSocket(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      console.log('WebSocket already connected or connecting.');
      return;
    }

    console.log('Connecting to Twitch EventSub WebSocket...');
    this.ws = new WebSocket(TWITCH_EVENTSUB_WEBSOCKET_URL);

    this.ws.onopen = () => {
      console.log('Connected to Twitch EventSub WebSocket.');
    };

    this.ws.onmessage = async (event) => {
      const message = JSON.parse(event.data.toString());
      await this.handleWebSocketMessage(message);
    };

    this.ws.onerror = (error) => {
      console.error('Twitch EventSub WebSocket Error:', error);
    };

    this.ws.onclose = (event) => {
      console.warn('Twitch EventSub WebSocket Closed:', event.code, event.reason);
      // Attempt to reconnect after a delay
      this.sessionId = null; // Clear session ID on close
      setTimeout(() => this.connectWebSocket(), 5000); // Reconnect after 5 seconds
    };
  }

  private async handleWebSocketMessage(message: any): Promise<void> {
    // console.log('Received message:', JSON.stringify(message, null, 2)); // Debugging

    switch (message.metadata.message_type) {
      case 'session_welcome':
        this.sessionId = message.payload.session.id;
        console.log(`EventSub Session Welcome. Session ID: ${this.sessionId}`);
        await this.subscribeToChannelPoints();
        break;
      case 'session_keepalive':
        // console.log('EventSub Session Keepalive.');
        break;
      case 'notification':
        await this.handleNotification(message.payload.event);
        break;
      case 'session_reconnect':
        console.log('EventSub Session Reconnect requested. Reconnecting...');
        this.ws?.close(); // Force close to trigger onclose and reconnect logic
        break;
      case 'revocation':
        console.warn(`EventSub Subscription Revoked: ${message.payload.subscription.id}`);
        // Consider re-subscribing or alerting user
        break;
      default:
        console.log(`Unhandled EventSub message type: ${message.metadata.message_type}`);
    }
  }

  private async handleNotification(event: any): Promise<void> {
    if (event.reward_id === this.PACK_OPENING_REWARD_ID) {
      console.log(`Channel Points Redemption for Pack Opening received: ${event.user_name} redeemed "${event.reward.title}"`);

      const viewerTwitchId = event.user_id;
      const viewerUsername = event.user_name;
      const rewardInput = event.user_input; // This might contain the Set ID or other info

      // Find or create viewer
      const viewer = await this.viewerService.findOrCreateViewer(viewerTwitchId, viewerUsername);

      // Determine Set ID. For simplicity, assume a default set for now, or parse from rewardInput.
      // In a real scenario, the reward might have custom input fields.
      // For now, let's assume the reward ID itself maps to a default set, or we hardcode for initial dev.
      // Using a placeholder set ID for now, will need to be configured/determined dynamically.
      const defaultSetId = process.env.TWITCH_DEFAULT_SET_ID || 'some-default-set-id'; // This needs to be provided

      const request: PackOpeningRequest = {
        viewerId: viewer.id,
        twitchId: viewerTwitchId,
        username: viewerUsername,
        setId: defaultSetId, // Need to dynamically determine this based on reward or input
        requestId: uuidv4(),
      };
      this.packOpeningQueue.enqueue(request);
    }
  }

  private async subscribeToChannelPoints(): Promise<void> {
    if (!this.sessionId || !this.appAccessToken) {
      console.error('Cannot subscribe: Missing session ID or app access token.');
      return;
    }

    console.log(`Subscribing to channel points redemption for channel ${this.CHANNEL_ID}...`);

    const subscriptionBody = {
      type: 'channel.channel_points_custom_reward_redemption.add',
      version: '1',
      condition: {
        broadcaster_user_id: this.CHANNEL_ID,
        reward_id: this.PACK_OPENING_REWARD_ID, // Subscribe only to the specific reward
      },
      transport: {
        method: 'websocket',
        session_id: this.sessionId,
      },
    };

    try {
      const response = await fetch(`${TWITCH_API_BASE_URL}/eventsub/subscriptions`, {
        method: 'POST',
        headers: {
          'Client-ID': this.CLIENT_ID,
          'Authorization': `Bearer ${this.appAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscriptionBody),
      });

      const data = await response.json() as TwitchSubscriptionResponse; // Type assertion
      if (response.ok) {
        console.log('Successfully subscribed to EventSub:', data.data[0].id);
      } else {
        console.error('Failed to subscribe to EventSub:', data);
        if (data.message && data.message.includes('The request for the subscription to be created has a condition that conflicts with the conditions of an existing subscription')) { // Check if message exists
            console.warn('Subscription already exists, continuing...');
        }
      }
    } catch (error) {
      console.error('Error subscribing to EventSub:', error);
    }
  }

  private async ensureAppAccessToken(): Promise<void> {
    if (this.appAccessToken && this.appAccessTokenExpiry > Date.now() + 60000) { // Refresh if less than 1 minute left
      return;
    }
    console.log('Fetching new Twitch App Access Token...');
    try {
      const response = await fetch(`${TWITCH_AUTH_BASE_URL}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.CLIENT_ID,
          client_secret: this.CLIENT_SECRET,
          grant_type: 'client_credentials',
        }).toString(),
      });

      const data = await response.json() as TwitchAppAccessTokenResponse; // Type assertion
      if (response.ok) {
        this.appAccessToken = data.access_token;
        this.appAccessTokenExpiry = Date.now() + data.expires_in * 1000;
        console.log('Successfully fetched Twitch App Access Token.');
      } else {
        console.error('Failed to fetch Twitch App Access Token:', data);
        throw new Error('Failed to fetch Twitch App Access Token.');
      }
    } catch (error) {
      console.error('Error fetching Twitch App Access Token:', error);
      throw error;
    }
  }

  // --- Helper for managing environment variables ---
  // A `.env` file for backend is needed with:
  // TWITCH_CLIENT_ID=your_twitch_client_id
  // TWITCH_CLIENT_SECRET=your_twitch_client_secret
  // TWITCH_EVENTSUB_SECRET=a_random_string_at_least_10_chars
  // TWITCH_CHANNEL_ID=your_broadcaster_user_id
  // TWITCH_PACK_OPENING_REWARD_ID=your_channel_points_reward_id
  // TWITCH_DEFAULT_SET_ID=an_id_of_a_set_in_your_db
}