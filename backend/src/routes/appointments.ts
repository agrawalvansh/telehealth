import express, { Response } from 'express';
import { body, validationResult } from 'express-validator';
import pool from '../config/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

router.use(authenticateToken);

/**
 * @swagger
 * /api/appointments:
 *   post:
 *     summary: Book a new appointment
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 */
router.post(
    '/',
    [
        body('doctorId').isUUID(),
        body('appointmentDate').isDate(),
        body('startTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
        body('endTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    ],
    async (req: AuthRequest, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { doctorId, appointmentDate, startTime, endTime, symptoms } = req.body;

        try {
            // Check if slot is already booked
            const existingAppointment = await pool.query(
                `SELECT id FROM appointments
         WHERE doctor_id = $1 AND appointment_date = $2 AND start_time = $3
         AND status != 'cancelled'`,
                [doctorId, appointmentDate, startTime]
            );

            if (existingAppointment.rows.length > 0) {
                return res.status(400).json({ error: 'This slot is already booked' });
            }

            // Check if doctor has availability for this day/time
            const dayOfWeek = new Date(appointmentDate).getDay();
            const availability = await pool.query(
                `SELECT id FROM availability_slots
         WHERE doctor_id = $1 AND day_of_week = $2 
         AND start_time <= $3 AND end_time >= $4
         AND is_available = true`,
                [doctorId, dayOfWeek, startTime, endTime]
            );

            if (availability.rows.length === 0) {
                return res.status(400).json({
                    error: 'Doctor is not available at this time'
                });
            }

            // Create appointment
            const videoChannelName = `appointment_${Date.now()}_${req.user!.id}`;

            const result = await pool.query(
                `INSERT INTO appointments 
         (patient_id, doctor_id, appointment_date, start_time, end_time, symptoms, video_channel_name)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
                [req.user!.id, doctorId, appointmentDate, startTime, endTime, symptoms, videoChannelName]
            );

            res.status(201).json({
                message: 'Appointment booked successfully',
                appointment: result.rows[0],
            });
        } catch (error: any) {
            console.error('Error booking appointment:', error);
            if (error.code === '23505') {
                return res.status(400).json({ error: 'Appointment slot conflict' });
            }
            res.status(500).json({ error: 'Server error' });
        }
    }
);

/**
 * @swagger
 * /api/appointments/{id}:
 *   get:
 *     summary: Get appointment details
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const result = await pool.query(
            `SELECT a.*,
              p.first_name as patient_first_name,
              p.last_name as patient_last_name,
              d.first_name as doctor_first_name,
              d.last_name as doctor_last_name,
              dp.specialization, dp.hospital_name
       FROM appointments a
       JOIN users p ON a.patient_id = p.id
       JOIN users d ON a.doctor_id = d.id
       JOIN doctor_profiles dp ON d.id = dp.user_id
       WHERE a.id = $1 AND (a.patient_id = $2 OR a.doctor_id = $2)`,
            [req.params.id, req.user!.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching appointment:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @swagger
 * /api/appointments/{id}/status:
 *   patch:
 *     summary: Update appointment status
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/:id/status', async (req: AuthRequest, res: Response) => {
    const { status } = req.body;

    if (!['scheduled', 'in_progress', 'completed', 'cancelled'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    try {
        const result = await pool.query(
            `UPDATE appointments
       SET status = $1
       WHERE id = $2 AND (patient_id = $3 OR doctor_id = $3)
       RETURNING *`,
            [status, req.params.id, req.user!.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        res.json({
            message: 'Appointment status updated',
            appointment: result.rows[0],
        });
    } catch (error) {
        console.error('Error updating appointment status:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @swagger
 * /api/appointments/{id}/cancel:
 *   post:
 *     summary: Cancel appointment
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/cancel', async (req: AuthRequest, res: Response) => {
    const { reason } = req.body;

    try {
        const result = await pool.query(
            `UPDATE appointments
       SET status = 'cancelled', cancellation_reason = $1
       WHERE id = $2 AND (patient_id = $3 OR doctor_id = $3)
       AND status = 'scheduled'
       RETURNING *`,
            [reason, req.params.id, req.user!.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Appointment not found or cannot be cancelled'
            });
        }

        res.json({
            message: 'Appointment cancelled successfully',
            appointment: result.rows[0],
        });
    } catch (error) {
        console.error('Error cancelling appointment:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @swagger
 * /api/appointments/{id}/reschedule:
 *   post:
 *     summary: Reschedule appointment
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/reschedule', async (req: AuthRequest, res: Response) => {
    const { appointmentDate, startTime, endTime } = req.body;

    try {
        // Get current appointment
        const current = await pool.query(
            'SELECT * FROM appointments WHERE id = $1 AND patient_id = $2',
            [req.params.id, req.user!.id]
        );

        if (current.rows.length === 0) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        const appointment = current.rows[0];

        // Check if new slot is available
        const conflict = await pool.query(
            `SELECT id FROM appointments
       WHERE doctor_id = $1 AND appointment_date = $2 AND start_time = $3
       AND status != 'cancelled' AND id != $4`,
            [appointment.doctor_id, appointmentDate, startTime, req.params.id]
        );

        if (conflict.rows.length > 0) {
            return res.status(400).json({ error: 'New slot is already booked' });
        }

        // Update appointment
        const result = await pool.query(
            `UPDATE appointments
       SET appointment_date = $1, start_time = $2, end_time = $3
       WHERE id = $4
       RETURNING *`,
            [appointmentDate, startTime, endTime, req.params.id]
        );

        res.json({
            message: 'Appointment rescheduled successfully',
            appointment: result.rows[0],
        });
    } catch (error) {
        console.error('Error rescheduling appointment:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @swagger
 * /api/appointments/{id}/medical-record:
 *   post:
 *     summary: Add medical record and prescription (doctor only)
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/medical-record', async (req: AuthRequest, res: Response) => {
    if (req.user!.role !== 'doctor') {
        return res.status(403).json({ error: 'Only doctors can add medical records' });
    }

    const { diagnosis, symptoms, notes, vitalSigns, medications, instructions } = req.body;

    try {
        // Get appointment
        const appointment = await pool.query(
            'SELECT * FROM appointments WHERE id = $1 AND doctor_id = $2',
            [req.params.id, req.user!.id]
        );

        if (appointment.rows.length === 0) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        const appt = appointment.rows[0];

        // Create medical record
        const medicalRecord = await pool.query(
            `INSERT INTO medical_records 
       (patient_id, doctor_id, appointment_id, diagnosis, symptoms, notes, vital_signs)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
            [appt.patient_id, req.user!.id, req.params.id, diagnosis, symptoms, notes, vitalSigns]
        );

        // Create prescription if medications provided
        if (medications && medications.length > 0) {
            await pool.query(
                `INSERT INTO prescriptions 
         (medical_record_id, appointment_id, patient_id, doctor_id, medications, instructions)
         VALUES ($1, $2, $3, $4, $5, $6)`,
                [
                    medicalRecord.rows[0].id,
                    req.params.id,
                    appt.patient_id,
                    req.user!.id,
                    JSON.stringify(medications),
                    instructions,
                ]
            );
        }

        // Update appointment status to completed
        await pool.query(
            'UPDATE appointments SET status = $1 WHERE id = $2',
            ['completed', req.params.id]
        );

        // Update doctor's total consultations
        await pool.query(
            `UPDATE doctor_profiles 
       SET total_consultations = total_consultations + 1
       WHERE user_id = $1`,
            [req.user!.id]
        );

        res.status(201).json({
            message: 'Medical record added successfully',
            medicalRecord: medicalRecord.rows[0],
        });
    } catch (error) {
        console.error('Error adding medical record:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
