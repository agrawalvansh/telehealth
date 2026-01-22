import express, { Response } from 'express';
import pool from '../config/database';
import { authenticateToken, authorizeRoles, AuthRequest } from '../middleware/auth';

const router = express.Router();

// All routes require admin authentication
router.use(authenticateToken);
router.use(authorizeRoles('admin'));

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: Get system statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get('/stats', async (req: AuthRequest, res: Response) => {
    try {
        const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE role = 'patient') as total_patients,
        (SELECT COUNT(*) FROM users WHERE role = 'doctor' AND is_approved = true) as total_doctors,
        (SELECT COUNT(*) FROM users WHERE role = 'doctor' AND is_approved = false) as pending_doctors,
        (SELECT COUNT(*) FROM appointments WHERE status = 'scheduled') as scheduled_appointments,
        (SELECT COUNT(*) FROM appointments WHERE status = 'completed') as completed_appointments,
        (SELECT COUNT(*) FROM appointments WHERE status = 'cancelled') as cancelled_appointments,
        (SELECT COUNT(*) FROM medical_records) as total_medical_records,
        (SELECT COUNT(*) FROM prescriptions) as total_prescriptions
    `);

        res.json(stats.rows[0]);
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get('/users', async (req: AuthRequest, res: Response) => {
    const { role } = req.query;

    try {
        let query = 'SELECT id, email, role, first_name, last_name, phone, is_active, is_approved, created_at FROM users';
        const params: any[] = [];

        if (role) {
            query += ' WHERE role = $1';
            params.push(role);
        }

        query += ' ORDER BY created_at DESC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @swagger
 * /api/admin/doctors/pending:
 *   get:
 *     summary: Get pending doctor approvals
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get('/doctors/pending', async (req: AuthRequest, res: Response) => {
    try {
        const result = await pool.query(
            `SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.created_at,
              dp.specialization, dp.qualification, dp.experience_years,
              dp.hospital_name, dp.registration_number
       FROM users u
       JOIN doctor_profiles dp ON u.id = dp.user_id
       WHERE u.role = 'doctor' AND u.is_approved = false
       ORDER BY u.created_at DESC`
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching pending doctors:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @swagger
 * /api/admin/doctors/{id}/approve:
 *   post:
 *     summary: Approve doctor account
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.post('/doctors/:id/approve', async (req: AuthRequest, res: Response) => {
    try {
        const result = await pool.query(
            `UPDATE users
       SET is_approved = true
       WHERE id = $1 AND role = 'doctor'
       RETURNING id, email, first_name, last_name, is_approved`,
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Doctor not found' });
        }

        res.json({
            message: 'Doctor approved successfully',
            doctor: result.rows[0],
        });
    } catch (error) {
        console.error('Error approving doctor:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @swagger
 * /api/admin/users/{id}/deactivate:
 *   post:
 *     summary: Deactivate user account
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.post('/users/:id/deactivate', async (req: AuthRequest, res: Response) => {
    try {
        const result = await pool.query(
            `UPDATE users
       SET is_active = false
       WHERE id = $1
       RETURNING id, email, first_name, last_name, is_active`,
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            message: 'User deactivated successfully',
            user: result.rows[0],
        });
    } catch (error) {
        console.error('Error deactivating user:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @swagger
 * /api/admin/users/{id}/activate:
 *   post:
 *     summary: Activate user account
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.post('/users/:id/activate', async (req: AuthRequest, res: Response) => {
    try {
        const result = await pool.query(
            `UPDATE users
       SET is_active = true
       WHERE id = $1
       RETURNING id, email, first_name, last_name, is_active`,
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            message: 'User activated successfully',
            user: result.rows[0],
        });
    } catch (error) {
        console.error('Error activating user:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @swagger
 * /api/admin/health-articles:
 *   get:
 *     summary: Get all health articles
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get('/health-articles', async (req: AuthRequest, res: Response) => {
    try {
        const result = await pool.query(
            `SELECT ha.*, u.first_name, u.last_name
       FROM health_articles ha
       LEFT JOIN users u ON ha.author_id = u.id
       ORDER BY ha.created_at DESC`
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching health articles:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @swagger
 * /api/admin/health-articles:
 *   post:
 *     summary: Create health article
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.post('/health-articles', async (req: AuthRequest, res: Response) => {
    const { title, content, category, isPublished } = req.body;

    try {
        const result = await pool.query(
            `INSERT INTO health_articles (title, content, category, author_id, is_published)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
            [title, content, category, req.user!.id, isPublished || false]
        );

        res.status(201).json({
            message: 'Health article created successfully',
            article: result.rows[0],
        });
    } catch (error) {
        console.error('Error creating health article:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @swagger
 * /api/admin/health-articles/{id}:
 *   put:
 *     summary: Update health article
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.put('/health-articles/:id', async (req: AuthRequest, res: Response) => {
    const { title, content, category, isPublished } = req.body;

    try {
        const result = await pool.query(
            `UPDATE health_articles
       SET title = COALESCE($1, title),
           content = COALESCE($2, content),
           category = COALESCE($3, category),
           is_published = COALESCE($4, is_published)
       WHERE id = $5
       RETURNING *`,
            [title, content, category, isPublished, req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Article not found' });
        }

        res.json({
            message: 'Health article updated successfully',
            article: result.rows[0],
        });
    } catch (error) {
        console.error('Error updating health article:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @swagger
 * /api/admin/health-articles/{id}:
 *   delete:
 *     summary: Delete health article
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/health-articles/:id', async (req: AuthRequest, res: Response) => {
    try {
        await pool.query('DELETE FROM health_articles WHERE id = $1', [req.params.id]);
        res.json({ message: 'Health article deleted successfully' });
    } catch (error) {
        console.error('Error deleting health article:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
