import server from './server';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

async function bootstrap() {
  server.start(PORT); // Start HTTP and Socket.IO server
  await server.startTwitchEventSub(); // Start Twitch EventSub WebSocket connection
}

bootstrap().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});