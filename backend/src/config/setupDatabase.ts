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

        // Split by semicolon, but handle the trigger/function blocks that use $$
        const queries = schemaSQL.split(/;(?=(?:[^$]*\$\$[^$]*\$\$)*[^$]*$)/).filter(q => q.trim().length > 0);

        console.log(`📝 Found ${queries.length} potential queries.`);

        for (let i = 0; i < queries.length; i++) {
            const query = queries[i].trim();
            if (!query) continue;

            try {
                await pool.query(query);
            } catch (err: any) {
                console.error(`❌ Error in query ${i + 1}:`);
                console.error('SQL:', query.substring(0, 100) + '...');
                console.error('Error:', err.message);
                // Continue to see other errors unless they are critical
            }
        }

        console.log('✅ Database schema processing complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    }
}

setupDatabase();
