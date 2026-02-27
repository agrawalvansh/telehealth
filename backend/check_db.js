const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function checkAndCreateDatabase() {
    const dbName = 'telehealth_db';
    const connectionString = process.env.DATABASE_URL;

    // Create connection to default 'postgres' database to check/create target database
    const client = new Client({
        connectionString: connectionString.replace(`/${dbName}`, '/postgres'),
    });

    try {
        await client.connect();
        const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = '${dbName}'`);

        if (res.rowCount === 0) {
            console.log(`🚀 Database "${dbName}" not found. Creating...`);
            await client.query(`CREATE DATABASE ${dbName}`);
            console.log(`✅ Database "${dbName}" created successfully!`);
        } else {
            console.log(`✅ Database "${dbName}" already exists.`);
        }
    } catch (err) {
        console.error('❌ Error checking/creating database:', err);
    } finally {
        await client.end();
    }
}

checkAndCreateDatabase();
