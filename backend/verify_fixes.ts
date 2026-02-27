import pool from './src/config/database';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

async function verify() {
    console.log('--- Starting Expanded Verification ---');
    console.log('Using API_URL:', API_URL);

    try {
        // 1. Test Login and Cookie
        console.log('\nStep 1: Testing Login...');
        try {
            const loginRes = await axios.post(`${API_URL}/auth/login`, {
                email: 'ramesh.kumar@example.com',
                password: 'patient123'
            });

            const cookies = loginRes.headers['set-cookie'];
            console.log('Login Response Status:', loginRes.status);
            console.log('Set-Cookie Header:', cookies);

            if (!cookies || cookies.length === 0) {
                console.error('FAILED: No Set-Cookie header found in response');
                process.exit(1);
            }

            const tokenCookie = cookies.find(c => c.startsWith('token='));
            if (!tokenCookie) {
                console.error('FAILED: token cookie not found in Set-Cookie header');
                process.exit(1);
            }

            const cookie = tokenCookie.split(';')[0];
            console.log('Cookie extracted successfully:', cookie.substring(0, 20) + '...');

            // 2. Test Session Restore (/me)
            console.log('\nStep 2: Testing Session Restore (/me)...');
            const meRes = await axios.get(`${API_URL}/auth/me`, {
                headers: { Cookie: cookie }
            });
            console.log('Session restore successful for:', meRes.data.email);
            console.log('User Role:', meRes.data.role);
            console.log('User ID from session:', meRes.data.id);

            // 3. Test Appointment Booking
            console.log('\nStep 3: Booking Appointment...');
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const dateStr = tomorrow.toISOString().split('T')[0];

            // dr.sharma
            const doctorId = '692c4ed1-09f6-4ad9-aac7-a2f29cca808f';
            console.log('Target Doctor ID:', doctorId);

            const bookRes = await axios.post(`${API_URL}/appointments`, {
                doctorId: doctorId,
                appointmentDate: dateStr,
                startTime: '16:00',
                endTime: '16:30',
                symptoms: 'Debug-Verification-' + Date.now()
            }, {
                headers: { Cookie: cookie }
            });

            const appt = bookRes.data;
            console.log('Appointment booked! ID:', appt.id);
            console.log('Patient ID in created appt:', appt.patient_id);
            console.log('Status:', appt.status);

            // 4. Verify Visibility in Patient Appointments
            console.log('\nStep 4: Verifying Visibility...');
            const apptsRes = await axios.get(`${API_URL}/patients/appointments`, {
                headers: { Cookie: cookie }
            });

            console.log('Number of appointments fetched:', apptsRes.data.length);
            // console.log('Fetched IDs:', apptsRes.data.map((a: any) => a.id));

            const found = apptsRes.data.find((a: any) => a.id === appt.id);
            if (found) {
                console.log('SUCCESS: Appointment found in list!');
                console.log('Found Details:', JSON.stringify(found, null, 2));
            } else {
                console.error('FAILURE: Appointment NOT found in fetched list.');
                console.log('Is there a patient_id mismatch?');
                console.log('Created appt patient_id:', appt.patient_id);
                console.log('Session user_id:', meRes.data.id);

                if (apptsRes.data.length > 0) {
                    console.log('Sample appointment from list:', JSON.stringify(apptsRes.data[0], null, 2));
                }
                process.exit(1);
            }

            console.log('\n--- ALL VERIFICATIONS PASSED ---');
            process.exit(0);
        } catch (innerErr: any) {
            console.error('Request failed during verification flow:');
            console.error('Status:', innerErr.response?.status);
            console.error('Data:', JSON.stringify(innerErr.response?.data, null, 2));
            console.error('Message:', innerErr.message);
            process.exit(1);
        }
    } catch (err: any) {
        console.error('\n--- Unexpected Verification Error ---');
        console.error(err);
        process.exit(1);
    }
}

// Ensure the server has time to process previous requests if any
setTimeout(verify, 1000);
