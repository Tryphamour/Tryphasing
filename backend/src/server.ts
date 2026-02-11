import express, { Express } from 'express';
import { createServer, Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import adminController from './api/admin.controller'; // Our admin routes

// --- Repositories ---
import { CardRepository } from './repositories/card.repository';
import { SetRepository } from './repositories/set.repository';
import { ViewerRepository } from './repositories/viewer.repository';
import { CollectionRepository } from './repositories/collection.repository';
import { DropRateRepository } from './repositories/drop-rate.repository';

// --- Services ---
import { CardService } from './services/card.service';
import { SetService } from './services/set.service';
import { ViewerService } from './services/viewer.service';
import { CollectionService } from './services/collection.service';
import { DropRateService } from './services/drop-rate.service';
import { PackOpeningService } from './services/pack-opening.service';

// --- Queue ---
import { PackOpeningQueue } from './queue/pack-opening.queue';

// --- Twitch Integration ---
import { TwitchEventSubService } from './twitch/eventsub.service';

class Server {
  public app: Express;
  public httpServer: HttpServer;
  public io: SocketIOServer;

  // Repositories
  private cardRepository: CardRepository;
  private setRepository: SetRepository;
  private viewerRepository: ViewerRepository;
  private collectionRepository: CollectionRepository;
  private dropRateRepository: DropRateRepository;

  // Services
  private cardService: CardService;
  private setService: SetService;
  private viewerService: ViewerService;
  private collectionService: CollectionService;
  private dropRateService: DropRateService;
  private packOpeningService: PackOpeningService;

  // Queue
  private packOpeningQueue: PackOpeningQueue;

  // Twitch
  private twitchEventSubService: TwitchEventSubService;

  constructor() {
    this.app = express();
    this.httpServer = createServer(this.app);
    this.io = new SocketIOServer(this.httpServer, {
      cors: {
        origin: "*", // Allow all origins for local development, refine later
        methods: ["GET", "POST", "PUT", "DELETE"]
      }
    });

    // --- Instantiate Repositories ---
    this.cardRepository = new CardRepository();
    this.setRepository = new SetRepository();
    this.viewerRepository = new ViewerRepository();
    this.collectionRepository = new CollectionRepository();
    this.dropRateRepository = new DropRateRepository();

    // --- Instantiate Services ---
    this.cardService = new CardService(this.cardRepository, this.setRepository);
    this.setService = new SetService(this.setRepository, this.cardRepository);
    this.viewerService = new ViewerService(this.viewerRepository);
    this.collectionService = new CollectionService(this.collectionRepository, this.cardRepository, this.setRepository);
    this.dropRateService = new DropRateService(this.dropRateRepository);
    this.packOpeningService = new PackOpeningService(
      this.viewerService,
      this.collectionService,
      this.dropRateService,
      this.cardRepository,
      this.setRepository
    );

    // --- Instantiate Queue ---
    this.packOpeningQueue = new PackOpeningQueue(this.io, this.packOpeningService);

    // --- Instantiate Twitch Service ---
    this.twitchEventSubService = new TwitchEventSubService(this.packOpeningQueue, this.viewerService);


    this.configureMiddleware();
    this.configureRoutes();
    this.configureSocketIO(); // Pass dependencies here
  }

  private configureMiddleware(): void {
    this.app.use(cors()); // Enable CORS for all routes
    this.app.use(express.json()); // Enable JSON body parsing
  }

  private configureRoutes(): void {
    // Mount admin routes
    this.app.use('/api/admin', adminController); // adminController already instantiates its own services

    // Basic health check route
    this.app.get('/api/health', (req, res) => {
      res.status(200).json({ status: 'ok', timestamp: new Date() });
    });

    // Catch-all for undefined routes
    this.app.use((req, res) => {
      res.status(404).send('Not Found');
    });
  }

  private configureSocketIO(): void {
    this.io.on('connection', (socket) => {
      console.log(`Socket.IO client connected: ${socket.id}`);

      // Listener for animation completion from frontend
      socket.on('animationComplete', (requestId: string, resultData: any) => { // resultData could be PackOpeningResult
        console.log(`AnimationComplete event received from ${socket.id} for request ${requestId}`);
        this.packOpeningQueue.resolveAnimationComplete(requestId, resultData);
      });

      socket.on('disconnect', () => {
        console.log(`Socket.IO client disconnected: ${socket.id}`);
      });
    });
  }

  public async start(port: number): Promise<void> {
    this.httpServer.listen(port, () => {
      console.log(`Server running on port ${port}`);
      console.log(`Admin API available at http://localhost:${port}/api/admin`);
      console.log(`Socket.IO server available at ws://localhost:${port}`);
    });
  }

  public async startTwitchEventSub(): Promise<void> {
    await this.twitchEventSubService.start();
  }
}

export default new Server();