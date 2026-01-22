import pool from '../config/database';
import bcrypt from 'bcrypt';

async function seed() {
    try {
        console.log('🌱 Starting database seeding...');

        // Create admin user
        const adminPassword = await bcrypt.hash('admin123', 10);
        const adminResult = await pool.query(
            `INSERT INTO users (email, password_hash, role, first_name, last_name, is_approved, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
            ['admin@telehealth.com', adminPassword, 'admin', 'System', 'Admin', true, true]
        );

        console.log('✅ Admin user created');

        // Create doctors
        const doctors = [
            {
                email: 'dr.sharma@telehealth.com',
                firstName: 'Rajesh',
                lastName: 'Sharma',
                phone: '+91-9876543210',
                specialization: 'Cardiologist',
                qualification: 'MBBS, MD (Cardiology)',
                experienceYears: 15,
                hospitalName: 'Apollo Hospital',
                hospitalAddress: 'Jubilee Hills, Hyderabad',
                registrationNumber: 'MCI-12345',
                bio: 'Experienced cardiologist specializing in heart disease prevention and treatment. Available for remote consultations.',
                consultationFee: 800,
            },
            {
                email: 'dr.patel@telehealth.com',
                firstName: 'Priya',
                lastName: 'Patel',
                phone: '+91-9876543211',
                specialization: 'General Physician',
                qualification: 'MBBS, MD (General Medicine)',
                experienceYears: 10,
                hospitalName: 'Fortis Hospital',
                hospitalAddress: 'Bannerghatta Road, Bangalore',
                registrationNumber: 'MCI-23456',
                bio: 'General physician with expertise in treating common ailments and preventive healthcare.',
                consultationFee: 500,
            },
            {
                email: 'dr.kumar@telehealth.com',
                firstName: 'Amit',
                lastName: 'Kumar',
                phone: '+91-9876543212',
                specialization: 'Pediatrician',
                qualification: 'MBBS, MD (Pediatrics)',
                experienceYears: 12,
                hospitalName: 'Max Healthcare',
                hospitalAddress: 'Saket, New Delhi',
                registrationNumber: 'MCI-34567',
                bio: 'Pediatrician specializing in child healthcare and development. Passionate about rural health.',
                consultationFee: 600,
            },
            {
                email: 'dr.reddy@telehealth.com',
                firstName: 'Lakshmi',
                lastName: 'Reddy',
                phone: '+91-9876543213',
                specialization: 'Dermatologist',
                qualification: 'MBBS, MD (Dermatology)',
                experienceYears: 8,
                hospitalName: 'KIMS Hospital',
                hospitalAddress: 'Secunderabad, Telangana',
                registrationNumber: 'MCI-45678',
                bio: 'Dermatologist with focus on skin conditions common in rural areas.',
                consultationFee: 700,
            },
        ];

        const doctorIds = [];
        for (const doctor of doctors) {
            const password = await bcrypt.hash('doctor123', 10);
            const userResult = await pool.query(
                `INSERT INTO users (email, password_hash, role, first_name, last_name, phone, is_approved, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (email) DO NOTHING
         RETURNING id`,
                [doctor.email, password, 'doctor', doctor.firstName, doctor.lastName, doctor.phone, true, true]
            );

            if (userResult.rows.length > 0) {
                const doctorId = userResult.rows[0].id;
                doctorIds.push(doctorId);

                await pool.query(
                    `INSERT INTO doctor_profiles (user_id, specialization, qualification, experience_years, hospital_name, hospital_address, registration_number, bio, consultation_fee, rating, total_consultations)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           ON CONFLICT (user_id) DO NOTHING`,
                    [
                        doctorId,
                        doctor.specialization,
                        doctor.qualification,
                        doctor.experienceYears,
                        doctor.hospitalName,
                        doctor.hospitalAddress,
                        doctor.registrationNumber,
                        doctor.bio,
                        doctor.consultationFee,
                        4.5 + Math.random() * 0.5, // Random rating between 4.5-5.0
                        Math.floor(Math.random() * 100) + 50, // Random consultations 50-150
                    ]
                );

                // Add availability slots (Monday to Friday, 9 AM to 5 PM)
                for (let day = 1; day <= 5; day++) {
                    await pool.query(
                        `INSERT INTO availability_slots (doctor_id, day_of_week, start_time, end_time, is_available)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (doctor_id, day_of_week, start_time) DO NOTHING`,
                        [doctorId, day, '09:00', '17:00', true]
                    );
                }
            }
        }

        console.log(`✅ ${doctors.length} doctors created with availability slots`);

        // Create patients
        const patients = [
            {
                email: 'ramesh.kumar@example.com',
                firstName: 'Ramesh',
                lastName: 'Kumar',
                phone: '+91-9123456789',
                dateOfBirth: '1985-05-15',
                gender: 'Male',
                bloodGroup: 'O+',
                city: 'Ranchi',
                state: 'Jharkhand',
                allergies: 'Penicillin',
            },
            {
                email: 'sunita.devi@example.com',
                firstName: 'Sunita',
                lastName: 'Devi',
                phone: '+91-9123456790',
                dateOfBirth: '1990-08-22',
                gender: 'Female',
                bloodGroup: 'A+',
                city: 'Patna',
                state: 'Bihar',
                chronicConditions: 'Diabetes Type 2',
            },
            {
                email: 'vijay.singh@example.com',
                firstName: 'Vijay',
                lastName: 'Singh',
                phone: '+91-9123456791',
                dateOfBirth: '1978-12-10',
                gender: 'Male',
                bloodGroup: 'B+',
                city: 'Lucknow',
                state: 'Uttar Pradesh',
            },
            {
                email: 'anita.sharma@example.com',
                firstName: 'Anita',
                lastName: 'Sharma',
                phone: '+91-9123456792',
                dateOfBirth: '1995-03-18',
                gender: 'Female',
                bloodGroup: 'AB+',
                city: 'Jaipur',
                state: 'Rajasthan',
            },
            {
                email: 'mohan.lal@example.com',
                firstName: 'Mohan',
                lastName: 'Lal',
                phone: '+91-9123456793',
                dateOfBirth: '1982-07-25',
                gender: 'Male',
                bloodGroup: 'O-',
                city: 'Bhopal',
                state: 'Madhya Pradesh',
                allergies: 'Sulfa drugs',
                chronicConditions: 'Hypertension',
            },
        ];

        const patientIds = [];
        for (const patient of patients) {
            const password = await bcrypt.hash('patient123', 10);
            const userResult = await pool.query(
                `INSERT INTO users (email, password_hash, role, first_name, last_name, phone, is_approved, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (email) DO NOTHING
         RETURNING id`,
                [patient.email, password, 'patient', patient.firstName, patient.lastName, patient.phone, true, true]
            );

            if (userResult.rows.length > 0) {
                const patientId = userResult.rows[0].id;
                patientIds.push(patientId);

                await pool.query(
                    `INSERT INTO patient_profiles (user_id, date_of_birth, gender, blood_group, city, state, allergies, chronic_conditions)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (user_id) DO NOTHING`,
                    [
                        patientId,
                        patient.dateOfBirth,
                        patient.gender,
                        patient.bloodGroup,
                        patient.city,
                        patient.state,
                        patient.allergies || null,
                        patient.chronicConditions || null,
                    ]
                );
            }
        }

        console.log(`✅ ${patients.length} patients created`);

        // Create sample appointments
        if (doctorIds.length > 0 && patientIds.length > 0) {
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const nextWeek = new Date(today);
            nextWeek.setDate(nextWeek.getDate() + 7);

            const appointments = [
                {
                    patientId: patientIds[0],
                    doctorId: doctorIds[0],
                    date: tomorrow.toISOString().split('T')[0],
                    startTime: '10:00',
                    endTime: '10:30',
                    symptoms: 'Chest pain and shortness of breath',
                    status: 'scheduled',
                },
                {
                    patientId: patientIds[1],
                    doctorId: doctorIds[1],
                    date: tomorrow.toISOString().split('T')[0],
                    startTime: '14:00',
                    endTime: '14:30',
                    symptoms: 'Fever and body ache for 3 days',
                    status: 'scheduled',
                },
                {
                    patientId: patientIds[2],
                    doctorId: doctorIds[2],
                    date: nextWeek.toISOString().split('T')[0],
                    startTime: '11:00',
                    endTime: '11:30',
                    symptoms: 'Child has persistent cough',
                    status: 'scheduled',
                },
            ];

            for (const appt of appointments) {
                const channelName = `appointment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                await pool.query(
                    `INSERT INTO appointments (patient_id, doctor_id, appointment_date, start_time, end_time, symptoms, status, video_channel_name)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                    [appt.patientId, appt.doctorId, appt.date, appt.startTime, appt.endTime, appt.symptoms, appt.status, channelName]
                );
            }

            console.log(`✅ ${appointments.length} sample appointments created`);
        }

        // Create health articles
        const articles = [
            {
                title: 'Understanding Diabetes: Prevention and Management',
                content: `Diabetes is a chronic condition that affects how your body processes blood sugar. Here are key points for prevention and management:

1. **Healthy Diet**: Focus on whole grains, fruits, vegetables, and lean proteins
2. **Regular Exercise**: Aim for at least 30 minutes of moderate activity daily
3. **Weight Management**: Maintain a healthy weight to reduce risk
4. **Regular Monitoring**: Check blood sugar levels as recommended
5. **Medication Compliance**: Take prescribed medications on time

Early detection and proper management can help prevent complications.`,
                category: 'Chronic Diseases',
                isPublished: true,
            },
            {
                title: 'Heart Health: Tips for a Healthy Heart',
                content: `Your heart is your body's engine. Keep it healthy with these tips:

1. **Eat Heart-Healthy Foods**: Include omega-3 fatty acids, reduce saturated fats
2. **Stay Active**: Regular cardiovascular exercise strengthens your heart
3. **Manage Stress**: Practice relaxation techniques like meditation
4. **Quit Smoking**: Smoking is a major risk factor for heart disease
5. **Control Blood Pressure**: Monitor and manage hypertension
6. **Limit Alcohol**: Moderate consumption only

Regular check-ups can help detect issues early.`,
                category: 'Heart Health',
                isPublished: true,
            },
            {
                title: 'Common Cold vs Flu: Know the Difference',
                content: `While both are respiratory illnesses, they differ in severity:

**Common Cold:**
- Gradual onset
- Mild symptoms
- Runny nose, sore throat
- Rarely causes complications

**Flu:**
- Sudden onset
- Severe symptoms
- High fever, body aches
- Can lead to serious complications

**When to See a Doctor:**
- High fever lasting more than 3 days
- Difficulty breathing
- Chest pain
- Severe weakness

Stay hydrated and get plenty of rest for both conditions.`,
                category: 'General Health',
                isPublished: true,
            },
        ];

        if (adminResult.rows.length > 0) {
            for (const article of articles) {
                await pool.query(
                    `INSERT INTO health_articles (title, content, category, author_id, is_published)
           VALUES ($1, $2, $3, $4, $5)`,
                    [article.title, article.content, article.category, adminResult.rows[0].id, article.isPublished]
                );
            }

            console.log(`✅ ${articles.length} health articles created`);
        }

        console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   ✅  Database seeding completed successfully!           ║
║                                                           ║
║   👤  Admin: admin@telehealth.com / admin123             ║
║   👨‍⚕️  Doctors: dr.*.@telehealth.com / doctor123          ║
║   🧍  Patients: *.@example.com / patient123              ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    `);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
}

seed();
