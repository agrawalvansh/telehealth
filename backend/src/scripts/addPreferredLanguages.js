const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function addPreferredLanguages() {
    try {
        console.log('🔧 Adding preferred_languages column to doctor_profiles...');

        const sql = `
            -- Add preferred_languages column if it doesn't exist
            DO $$ 
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='doctor_profiles' 
                    AND column_name='preferred_languages'
                ) THEN
                    ALTER TABLE doctor_profiles 
                    ADD COLUMN preferred_languages TEXT;
                    
                    RAISE NOTICE 'Column preferred_languages added successfully';
                ELSE
                    RAISE NOTICE 'Column preferred_languages already exists';
                END IF;
            END $$;
        `;

        await pool.query(sql);

        console.log('✅ preferred_languages column added successfully!');
        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error adding preferred_languages column:', error);
        await pool.end();
        process.exit(1);
    }
}

addPreferredLanguages();
