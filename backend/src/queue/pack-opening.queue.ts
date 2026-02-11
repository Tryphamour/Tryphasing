import { Server as SocketIOServer } from 'socket.io';
import { PackOpeningService, PackOpeningResult } from '../services/pack-opening.service';
import { CollectionService } from '../services/collection.service'; // For dependency injection
import { DropRateService } from '../services/drop-rate.service'; // For dependency injection
import { CardRepository } from '../repositories/card.repository'; // For dependency injection
import { SetRepository } from '../repositories/set.repository'; // For dependency injection
import { ViewerService } from '../services/viewer.service'; // For dependency injection

export interface PackOpeningRequest {
  viewerId: string;
  twitchId: string; // Used for identifying the viewer
  username: string; // Used for identifying the viewer
  setId: string;
  requestId: string; // Unique ID for this specific pack opening instance
  socketId?: string; // Optional: The socket ID of the client that triggered the opening (e.g., OBS overlay)
}

interface AnimationCompletionResolver {
  resolve: (value: PackOpeningResult) => void;
  reject: (reason?: any) => void;
}

export class PackOpeningQueue {
  private queue: PackOpeningRequest[] = [];
  private isProcessing: boolean = false;
  private io: SocketIOServer;
  private packOpeningService: PackOpeningService;
  private completionPromises = new Map<string, AnimationCompletionResolver>();

  constructor(
    io: SocketIOServer,
    packOpeningService: PackOpeningService,
  ) {
    this.io = io;
    this.packOpeningService = packOpeningService;

    // Listen for animation completion from the client (e.g., OBS overlay)
    this.io.on('connection', (socket) => {
      socket.on('animationComplete', (requestId: string) => {
        const resolver = this.completionPromises.get(requestId);
        if (resolver) {
          console.log(`Animation for request ${requestId} completed.`);
          // Resolve the promise, value will be the PackOpeningResult
          // The PackOpeningResult should be stored and passed here. This needs refinement.
          // For now, we just resolve.
          resolver.resolve({} as PackOpeningResult); // Resolving with empty for now.
          this.completionPromises.delete(requestId);
        }
      });
    });
  }

  enqueue(request: PackOpeningRequest): void {
    console.log(`Enqueuing pack opening request: ${request.requestId} for viewer ${request.username}`);
    this.queue.push(request);
    this.processQueue();
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const currentRequest = this.queue.shift(); // Get the next request

    if (!currentRequest) {
      this.isProcessing = false;
      return;
    }

    console.log(`Processing pack opening request: ${currentRequest.requestId} for viewer ${currentRequest.username}`);

    try {
      const result = await this.packOpeningService.openPack(currentRequest.viewerId, currentRequest.setId);
      console.log(`Pack opened for ${currentRequest.username}: ${result.openedCard.name}`);

      // Emit event to a specific client (if socketId is provided) or to all connected clients
      this.io.emit('packOpeningStarted', {
        requestId: currentRequest.requestId,
        viewer: { id: currentRequest.viewerId, username: currentRequest.username },
        card: result.openedCard,
        stats: {
          distinctCardsInSet: result.distinctCardsInSet,
          totalDistinctCards: result.totalDistinctCards,
        },
      });

      // Wait for animation completion from the frontend
      await new Promise<PackOpeningResult>((resolve, reject) => {
        this.completionPromises.set(currentRequest.requestId, { resolve, reject });
      });

      this.io.emit('packOpeningComplete', { requestId: currentRequest.requestId }); // Signal completion globally
    } catch (error) {
      console.error(`Error processing pack opening request ${currentRequest.requestId}:`, error);
      this.io.emit('packOpeningError', { requestId: currentRequest.requestId, error: (error as Error).message });
    } finally {
      this.isProcessing = false;
      this.processQueue(); // Process the next item in the queue
    }
  }

  // This method will be called by an external Socket.IO listener in server.ts
  public resolveAnimationComplete(requestId: string, resultData: PackOpeningResult): void {
    const resolver = this.completionPromises.get(requestId);
    if (resolver) {
        console.log(`Animation completion received for request ${requestId}.`);
        resolver.resolve(resultData); // Resolve with actual result data if needed
        this.completionPromises.delete(requestId);
    }
  }
}
