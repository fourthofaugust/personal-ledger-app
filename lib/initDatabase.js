/**
 * Database Initialization Script
 * 
 * This script ensures all required database indexes are created for the
 * recurring payment projection feature.
 * 
 * Call this function manually via the /api/init-indexes endpoint or
 * during application deployment/setup.
 * 
 * Requirements: 8.1-8.6
 */

import { ensureIndexes as ensureTransactionTemplateIndexes } from './models/transactionTemplate.js';
import { ensureIndexes as ensureTemplateExceptionIndexes } from './models/templateException.js';
import { ensureIndexes as ensureTransactionIndexes } from './models/transaction.js';

/**
 * Initialize all database indexes
 * 
 * This function creates all required indexes for the recurring payment
 * projection feature. It's safe to call multiple times as MongoDB will
 * skip creating indexes that already exist.
 * 
 * @returns {Promise<void>}
 */
export async function initializeDatabase() {
  try {
    console.log('Initializing database indexes...');
    
    // Create indexes for transaction_templates collection
    await ensureTransactionTemplateIndexes();
    console.log('✓ Transaction template indexes created');
    
    // Create indexes for template_exceptions collection
    await ensureTemplateExceptionIndexes();
    console.log('✓ Template exception indexes created');
    
    // Create indexes for transactions collection
    await ensureTransactionIndexes();
    console.log('✓ Transaction indexes created');
    
    console.log('Database initialization complete');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}
