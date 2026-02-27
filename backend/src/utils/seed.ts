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
       ON CONFLICT (email) DO UPDATE SET 
            password_hash = EXCLUDED.password_hash,
            is_approved = EXCLUDED.is_approved,
            is_active = EXCLUDED.is_active
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
            {
                email: 'dr.singh@telehealth.com',
                firstName: 'Vikram',
                lastName: 'Singh',
                phone: '+91-9876543214',
                specialization: 'Neurologist',
                qualification: 'MBBS, DM (Neurology)',
                experienceYears: 20,
                hospitalName: 'Medanta',
                hospitalAddress: 'Gurugram, Haryana',
                registrationNumber: 'MCI-56789',
                bio: 'Specialist in neurological disorders with over 20 years of experience.',
                consultationFee: 1000,
            },
            {
                email: 'dr.verma@telehealth.com',
                firstName: 'Anjali',
                lastName: 'Verma',
                phone: '+91-9876543215',
                specialization: 'Gynecologist',
                qualification: 'MBBS, MS (OBG)',
                experienceYears: 14,
                hospitalName: 'Cloudnine',
                hospitalAddress: 'Mumbai, Maharashtra',
                registrationNumber: 'MCI-67890',
                bio: 'Dedicated to women’s health and wellness throughout all stages of life.',
                consultationFee: 750,
            }
        ];

        const doctorIds = [];
        for (const doctor of doctors) {
            const password = await bcrypt.hash('doctor123', 10);
            const userResult = await pool.query(
                `INSERT INTO users (email, password_hash, role, first_name, last_name, phone, is_approved, is_active)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                 ON CONFLICT (email) DO UPDATE SET 
                    first_name = EXCLUDED.first_name,
                    last_name = EXCLUDED.last_name,
                    is_approved = EXCLUDED.is_approved,
                    is_active = EXCLUDED.is_active
                 RETURNING id`,
                [doctor.email, password, 'doctor', doctor.firstName, doctor.lastName, doctor.phone, true, true]
            );

            const doctorId = userResult.rows[0].id;
            doctorIds.push(doctorId);

            await pool.query(
                `INSERT INTO doctor_profiles (user_id, specialization, qualification, experience_years, hospital_name, hospital_address, registration_number, bio, consultation_fee, rating, total_consultations, preferred_languages)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                 ON CONFLICT (user_id) DO UPDATE SET
                    specialization = EXCLUDED.specialization,
                    qualification = EXCLUDED.qualification,
                    bio = EXCLUDED.bio,
                    consultation_fee = EXCLUDED.consultation_fee,
                    preferred_languages = EXCLUDED.preferred_languages`,
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
                    4.5 + Math.random() * 0.5,
                    Math.floor(Math.random() * 100) + 50,
                    'English, Hindi', // Default for seed
                ]
            );

            // Add availability slots (Monday to Friday, 9 AM to 5 PM)
            for (let day = 0; day <= 6; day++) { // Now weekly
                await pool.query(
                    `INSERT INTO availability_slots (doctor_id, day_of_week, start_time, end_time, is_available)
                     VALUES ($1, $2, $3, $4, $5)
                     ON CONFLICT (doctor_id, day_of_week, start_time) DO NOTHING`,
                    [doctorId, day, '09:00', '13:00', true]
                );
                await pool.query(
                    `INSERT INTO availability_slots (doctor_id, day_of_week, start_time, end_time, is_available)
                     VALUES ($1, $2, $3, $4, $5)
                     ON CONFLICT (doctor_id, day_of_week, start_time) DO NOTHING`,
                    [doctorId, day, '14:00', '18:00', true]
                );
            }
        }

        console.log(`✅ ${doctors.length} doctors created/updated with availability slots`);

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
                chronicConditions: 'None',
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
        ];

        const patientIds = [];
        for (const patient of patients) {
            const password = await bcrypt.hash('patient123', 10);
            const userResult = await pool.query(
                `INSERT INTO users (email, password_hash, role, first_name, last_name, phone, is_approved, is_active)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                 ON CONFLICT (email) DO UPDATE SET 
                    first_name = EXCLUDED.first_name,
                    last_name = EXCLUDED.last_name
                 RETURNING id`,
                [patient.email, password, 'patient', patient.firstName, patient.lastName, patient.phone, true, true]
            );

            const patientId = userResult.rows[0].id;
            patientIds.push(patientId);

            await pool.query(
                `INSERT INTO patient_profiles (user_id, date_of_birth, gender, blood_group, city, state, allergies, chronic_conditions)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                 ON CONFLICT (user_id) DO UPDATE SET
                    date_of_birth = EXCLUDED.date_of_birth,
                    gender = EXCLUDED.gender,
                    blood_group = EXCLUDED.blood_group,
                    allergies = EXCLUDED.allergies,
                    chronic_conditions = EXCLUDED.chronic_conditions`,
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

            // Add medical records for first patient
            if (patient.email === 'ramesh.kumar@example.com' && doctorIds.length > 0) {
                const mrResult = await pool.query(
                    `INSERT INTO medical_records (patient_id, doctor_id, diagnosis, symptoms, notes, vital_signs)
                     VALUES ($1, $2, $3, $4, $5, $6)
                     RETURNING id`,
                    [
                        patientId,
                        doctorIds[0],
                        'Seasonal Flu',
                        'Fever, Cough, Body ache',
                        'Patient advised to take complete rest and stay hydrated.',
                        JSON.stringify({ bp: '120/80', temp: '101 F', weight: '70kg' })
                    ]
                );

                await pool.query(
                    `INSERT INTO prescriptions (medical_record_id, patient_id, doctor_id, medications, instructions)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [
                        mrResult.rows[0].id,
                        patientId,
                        doctorIds[0],
                        JSON.stringify([
                            { name: 'Paracetamol', dosage: '500mg', frequency: 'Thrice a day', duration: '5 days' },
                            { name: 'Cough Syrup', dosage: '10ml', frequency: 'Twice a day', duration: '5 days' }
                        ]),
                        'Avoid cold drinks and oily food.'
                    ]
                );
            }
        }

        console.log(`✅ ${patients.length} patients created/updated with medical history`);

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
