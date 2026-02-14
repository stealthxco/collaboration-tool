import Server from './server';

// Create and start the server
const server = new Server();

server.start().catch((error) => {
  console.error('💥 Failed to start Mission Control Backend:', error);
  process.exit(1);
});

export default server;