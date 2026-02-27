import express, { Response } from 'express';
import { RtcTokenBuilder, RtcRole } from 'agora-access-token';
import pool from '../config/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

router.use(authenticateToken);

/**
 * @swagger
 * /api/video/token:
 *   post:
 *     summary: Generate Agora token for video call
 *     tags: [Video]
 *     security:
 *       - bearerAuth: []
 */
router.post('/token', async (req: AuthRequest, res: Response) => {
    const { appointmentId } = req.body;

    try {
        console.log('--- Video Token Request ---');
        console.log('Appointment ID:', appointmentId);
        console.log('User ID:', req.user!.id);
        console.log('User Role:', req.user!.role);

        // Get appointment details
        const appointment = await pool.query(
            `SELECT * FROM appointments
       WHERE id = $1`,
            [appointmentId]
        );

        console.log('Appointment found in DB:', appointment.rows.length > 0);
        if (appointment.rows.length > 0) {
            const appt = appointment.rows[0];
            console.log('Appt Patient ID:', appt.patient_id);
            console.log('Appt Doctor ID:', appt.doctor_id);
            console.log('Appt Status:', appt.status);

            const isAccessible = appt.patient_id === req.user!.id || appt.doctor_id === req.user!.id;
            const isCorrectStatus = ['scheduled', 'in_progress'].includes(appt.status);

            console.log('Is accessible for this user:', isAccessible);
            console.log('Is correct status:', isCorrectStatus);

            if (!isAccessible || !isCorrectStatus) {
                return res.status(404).json({
                    error: 'Appointment not found or not accessible'
                });
            }
        } else {
            return res.status(404).json({
                error: 'Appointment not found or not accessible'
            });
        }

        const appt = appointment.rows[0];

        // Check if appointment is within valid time window (±15 minutes)
        const appointmentDateTime = new Date(
            `${appt.appointment_date.toISOString().split('T')[0]}T${appt.start_time}`
        );
        const now = new Date();
        const timeDiff = Math.abs(now.getTime() - appointmentDateTime.getTime());
        const minutesDiff = Math.floor(timeDiff / (1000 * 60));

        if (minutesDiff > 15 && now < appointmentDateTime) {
            return res.status(400).json({
                error: 'Call can only be joined 15 minutes before appointment time'
            });
        }

        // Generate Agora token
        const appId = process.env.AGORA_APP_ID!;
        const appCertificate = process.env.AGORA_APP_CERTIFICATE!;
        const channelName = appt.video_channel_name;
        const uid = 0; // 0 means auto-assign
        const role = RtcRole.PUBLISHER;
        const expirationTimeInSeconds = 3600; // 1 hour
        const currentTimestamp = Math.floor(Date.now() / 1000);
        const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

        const token = RtcTokenBuilder.buildTokenWithUid(
            appId,
            appCertificate,
            channelName,
            uid,
            role,
            privilegeExpiredTs
        );

        // Update appointment status to in_progress if it's scheduled
        if (appt.status === 'scheduled') {
            await pool.query(
                'UPDATE appointments SET status = $1 WHERE id = $2',
                ['in_progress', appointmentId]
            );

            // Fetch enriched data for socket
            const enriched = await pool.query(
                `SELECT a.*, p.first_name as patient_first_name, p.last_name as patient_last_name,
                        d.first_name as doctor_first_name, d.last_name as doctor_last_name,
                        dp.specialization
                 FROM appointments a
                 JOIN users p ON a.patient_id = p.id
                 JOIN users d ON a.doctor_id = d.id
                 JOIN doctor_profiles dp ON d.id = dp.user_id
                 WHERE a.id = $1`,
                [appointmentId]
            );
            const { emitEvent } = require('../config/socket');
            emitEvent(`user_${appt.patient_id}`, 'appointment_updated', enriched.rows[0]);
            emitEvent(`user_${appt.doctor_id}`, 'appointment_updated', enriched.rows[0]);
        }

        res.json({
            token,
            channelName,
            appId,
            uid,
        });
    } catch (error) {
        console.error('Error generating video token:', error);
        res.status(500).json({ error: 'Server error generating video token' });
    }
});

/**
 * @swagger
 * /api/video/end-call:
 *   post:
 *     summary: End video call
 *     tags: [Video]
 *     security:
 *       - bearerAuth: []
 */
router.post('/end-call', async (req: AuthRequest, res: Response) => {
    const { appointmentId } = req.body;

    try {
        const result = await pool.query(
            `UPDATE appointments
       SET status = 'completed'
       WHERE id = $1 AND (patient_id = $2 OR doctor_id = $2)
       AND status = 'in_progress'
       RETURNING *`,
            [appointmentId, req.user!.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Appointment not found or call not in progress'
            });
        }

        const appt = result.rows[0];
        // Fetch enriched data for socket
        const enriched = await pool.query(
            `SELECT a.*, p.first_name as patient_first_name, p.last_name as patient_last_name,
                    d.first_name as doctor_first_name, d.last_name as doctor_last_name,
                    dp.specialization
             FROM appointments a
             JOIN users p ON a.patient_id = p.id
             JOIN users d ON a.doctor_id = d.id
             JOIN doctor_profiles dp ON d.id = dp.user_id
             WHERE a.id = $1`,
            [appointmentId]
        );
        const { emitEvent } = require('../config/socket');
        emitEvent(`user_${appt.patient_id}`, 'appointment_updated', enriched.rows[0]);
        emitEvent(`user_${appt.doctor_id}`, 'appointment_updated', enriched.rows[0]);

        res.json({
            message: 'Call ended successfully',
            appointment: enriched.rows[0],
        });
    } catch (error) {
        console.error('Error ending call:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
