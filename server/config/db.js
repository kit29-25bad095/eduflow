const mongoose = require('mongoose');

let mongodInstance = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/online-lms';

  try {
    // Attempt connecting to the configured URI with a short timeout
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500,
    });
    console.log(`[MongoDB] Connected to database: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (initialErr) {
    console.warn(`[MongoDB] Could not connect to ${uri}. Falling back to embedded MongoMemoryServer...`);

    try {
      const fs = require('fs');
      const path = require('path');
      const dataDir = path.join(__dirname, '..', '..', 'data', 'db');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongodInstance = await MongoMemoryServer.create({
        instance: {
          dbName: 'online-lms',
          dbPath: dataDir,
          storageEngine: 'wiredTiger',
        },
      });
      const memoryUri = mongodInstance.getUri();
      const conn = await mongoose.connect(memoryUri);
      console.log(`[MongoDB] Embedded database started with persistent disk storage at: ${memoryUri}`);
      return conn;
    } catch (fallbackErr) {
      console.error('[MongoDB] Failed to start MongoDB fallback:', fallbackErr.message);
      throw fallbackErr;
    }
  }
};

const closeDB = async () => {
  await mongoose.connection.close();
  if (mongodInstance) {
    await mongodInstance.stop();
  }
};

module.exports = { connectDB, closeDB };
