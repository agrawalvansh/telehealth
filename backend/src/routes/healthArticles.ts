import express, { Response } from 'express';
import pool from '../config/database';

const router = express.Router();

/**
 * @swagger
 * /api/health-articles:
 *   get:
 *     summary: Get published health articles (public)
 *     tags: [Health Articles]
 */
router.get('/', async (req, res: Response) => {
    const { category } = req.query;

    try {
        let query = `
      SELECT ha.id, ha.title, ha.content, ha.category, ha.created_at,
             u.first_name, u.last_name
      FROM health_articles ha
      LEFT JOIN users u ON ha.author_id = u.id
      WHERE ha.is_published = true
    `;

        const params: any[] = [];

        if (category) {
            query += ' AND ha.category = $1';
            params.push(category);
        }

        query += ' ORDER BY ha.created_at DESC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching health articles:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @swagger
 * /api/health-articles/{id}:
 *   get:
 *     summary: Get health article by ID (public)
 *     tags: [Health Articles]
 */
router.get('/:id', async (req, res: Response) => {
    try {
        const result = await pool.query(
            `SELECT ha.*, u.first_name, u.last_name
       FROM health_articles ha
       LEFT JOIN users u ON ha.author_id = u.id
       WHERE ha.id = $1 AND ha.is_published = true`,
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Article not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching health article:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
