import express, { Response } from 'express';
import pool from '../config/database';
import { authenticateToken, authorizeRoles, AuthRequest } from '../middleware/auth';

const router = express.Router();

/**
 * @swagger
 * /api/doctors:
 *   get:
 *     summary: Get all approved doctors (public)
 *     tags: [Doctors]
 */
router.get('/', async (req, res: Response) => {
    const { specialization, search, language } = req.query;

    try {
        let query = `
      SELECT u.id, u.first_name, u.last_name, u.email, u.phone,
             dp.specialization, dp.qualification, dp.experience_years,
             dp.hospital_name, dp.bio, dp.consultation_fee, dp.rating,
             dp.total_consultations, dp.preferred_languages
      FROM users u
      JOIN doctor_profiles dp ON u.id = dp.user_id
      WHERE u.role = 'doctor' AND u.is_approved = true AND u.is_active = true
    `;

        const params: any[] = [];
        let paramCount = 1;

        if (specialization) {
            query += ` AND dp.specialization ILIKE $${paramCount}`;
            params.push(`%${specialization}%`);
            paramCount++;
        }

        if (search) {
            query += ` AND (u.first_name ILIKE $${paramCount} OR u.last_name ILIKE $${paramCount} OR dp.specialization ILIKE $${paramCount})`;
            params.push(`%${search}%`);
            paramCount++;
        }

        if (language) {
            query += ` AND dp.preferred_languages ILIKE $${paramCount}`;
            params.push(`%${language}%`);
            paramCount++;
        }

        query += ' ORDER BY dp.rating DESC, dp.total_consultations DESC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching doctors:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @swagger
 * /api/doctors/{id}:
 *   get:
 *     summary: Get doctor details by ID
 *     tags: [Doctors]
 */
router.get('/:id', async (req, res: Response) => {
    try {
        const result = await pool.query(
            `SELECT u.id, u.first_name, u.last_name, u.email, u.phone,
              dp.specialization, dp.qualification, dp.experience_years,
              dp.hospital_name, dp.hospital_address, dp.bio, 
              dp.consultation_fee, dp.rating, dp.total_consultations,
              dp.preferred_languages
       FROM users u
       JOIN doctor_profiles dp ON u.id = dp.user_id
       WHERE u.id = $1 AND u.role = 'doctor' AND u.is_approved = true`,
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Doctor not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching doctor:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @swagger
 * /api/doctors/{id}/availability:
 *   get:
 *     summary: Get doctor's availability slots by ID (public)
 *     tags: [Doctors]
 */
router.get('/:id/availability', async (req, res: Response) => {
    try {
        const result = await pool.query(
            `SELECT * FROM availability_slots
       WHERE doctor_id = $1 AND is_available = true
       ORDER BY day_of_week, start_time`,
            [req.params.id]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching doctor availability:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Protected routes - require doctor authentication
router.use(authenticateToken);
router.use(authorizeRoles('doctor'));

/**
 * @swagger
 * /api/doctors/profile:
 *   get:
 *     summary: Get doctor's own profile
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 */
router.get('/me/profile', async (req: AuthRequest, res: Response) => {
    try {
        const result = await pool.query(
            `SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.is_approved,
              dp.specialization, dp.qualification, dp.experience_years,
              dp.hospital_name, dp.hospital_address, dp.registration_number,
              dp.bio, dp.consultation_fee, dp.rating, dp.total_consultations,
              dp.preferred_languages
       FROM users u
       JOIN doctor_profiles dp ON u.id = dp.user_id
       WHERE u.id = $1`,
            [req.user!.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching doctor profile:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @swagger
 * /api/doctors/profile:
 *   put:
 *     summary: Update doctor profile
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 */
router.put('/me/profile', async (req: AuthRequest, res: Response) => {
    const {
        firstName,
        lastName,
        phone,
        specialization,
        qualification,
        experienceYears,
        hospitalName,
        hospitalAddress,
        registrationNumber,
        bio,
        consultationFee,
        preferredLanguages,
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

        // Update doctor_profiles table
        await pool.query(
            `UPDATE doctor_profiles
       SET specialization = COALESCE($1, specialization),
           qualification = COALESCE($2, qualification),
           experience_years = COALESCE($3, experience_years),
           hospital_name = COALESCE($4, hospital_name),
           hospital_address = COALESCE($5, hospital_address),
           registration_number = COALESCE($6, registration_number),
           bio = COALESCE($7, bio),
           consultation_fee = COALESCE($8, consultation_fee),
           preferred_languages = COALESCE($9, preferred_languages)
       WHERE user_id = $10`,
            [
                specialization,
                qualification,
                experienceYears,
                hospitalName,
                hospitalAddress,
                registrationNumber,
                bio,
                consultationFee,
                preferredLanguages,
                req.user!.id,
            ]
        );

        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Error updating doctor profile:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @swagger
 * /api/doctors/appointments:
 *   get:
 *     summary: Get doctor's appointments
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 */
router.get('/me/appointments', async (req: AuthRequest, res: Response) => {
    try {
        const result = await pool.query(
            `SELECT a.*, 
              p.first_name as patient_first_name,
              p.last_name as patient_last_name,
              p.phone as patient_phone,
              pp.date_of_birth, pp.blood_group, pp.allergies, pp.chronic_conditions
       FROM appointments a
       JOIN users p ON a.patient_id = p.id
       LEFT JOIN patient_profiles pp ON p.id = pp.user_id
       WHERE a.doctor_id = $1
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
 * /api/doctors/availability:
 *   get:
 *     summary: Get doctor's availability slots
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 */
router.get('/me/availability', async (req: AuthRequest, res: Response) => {
    try {
        const result = await pool.query(
            `SELECT * FROM availability_slots
       WHERE doctor_id = $1
       ORDER BY day_of_week, start_time`,
            [req.user!.id]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching availability:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @swagger
 * /api/doctors/availability:
 *   post:
 *     summary: Add availability slot
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 */
router.post('/me/availability', async (req: AuthRequest, res: Response) => {
    const { dayOfWeek, startTime, endTime } = req.body;

    try {
        const result = await pool.query(
            `INSERT INTO availability_slots (doctor_id, day_of_week, start_time, end_time)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
            [req.user!.id, dayOfWeek, startTime, endTime]
        );

        res.status(201).json(result.rows[0]);
    } catch (error: any) {
        if (error.code === '23505') {
            // Unique constraint violation
            return res.status(400).json({ error: 'Slot already exists' });
        }
        console.error('Error adding availability:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @swagger
 * /api/doctors/availability/{id}:
 *   delete:
 *     summary: Delete availability slot
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/me/availability/:id', async (req: AuthRequest, res: Response) => {
    try {
        await pool.query(
            'DELETE FROM availability_slots WHERE id = $1 AND doctor_id = $2',
            [req.params.id, req.user!.id]
        );

        res.json({ message: 'Availability slot deleted' });
    } catch (error) {
        console.error('Error deleting availability:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @swagger
 * /api/doctors/patient-history/{patientId}:
 *   get:
 *     summary: Get patient's medical history (for doctor)
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 */
router.get('/patient-history/:patientId', async (req: AuthRequest, res: Response) => {
    try {
        const result = await pool.query(
            `SELECT mr.*, p.medications, p.instructions as prescription_instructions
       FROM medical_records mr
       LEFT JOIN prescriptions p ON mr.id = p.medical_record_id
       WHERE mr.patient_id = $1
       ORDER BY mr.created_at DESC`,
            [req.params.patientId]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching patient history:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
