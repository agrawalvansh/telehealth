import pool from '../config/database';
import cron from 'node-cron';
import { emitEvent } from '../config/socket';

export async function cleanupAppointments() {
    try {
        console.log('--- [Lifecycle] Checking for expired scheduled appointments ---');
        console.log(`Timestamp (UTC): ${new Date().toISOString()}`);

        // 1. Find appointments that are:
        // - In 'scheduled' status
        // - Time has passed (appointment_date + end_time < NOW)
        // We use UTC for consistency

        const expiredAppts = await pool.query(`
            SELECT id, patient_id, doctor_id, doctor_attended, patient_attended, status, 
                   appointment_date, end_time
            FROM appointments
            WHERE status = 'scheduled'
            AND (appointment_date + end_time) < (CURRENT_TIMESTAMP AT TIME ZONE 'UTC' - INTERVAL '15 minutes')
        `);

        if (expiredAppts.rows.length === 0) {
            console.log('✅ [Lifecycle] No expired appointments found.');
            return;
        }

        console.log(`ℹ️ [Lifecycle] Found ${expiredAppts.rows.length} expired scheduled appointments.`);

        for (const appt of expiredAppts.rows) {
            const bothAttended = appt.doctor_attended === true && appt.patient_attended === true;
            const newStatus = bothAttended ? 'completed' : 'missed';

            console.log(`🔄 [Lifecycle] ID: ${appt.id}`);
            console.log(`   - Creation: ${appt.appointment_date} ${appt.end_time}`);
            console.log(`   - Attendance: Dr:${appt.doctor_attended}, Pat:${appt.patient_attended}`);
            console.log(`   - Action: Transitioning status from 'scheduled' -> '${newStatus}'`);

            await pool.query(
                'UPDATE appointments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                [newStatus, appt.id]
            );

            // Notify via socket
            emitEvent(`user_${appt.patient_id}`, 'appointment_updated', {
                id: appt.id,
                status: newStatus,
                message: `Your appointment status was updated to ${newStatus}`
            });
            emitEvent(`user_${appt.doctor_id}`, 'appointment_updated', {
                id: appt.id,
                status: newStatus,
                message: `Appointment status updated to ${newStatus}`
            });

            console.log(`✅ [Lifecycle] Updated ID: ${appt.id} to ${newStatus}`);
        }
    } catch (error) {
        console.error('❌ [Lifecycle Error] Error during appointment lifecycle update:', error);
    }
}

// Schedule task to run every 5 minutes
export const startCleanupTask = () => {
    cron.schedule('*/5 * * * *', () => {
        cleanupAppointments();
    });
    console.log('⏲️ [Cleanup] Scheduled every 5 minutes.');
};

if (require.main === module) {
    cleanupAppointments().then(() => process.exit(0));
}
