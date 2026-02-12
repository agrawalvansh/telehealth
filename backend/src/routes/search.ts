import express, { Response } from 'express';
import pool from '../config/database';
import { authenticateToken, authorizeRoles, AuthRequest } from '../middleware/auth';

const router = express.Router();

// All routes require authentication as doctor or admin
router.use(authenticateToken);
router.use(authorizeRoles('doctor', 'admin'));

/**
 * @swagger
 * /api/search/patients:
 *   get:
 *     summary: Search patients by name, email, or phone (Global Search)
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query (name, email, or phone)
 *     responses:
 *       200:
 *         description: List of matching patients
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (only doctors and admins)
 */
router.get('/patients', async (req: AuthRequest, res: Response) => {
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
        return res.status(400).json({ error: 'Search query is required' });
    }

    try {
        // Search patients by name, email, or phone (case-insensitive, fuzzy matching)
        const result = await pool.query(
            `SELECT 
                u.id,
                u.first_name,
                u.last_name,
                u.email,
                u.phone,
                p.date_of_birth,
                p.gender,
                p.blood_group,
                p.city,
                p.state
            FROM users u
            LEFT JOIN patient_profiles p ON u.id = p.user_id
            WHERE u.role = 'patient' 
                AND u.is_active = true
                AND (
                    LOWER(u.first_name || ' ' || u.last_name) LIKE LOWER($1)
                    OR LOWER(u.email) LIKE LOWER($1)
                    OR u.phone LIKE $1
                    OR LOWER(u.first_name) LIKE LOWER($1)
                    OR LOWER(u.last_name) LIKE LOWER($1)
                )
            ORDER BY 
                CASE 
                    WHEN LOWER(u.first_name || ' ' || u.last_name) = LOWER($2) THEN 1
                    WHEN LOWER(u.first_name || ' ' || u.last_name) LIKE LOWER($1) THEN 2
                    ELSE 3
                END,
                u.first_name, u.last_name
            LIMIT 10`,
            [`%${q}%`, q]
        );

        // Log search for audit trail
        await pool.query(
            `INSERT INTO audit_logs (user_id, action, details, created_at)
             VALUES ($1, $2, $3, NOW())`,
            [
                req.user!.id,
                'PATIENT_SEARCH',
                JSON.stringify({ query: q, results_count: result.rows.length })
            ]
        ).catch(err => {
            // Log error but don't fail the request
            console.error('Error logging search audit:', err);
        });

        res.json(result.rows);
    } catch (error) {
        console.error('Error searching patients:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @swagger
 * /api/search/patients/{patientId}/overview:
 *   get:
 *     summary: Get comprehensive patient overview (for emergency access)
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *         description: Patient ID
 *     responses:
 *       200:
 *         description: Comprehensive patient medical overview
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (only doctors and admins)
 *       404:
 *         description: Patient not found
 */
router.get('/patients/:patientId/overview', async (req: AuthRequest, res: Response) => {
    const { patientId } = req.params;

    try {
        // Get basic patient profile
        const profileResult = await pool.query(
            `SELECT 
                u.id,
                u.first_name,
                u.last_name,
                u.email,
                u.phone,
                u.created_at as registered_date,
                p.date_of_birth,
                p.gender,
                p.blood_group,
                p.address,
                p.city,
                p.state,
                p.pincode,
                p.emergency_contact,
                p.allergies,
                p.chronic_conditions
            FROM users u
            LEFT JOIN patient_profiles p ON u.id = p.user_id
            WHERE u.id = $1 AND u.role = 'patient' AND u.is_active = true`,
            [patientId]
        );

        if (profileResult.rows.length === 0) {
            return res.status(404).json({ error: 'Patient not found' });
        }

        const profile = profileResult.rows[0];

        // Get medical records with doctor info
        const medicalRecordsResult = await pool.query(
            `SELECT 
                mr.id,
                mr.diagnosis,
                mr.symptoms,
                mr.notes,
                mr.created_at,
                d.first_name as doctor_first_name,
                d.last_name as doctor_last_name,
                dp.specialization,
                a.appointment_date,
                a.start_time
            FROM medical_records mr
            JOIN users d ON mr.doctor_id = d.id
            JOIN doctor_profiles dp ON d.id = dp.user_id
            LEFT JOIN appointments a ON mr.appointment_id = a.id
            WHERE mr.patient_id = $1
            ORDER BY mr.created_at DESC
            LIMIT 20`,
            [patientId]
        );

        // Get prescriptions
        const prescriptionsResult = await pool.query(
            `SELECT 
                p.id,
                p.medications,
                p.instructions,
                p.created_at,
                d.first_name as doctor_first_name,
                d.last_name as doctor_last_name,
                dp.specialization,
                a.appointment_date
            FROM prescriptions p
            JOIN users d ON p.doctor_id = d.id
            JOIN doctor_profiles dp ON d.id = dp.user_id
            LEFT JOIN appointments a ON p.appointment_id = a.id
            WHERE p.patient_id = $1
            ORDER BY p.created_at DESC
            LIMIT 20`,
            [patientId]
        );

        // Get appointment history
        const appointmentsResult = await pool.query(
            `SELECT 
                a.id,
                a.appointment_date,
                a.start_time,
                a.end_time,
                a.status,
                a.symptoms,
                d.first_name as doctor_first_name,
                d.last_name as doctor_last_name,
                dp.specialization,
                dp.hospital_name
            FROM appointments a
            JOIN users d ON a.doctor_id = d.id
            JOIN doctor_profiles dp ON d.id = dp.user_id
            WHERE a.patient_id = $1
            ORDER BY a.appointment_date DESC, a.start_time DESC
            LIMIT 20`,
            [patientId]
        );

        // Calculate statistics
        const statsResult = await pool.query(
            `SELECT 
                COUNT(DISTINCT a.id) as total_appointments,
                COUNT(DISTINCT CASE WHEN a.status = 'completed' THEN a.id END) as completed_appointments,
                MAX(a.appointment_date) as last_appointment_date,
                COUNT(DISTINCT mr.id) as total_medical_records,
                COUNT(DISTINCT p.id) as total_prescriptions
            FROM users u
            LEFT JOIN appointments a ON u.id = a.patient_id
            LEFT JOIN medical_records mr ON u.id = mr.patient_id
            LEFT JOIN prescriptions p ON u.id = p.patient_id
            WHERE u.id = $1`,
            [patientId]
        );

        const stats = statsResult.rows[0];

        // Log access for audit trail
        await pool.query(
            `INSERT INTO audit_logs (user_id, action, details, created_at)
             VALUES ($1, $2, $3, NOW())`,
            [
                req.user!.id,
                'PATIENT_OVERVIEW_ACCESS',
                JSON.stringify({
                    patient_id: patientId,
                    patient_name: `${profile.first_name} ${profile.last_name}`,
                    accessed_by: req.user!.role
                })
            ]
        ).catch(err => {
            console.error('Error logging overview access audit:', err);
        });

        // Return comprehensive overview
        res.json({
            profile,
            medicalRecords: medicalRecordsResult.rows,
            prescriptions: prescriptionsResult.rows,
            appointments: appointmentsResult.rows,
            statistics: {
                totalAppointments: parseInt(stats.total_appointments) || 0,
                completedAppointments: parseInt(stats.completed_appointments) || 0,
                lastAppointmentDate: stats.last_appointment_date,
                totalMedicalRecords: parseInt(stats.total_medical_records) || 0,
                totalPrescriptions: parseInt(stats.total_prescriptions) || 0
            }
        });
    } catch (error) {
        console.error('Error fetching patient overview:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
