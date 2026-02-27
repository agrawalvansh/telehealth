import pool from './src/config/database';
import fs from 'fs';

async function inspect() {
    try {
        const result = await pool.query('SELECT id, status, appointment_date, start_time, end_time, created_at, updated_at FROM appointments ORDER BY created_at DESC LIMIT 10');
        const now = await pool.query('SELECT NOW() as db_now, CURRENT_TIMESTAMP as db_ct');

        const output = {
            recent_appointments: result.rows,
            database_time: now.rows
        };

        fs.writeFileSync('db_inspect_results.json', JSON.stringify(output, null, 2));
        console.log('Results written to db_inspect_results.json');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

inspect();
