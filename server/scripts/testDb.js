const { connectDB, closeDB } = require('../config/db');

async function test() {
  console.log('Testing DB connection...');
  try {
    const conn = await connectDB();
    console.log('Database successfully connected:', conn.connection.host);
    await closeDB();
    console.log('Database connection cleanly closed.');
    process.exit(0);
  } catch (err) {
    console.error('Database connection test failed:', err);
    process.exit(1);
  }
}

test();
