import { getDb } from '@/lib/mongodb';
import { v4 as uuidv4 } from 'uuid';

const COLLECTION_NAME = 'template_exceptions';

async function getCollection() {
  const db = await getDb();
  return db.collection(COLLECTION_NAME);
}

/**
 * Ensure database indexes for template_exceptions collection
 * Requirements: 8.1-8.6
 */
export async function ensureIndexes() {
  const collection = await getCollection();
  
  // Unique compound index on templateId and occurrenceDate
  await collection.createIndex(
    { templateId: 1, occurrenceDate: 1 }, 
    { unique: true }
  );
  
  // Single field index on templateId for efficient lookups
  await collection.createIndex({ templateId: 1 });
}

/**
 * Create a new template exception (or update if exists)
 * Requirements: 6.1, 6.2
 * 
 * @param {Object} exception - Exception data
 * @param {string} exception.templateId - Reference to template
 * @param {Date} exception.occurrenceDate - Original date of occurrence
 * @param {string} exception.exceptionType - "amount" | "date" | "skip"
 * @param {number} [exception.modifiedAmount] - New amount if type is "amount"
 * @param {Date} [exception.modifiedDate] - New date if type is "date"
 * @returns {Promise<Object>} Created or updated exception
 */
export async function createTemplateException(exception) {
  const collection = await getCollection();
  
  const newException = {
    id: uuidv4(),
    templateId: exception.templateId,
    occurrenceDate: exception.occurrenceDate,
    exceptionType: exception.exceptionType,
    modifiedAmount: exception.modifiedAmount || null,
    modifiedDate: exception.modifiedDate || null,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  // Upsert behavior: update if exists, insert if not
  const result = await collection.findOneAndUpdate(
    { 
      templateId: exception.templateId, 
      occurrenceDate: exception.occurrenceDate 
    },
    { 
      $set: {
        ...newException,
        updatedAt: new Date()
      }
    },
    { 
      upsert: true, 
      returnDocument: 'after' 
    }
  );
  
  return result;
}

/**
 * Get all exceptions for a specific template
 * Requirements: 6.3, 6.4
 * 
 * @param {string} templateId - Template ID
 * @returns {Promise<Array>} Array of exceptions
 */
export async function getTemplateExceptions(templateId) {
  const collection = await getCollection();
  return await collection.find({ templateId }).toArray();
}

/**
 * Get a specific exception by templateId and occurrenceDate
 * 
 * @param {string} templateId - Template ID
 * @param {Date} occurrenceDate - Occurrence date
 * @returns {Promise<Object|null>} Exception or null if not found
 */
export async function getTemplateException(templateId, occurrenceDate) {
  const collection = await getCollection();
  return await collection.findOne({ templateId, occurrenceDate });
}

/**
 * Delete a template exception
 * 
 * @param {string} templateId - Template ID
 * @param {Date} occurrenceDate - Occurrence date
 * @returns {Promise<boolean>} True if deleted, false otherwise
 */
export async function deleteTemplateException(templateId, occurrenceDate) {
  const collection = await getCollection();
  const result = await collection.deleteOne({ templateId, occurrenceDate });
  return result.deletedCount > 0;
}

/**
 * Delete all exceptions for a specific template
 * 
 * @param {string} templateId - Template ID
 * @returns {Promise<number>} Number of exceptions deleted
 */
export async function deleteTemplateExceptions(templateId) {
  const collection = await getCollection();
  const result = await collection.deleteMany({ templateId });
  return result.deletedCount;
}

/**
 * Get exceptions for a template within a date range
 * 
 * @param {string} templateId - Template ID
 * @param {Date} startDate - Start of date range
 * @param {Date} endDate - End of date range
 * @returns {Promise<Array>} Array of exceptions within the date range
 */
export async function getTemplateExceptionsInRange(templateId, startDate, endDate) {
  const collection = await getCollection();
  return await collection.find({
    templateId,
    occurrenceDate: {
      $gte: startDate,
      $lte: endDate
    }
  }).toArray();
}
