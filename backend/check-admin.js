require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function checkAdminUser() {
    try {
        console.log('🔍 Checking database connection...');
        console.log('Database URL:', process.env.DATABASE_URL?.replace(/:[^:]*@/, ':****@'));

        // Test connection
        const client = await pool.connect();
        console.log('✅ Database connected successfully!\n');

        // Check if admin user exists
        console.log('🔍 Checking for admin user...');
        const result = await client.query(
            "SELECT id, email, role, first_name, last_name, is_approved, is_active FROM users WHERE email = 'admin@telehealth.com'"
        );

        if (result.rows.length > 0) {
            console.log('✅ Admin user found:');
            console.log(result.rows[0]);
            console.log('\nℹ️  User details:');
            console.log('  - Email:', result.rows[0].email);
            console.log('  - Role:', result.rows[0].role);
            console.log('  - Approved:', result.rows[0].is_approved);
            console.log('  - Active:', result.rows[0].is_active);
        } else {
            console.log('❌ Admin user NOT found in database!');
            console.log('ℹ️  You need to run: npm run seed');
        }

        // Check total users
        const countResult = await client.query('SELECT COUNT(*) FROM users');
        console.log('\n📊 Total users in database:', countResult.rows[0].count);

        client.release();
        await pool.end();
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.error('\n⚠️  PostgreSQL is not running or connection details are incorrect.');
            console.error('   Check your .env DATABASE_URL setting.');
        } else if (error.code === '3D000') {
            console.error('\n⚠️  Database "telehealth_db" does not exist.');
            console.error('   Run: npm run db:setup');
        } else if (error.code === '42P01') {
            console.error('\n⚠️  Table "users" does not exist.');
            console.error('   Run: npm run db:setup');
        }
        process.exit(1);
    }
}

checkAdminUser();
