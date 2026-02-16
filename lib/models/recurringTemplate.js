import { getDb } from '@/lib/mongodb';
import { v4 as uuidv4 } from 'uuid';

const COLLECTION_NAME = 'recurringTemplates';

async function getCollection() {
  const db = await getDb();
  return db.collection(COLLECTION_NAME);
}

export async function ensureIndexes() {
  const collection = await getCollection();
  await collection.createIndex({ id: 1 }, { unique: true });
  await collection.createIndex({ isActive: 1 });
}

export async function createRecurringTemplate(template) {
  const collection = await getCollection();
  
  const newTemplate = {
    id: uuidv4(),
    ...template,
    isActive: template.isActive !== undefined ? template.isActive : true,
    lastGenerated: template.lastGenerated || null,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  await collection.insertOne(newTemplate);
  return newTemplate;
}

export async function getRecurringTemplates(filter = {}) {
  const collection = await getCollection();
  return await collection.find(filter).toArray();
}

export async function getRecurringTemplateById(id) {
  const collection = await getCollection();
  return await collection.findOne({ id });
}

export async function updateRecurringTemplate(id, updates) {
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

export async function deleteRecurringTemplate(id) {
  const collection = await getCollection();
  const result = await collection.deleteOne({ id });
  return result.deletedCount > 0;
}

export async function getActiveTemplates() {
  const collection = await getCollection();
  return await collection.find({ isActive: true }).toArray();
}
