'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth';
import { patientAPI, appointmentAPI } from '@/lib/api';
import { FaCalendarAlt, FaUserMd, FaFileMedical, FaVideo } from 'react-icons/fa';
import Link from 'next/link';

export default function PatientDashboard() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated || user?.role !== 'patient') {
            router.push('/auth/login');
            return;
        }
        fetchAppointments();
    }, [isAuthenticated, user]);

    const fetchAppointments = async () => {
        try {
            const response = await patientAPI.getAppointments();
            setAppointments(response.data.slice(0, 5)); // Latest 5
        } catch (error) {
            console.error('Error fetching appointments:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold gradient-text">Patient Dashboard</h1>
                        <div className="flex items-center space-x-4">
                            <span className="text-gray-600">Welcome, {user?.firstName}!</span>
                            <button
                                onClick={() => useAuthStore.getState().logout()}
                                className="btn btn-outline text-sm"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-6 py-8">
                {/* Quick Actions */}
                <div className="grid md:grid-cols-4 gap-6 mb-8">
                    <Link href="/patient/doctors" className="card-hover text-center">
                        <FaUserMd className="text-4xl text-primary-600 mx-auto mb-3" />
                        <h3 className="font-semibold">Find Doctors</h3>
                        <p className="text-sm text-gray-600">Search & Book</p>
                    </Link>

                    <Link href="/patient/appointments" className="card-hover text-center">
                        <FaCalendarAlt className="text-4xl text-secondary-600 mx-auto mb-3" />
                        <h3 className="font-semibold">My Appointments</h3>
                        <p className="text-sm text-gray-600">View Schedule</p>
                    </Link>

                    <Link href="/patient/medical-history" className="card-hover text-center">
                        <FaFileMedical className="text-4xl text-accent-600 mx-auto mb-3" />
                        <h3 className="font-semibold">Medical History</h3>
                        <p className="text-sm text-gray-600">View Records</p>
                    </Link>

                    <Link href="/patient/profile" className="card-hover text-center">
                        <FaUserMd className="text-4xl text-primary-600 mx-auto mb-3" />
                        <h3 className="font-semibold">My Profile</h3>
                        <p className="text-sm text-gray-600">Update Info</p>
                    </Link>
                </div>

                {/* Upcoming Appointments */}
                <div className="card">
                    <h2 className="text-2xl font-bold mb-6">Upcoming Appointments</h2>

                    {appointments.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <FaCalendarAlt className="text-6xl mx-auto mb-4 opacity-20" />
                            <p>No appointments scheduled</p>
                            <Link href="/patient/doctors" className="btn btn-primary mt-4 inline-block">
                                Book Appointment
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {appointments.map((appointment) => (
                                <div key={appointment.id} className="border rounded-lg p-4 hover:shadow-md transition-all">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-semibold text-lg">
                                                Dr. {appointment.doctor_first_name} {appointment.doctor_last_name}
                                            </h3>
                                            <p className="text-sm text-gray-600">{appointment.specialization}</p>
                                            <p className="text-sm text-gray-500 mt-1">
                                                📅 {new Date(appointment.appointment_date).toLocaleDateString()} at {appointment.start_time}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`badge ${appointment.status === 'scheduled' ? 'badge-info' :
                                                    appointment.status === 'completed' ? 'badge-success' :
                                                        appointment.status === 'cancelled' ? 'badge-danger' :
                                                            'badge-warning'
                                                }`}>
                                                {appointment.status}
                                            </span>
                                            {appointment.status === 'scheduled' && (
                                                <button className="btn btn-primary btn-sm mt-2 flex items-center space-x-2">
                                                    <FaVideo />
                                                    <span>Join Call</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
