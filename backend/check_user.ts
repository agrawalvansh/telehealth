import pool from './src/config/database';
import fs from 'fs';

async function checkUser() {
    try {
        const user = await pool.query("SELECT id, email, role FROM users WHERE email = 'ramesh.kumar@example.com'");
        if (user.rows.length === 0) {
            fs.writeFileSync('user_check.json', JSON.stringify({ error: 'User not found' }));
            process.exit(0);
        }
        const patientId = user.rows[0].id;
        const appts = await pool.query("SELECT * FROM appointments WHERE patient_id = $1", [patientId]);

        fs.writeFileSync('user_check.json', JSON.stringify({
            user: user.rows[0],
            appointments: appts.rows
        }, null, 2));
        process.exit(0);
    } catch (err) {
        process.exit(1);
    }
}

checkUser();
