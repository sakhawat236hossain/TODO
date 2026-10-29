const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME || 'clientnest';

if (!uri) {
  throw new Error('Missing MONGODB_URI. Set it in backend/.env');
}

let client;
let db;

async function connectDB() {
  if (db) return db;
  client = new MongoClient(uri);
  await client.connect();
  db = client.db(dbName);

  // Helpful indexes (safe to run every startup, no-op if they already exist)
  await db.collection('clients').createIndex({ status: 1 });
  await db.collection('clients').createIndex({ created_at: -1 });
  await db.collection('meetings').createIndex({ client_id: 1 });
  await db.collection('meetings').createIndex({ date: 1 });
  await db.collection('todos').createIndex({ linked_client_id: 1 });
  await db.collection('todos').createIndex({ timing: 1 });
  await db.collection('todos').createIndex({ status: 1 });
  await db.collection('daily_plans').createIndex({ date: 1 }, { unique: true });

  console.log(`Connected to MongoDB database: ${dbName}`);
  return db;
}

function getDB() {
  if (!db) {
    throw new Error('Database not connected yet. connectDB() must run before handling requests.');
  }
  return db;
}

module.exports = { connectDB, getDB };
