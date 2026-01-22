import pool from './database';
import fs from 'fs';
import path from 'path';

async function setupDatabase() {
    try {
        console.log('🔧 Setting up database schema...');

        const schemaSQL = fs.readFileSync(
            path.join(__dirname, 'schema.sql'),
            'utf-8'
        );

        await pool.query(schemaSQL);

        console.log('✅ Database schema created successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error setting up database:', error);
        process.exit(1);
    }
}

setupDatabase();
