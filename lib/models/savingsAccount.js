import { getDb } from '@/lib/mongodb';
import { v4 as uuidv4 } from 'uuid';

const COLLECTION_NAME = 'savingsAccounts';

async function getCollection() {
  const db = await getDb();
  return db.collection(COLLECTION_NAME);
}

export async function createSavingsAccount(account) {
  const collection = await getCollection();
  
  const newAccount = {
    id: uuidv4(),
    ...account,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  await collection.insertOne(newAccount);
  return newAccount;
}

export async function getSavingsAccounts() {
  const collection = await getCollection();
  const accounts = await collection
    .find({})
    .sort({ name: 1 })
    .toArray();
  return accounts;
}

export async function getSavingsAccountById(id) {
  const collection = await getCollection();
  return await collection.findOne({ id });
}

export async function updateSavingsAccount(id, updates) {
  const collection = await getCollection();
  
  const result = await collection.findOneAndUpdate(
    { id },
    { 
      $set: { 
        ...updates, 
        updatedAt: new Date() 
      } 
    },
    { returnDocument: 'after' }
  );
  
  return result;
}

export async function deleteSavingsAccount(id) {
  const collection = await getCollection();
  const result = await collection.deleteOne({ id });
  return result.deletedCount > 0;
}
