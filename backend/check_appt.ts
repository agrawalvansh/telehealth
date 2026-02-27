import pool from './src/config/database';
import fs from 'fs';

async function checkAppt() {
    try {
        const result = await pool.query(`
            SELECT a.*, u.email as patient_email 
            FROM appointments a 
            JOIN users u ON a.patient_id = u.id 
            WHERE a.id = '8e86f614-f7e3-496d-94d7-5c1e8c526920'
        `);
        fs.writeFileSync('appt_check.json', JSON.stringify(result.rows[0], null, 2));
        process.exit(0);
    } catch (err) {
        process.exit(1);
    }
}

checkAppt();
