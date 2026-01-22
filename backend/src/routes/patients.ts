import express, { Response } from 'express';
import { body, validationResult } from 'express-validator';
import pool from '../config/database';
import { authenticateToken, authorizeRoles, AuthRequest } from '../middleware/auth';

const router = express.Router();

// All routes require authentication as patient
router.use(authenticateToken);
router.use(authorizeRoles('patient'));

/**
 * @swagger
 * /api/patients/profile:
 *   get:
 *     summary: Get patient profile
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 */
router.get('/profile', async (req: AuthRequest, res: Response) => {
    try {
        const result = await pool.query(
            `SELECT u.id, u.email, u.first_name, u.last_name, u.phone,
              p.date_of_birth, p.gender, p.blood_group, p.address, p.city, 
              p.state, p.pincode, p.emergency_contact, p.allergies, p.chronic_conditions
       FROM users u
       LEFT JOIN patient_profiles p ON u.id = p.user_id
       WHERE u.id = $1`,
            [req.user!.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching patient profile:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @swagger
 * /api/patients/profile:
 *   put:
 *     summary: Update patient profile
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 */
router.put('/profile', async (req: AuthRequest, res: Response) => {
    const {
        firstName,
        lastName,
        phone,
        dateOfBirth,
        gender,
        bloodGroup,
        address,
        city,
        state,
        pincode,
        emergencyContact,
        allergies,
        chronicConditions,
    } = req.body;

    try {
        // Update users table
        await pool.query(
            `UPDATE users 
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           phone = COALESCE($3, phone)
       WHERE id = $4`,
            [firstName, lastName, phone, req.user!.id]
        );

        // Update patient_profiles table
        await pool.query(
            `UPDATE patient_profiles
       SET date_of_birth = COALESCE($1, date_of_birth),
           gender = COALESCE($2, gender),
           blood_group = COALESCE($3, blood_group),
           address = COALESCE($4, address),
           city = COALESCE($5, city),
           state = COALESCE($6, state),
           pincode = COALESCE($7, pincode),
           emergency_contact = COALESCE($8, emergency_contact),
           allergies = COALESCE($9, allergies),
           chronic_conditions = COALESCE($10, chronic_conditions)
       WHERE user_id = $11`,
            [
                dateOfBirth,
                gender,
                bloodGroup,
                address,
                city,
                state,
                pincode,
                emergencyContact,
                allergies,
                chronicConditions,
                req.user!.id,
            ]
        );

        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Error updating patient profile:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @swagger
 * /api/patients/appointments:
 *   get:
 *     summary: Get patient's appointments
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 */
router.get('/appointments', async (req: AuthRequest, res: Response) => {
    try {
        const result = await pool.query(
            `SELECT a.*, 
              d.first_name as doctor_first_name,
              d.last_name as doctor_last_name,
              dp.specialization,
              dp.hospital_name
       FROM appointments a
       JOIN users d ON a.doctor_id = d.id
       JOIN doctor_profiles dp ON d.id = dp.user_id
       WHERE a.patient_id = $1
       ORDER BY a.appointment_date DESC, a.start_time DESC`,
            [req.user!.id]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching appointments:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @swagger
 * /api/patients/medical-history:
 *   get:
 *     summary: Get patient's medical history
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 */
router.get('/medical-history', async (req: AuthRequest, res: Response) => {
    try {
        const result = await pool.query(
            `SELECT mr.*,
              d.first_name as doctor_first_name,
              d.last_name as doctor_last_name,
              dp.specialization,
              a.appointment_date
       FROM medical_records mr
       JOIN users d ON mr.doctor_id = d.id
       JOIN doctor_profiles dp ON d.id = dp.user_id
       LEFT JOIN appointments a ON mr.appointment_id = a.id
       WHERE mr.patient_id = $1
       ORDER BY mr.created_at DESC`,
            [req.user!.id]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching medical history:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @swagger
 * /api/patients/prescriptions:
 *   get:
 *     summary: Get patient's prescriptions
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 */
router.get('/prescriptions', async (req: AuthRequest, res: Response) => {
    try {
        const result = await pool.query(
            `SELECT p.*,
              d.first_name as doctor_first_name,
              d.last_name as doctor_last_name,
              dp.specialization,
              a.appointment_date
       FROM prescriptions p
       JOIN users d ON p.doctor_id = d.id
       JOIN doctor_profiles dp ON d.id = dp.user_id
       LEFT JOIN appointments a ON p.appointment_id = a.id
       WHERE p.patient_id = $1
       ORDER BY p.created_at DESC`,
            [req.user!.id]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching prescriptions:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
