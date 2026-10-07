require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const { connectDB } = require('./config/db');
const { initSocket } = require('./sockets/socketHandler');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // 1. Connect to Database
    await connectDB();

    // 2. Create HTTP Server
    const server = http.createServer(app);

    // 3. Initialize Socket.IO
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5555';
    const io = new Server(server, {
      cors: {
        origin: [
          clientUrl,
          'http://localhost:5555',
          'http://127.0.0.1:5555',
          'http://localhost:5173',
          'http://127.0.0.1:5173',
        ],
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        credentials: true,
      },
    });

    initSocket(io);

    // 4. Start Listening
    server.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`🚀 LMS Server is running on port ${PORT}`);
      console.log(`🌐 API Health Check: http://localhost:${PORT}/api/health`);
      console.log(`📡 Socket.IO Real-time service active`);
      console.log(`=======================================================`);
    });

    // Handle Unhandled Promise Rejections
    process.on('unhandledRejection', (err) => {
      console.error(`Unhandled Rejection Error: ${err.message}`);
    });
  } catch (err) {
    console.error('Fatal Server Boot Error:', err);
    process.exit(1);
  }
};

startServer();
