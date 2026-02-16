#!/usr/bin/env node

/**
 * Standalone script to initialize database indexes
 * 
 * This script can be run manually to ensure all required database indexes
 * are created for the recurring payment projection feature.
 * 
 * Usage: node scripts/init-indexes.js
 * 
 * Requirements: 8.1-8.6
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '..', '.env.local') });

// Import with relative paths
const { initializeDatabase } = await import('../lib/initDatabase.js');
const { closeConnection } = await import('../lib/mongodb.js');

async function main() {
  try {
    console.log('Starting database index initialization...\n');
    
    await initializeDatabase();
    
    console.log('\n✓ All indexes created successfully!');
    console.log('\nIndexes created:');
    console.log('  transaction_templates:');
    console.log('    - id (unique)');
    console.log('    - active');
    console.log('    - startDate');
    console.log('    - (active, startDate, endDate) compound');
    console.log('  template_exceptions:');
    console.log('    - (templateId, occurrenceDate) compound unique');
    console.log('    - templateId');
    console.log('  transactions:');
    console.log('    - id (unique)');
    console.log('    - date');
    console.log('    - templateId');
    console.log('    - isPending');
    console.log('    - (templateId, date) compound');
    
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Error initializing database indexes:', error);
    process.exit(1);
  } finally {
    await closeConnection();
  }
}

main();
