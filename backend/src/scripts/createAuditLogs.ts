import pool from '../config/database';

async function createAuditLogsTable() {
    try {
        console.log('🔧 Creating audit_logs table...');

        const createTableSQL = `
            -- Create audit_logs table if it doesn't exist
            CREATE TABLE IF NOT EXISTS audit_logs (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                action VARCHAR(100) NOT NULL,
                details JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Create indexes for better query performance
            CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
            CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
            CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
        `;

        await pool.query(createTableSQL);

        console.log('✅ audit_logs table created successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating audit_logs table:', error);
        process.exit(1);
    }
}

createAuditLogsTable();
