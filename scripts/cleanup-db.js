// Script to clean up all transactions and recurring templates from MongoDB
// Run with: node scripts/cleanup-db.js

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ledger';

async function cleanup() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    
    // Delete all transactions
    const transactionsResult = await db.collection('transactions').deleteMany({});
    console.log(`Deleted ${transactionsResult.deletedCount} transactions`);
    
    // Delete all recurring templates
    const templatesResult = await db.collection('recurringTemplates').deleteMany({});
    console.log(`Deleted ${templatesResult.deletedCount} recurring templates`);
    
    console.log('Database cleanup complete!');
  } catch (error) {
    console.error('Error cleaning up database:', error);
  } finally {
    await client.close();
  }
}

cleanup();
