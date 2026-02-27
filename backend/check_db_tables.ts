import pool from './src/config/database';
import fs from 'fs';

async function check() {
    try {
        const users = await pool.query("SELECT id, email, role, is_approved FROM users WHERE role = 'doctor'");
        const profiles = await pool.query("SELECT * FROM doctor_profiles");

        const output = {
            doctors_in_users: users.rows,
            doctor_profiles: profiles.rows
        };

        fs.writeFileSync('db_tables_check.json', JSON.stringify(output, null, 2));
        process.exit(0);
    } catch (err) {
        process.exit(1);
    }
}

check();
