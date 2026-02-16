import { getDb } from '@/lib/mongodb';
import { v4 as uuidv4 } from 'uuid';

const COLLECTION_NAME = 'transaction_templates';

async function getCollection() {
  const db = await getDb();
  return db.collection(COLLECTION_NAME);
}

/**
 * Ensure database indexes for transaction_templates collection
 * Requirements: 8.1-8.3
 */
export async function ensureIndexes() {
  const collection = await getCollection();
  
  // Unique index on id field
  await collection.createIndex({ id: 1 }, { unique: true });
  
  // Single field indexes
  await collection.createIndex({ active: 1 });
  await collection.createIndex({ startDate: 1 });
  
  // Compound index for efficient querying of active templates within date ranges
  await collection.createIndex({ active: 1, startDate: 1, endDate: 1 });
}

/**
 * Create a new transaction template
 * Requirements: 1.1-1.12
 * 
 * @param {Object} template - Template data
 * @param {string} template.type - "Income" or "Expense"
 * @param {string} template.company - Company/payee name
 * @param {string[]} template.tags - Categorization tags
 * @param {Date} template.startDate - When template becomes active
 * @param {Date} [template.endDate] - Optional end date
 * @param {Object} template.recurrence - Recurrence pattern
 * @param {string} template.recurrence.frequency - "daily" | "weekly" | "monthly" | "yearly"
 * @param {number} [template.recurrence.dayOfMonth] - 1-31 for monthly recurrence
 * @param {number} [template.recurrence.dayOfWeek] - 0-6 for weekly recurrence
 * @param {string} template.amountType - "fixed" or "variable"
 * @param {number} [template.fixedAmount] - For fixed recurring amounts
 * @param {number} [template.estimatedAmount] - For variable amounts (forecasting)
 * @param {boolean} [template.active] - Template active status (defaults to true)
 * @returns {Promise<Object>} Created template
 */
export async function createTransactionTemplate(template) {
  const collection = await getCollection();
  
  const newTemplate = {
    id: uuidv4(),
    type: template.type,
    company: template.company,
    tags: template.tags || [],
    startDate: template.startDate,
    endDate: template.endDate || null,
    recurrence: {
      frequency: template.recurrence.frequency,
      dayOfMonth: template.recurrence.dayOfMonth || null,
      dayOfWeek: template.recurrence.dayOfWeek || null
    },
    amountType: template.amountType,
    fixedAmount: template.fixedAmount || null,
    estimatedAmount: template.estimatedAmount || null,
    active: template.active !== undefined ? template.active : true,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  await collection.insertOne(newTemplate);
  return newTemplate;
}

/**
 * Get all transaction templates matching the filter
 * 
 * @param {Object} filter - MongoDB filter object
 * @returns {Promise<Array>} Array of templates
 */
export async function getTransactionTemplates(filter = {}) {
  const collection = await getCollection();
  return await collection.find(filter).toArray();
}

/**
 * Get a single transaction template by ID
 * 
 * @param {string} id - Template ID
 * @returns {Promise<Object|null>} Template or null if not found
 */
export async function getTransactionTemplateById(id) {
  const collection = await getCollection();
  return await collection.findOne({ id });
}

/**
 * Update a transaction template
 * Requirements: 10.1-10.3
 * 
 * @param {string} id - Template ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated template
 */
export async function updateTransactionTemplate(id, updates) {
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

/**
 * Deactivate a transaction template (soft delete)
 * Requirements: 10.5
 * 
 * @param {string} id - Template ID
 * @returns {Promise<Object>} Updated template
 */
export async function deactivateTransactionTemplate(id) {
  return await updateTransactionTemplate(id, { active: false });
}

/**
 * Delete a transaction template (hard delete)
 * 
 * @param {string} id - Template ID
 * @returns {Promise<boolean>} True if deleted, false otherwise
 */
export async function deleteTransactionTemplate(id) {
  const collection = await getCollection();
  const result = await collection.deleteOne({ id });
  return result.deletedCount > 0;
}

/**
 * Get all active transaction templates
 * Requirements: 3.1
 * 
 * @returns {Promise<Array>} Array of active templates
 */
export async function getActiveTransactionTemplates() {
  const collection = await getCollection();
  return await collection.find({ active: true }).toArray();
}

/**
 * Get active templates within a date range
 * Requirements: 3.1, 3.7
 * 
 * @param {Date} startDate - Start of date range
 * @param {Date} endDate - End of date range
 * @returns {Promise<Array>} Array of active templates overlapping the date range
 */
export async function getActiveTemplatesInRange(startDate, endDate) {
  const collection = await getCollection();
  
  return await collection.find({
    active: true,
    startDate: { $lte: endDate },
    $or: [
      { endDate: null },
      { endDate: { $gte: startDate } }
    ]
  }).toArray();
}
