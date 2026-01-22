'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth';
import { doctorAPI } from '@/lib/api';
import { FaCalendarAlt, FaUsers, FaCheckCircle, FaClock } from 'react-icons/fa';
import Link from 'next/link';

export default function DoctorDashboard() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();
    const [appointments, setAppointments] = useState<any[]>([]);
    const [stats, setStats] = useState({ today: 0, total: 0, completed: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated || user?.role !== 'doctor') {
            router.push('/auth/login');
            return;
        }
        if (!user?.isApproved) {
            router.push('/auth/pending-approval');
            return;
        }
        fetchData();
    }, [isAuthenticated, user]);

    const fetchData = async () => {
        try {
            const response = await doctorAPI.getAppointments();
            const allAppointments = response.data;
            setAppointments(allAppointments.slice(0, 5));

            const today = new Date().toISOString().split('T')[0];
            setStats({
                today: allAppointments.filter((a: any) => a.appointment_date.split('T')[0] === today).length,
                total: allAppointments.length,
                completed: allAppointments.filter((a: any) => a.status === 'completed').length,
            });
        } catch (error) {
            console.error('Error fetching data:', error);
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
                        <h1 className="text-2xl font-bold gradient-text">Doctor Dashboard</h1>
                        <div className="flex items-center space-x-4">
                            <span className="text-gray-600">Dr. {user?.firstName} {user?.lastName}</span>
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
                {/* Stats */}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <div className="card text-center">
                        <FaClock className="text-4xl text-primary-600 mx-auto mb-3" />
                        <div className="text-3xl font-bold gradient-text">{stats.today}</div>
                        <div className="text-gray-600">Today's Appointments</div>
                    </div>

                    <div className="card text-center">
                        <FaUsers className="text-4xl text-secondary-600 mx-auto mb-3" />
                        <div className="text-3xl font-bold gradient-text">{stats.total}</div>
                        <div className="text-gray-600">Total Appointments</div>
                    </div>

                    <div className="card text-center">
                        <FaCheckCircle className="text-4xl text-green-600 mx-auto mb-3" />
                        <div className="text-3xl font-bold gradient-text">{stats.completed}</div>
                        <div className="text-gray-600">Completed</div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <Link href="/doctor/appointments" className="card-hover text-center">
                        <FaCalendarAlt className="text-4xl text-primary-600 mx-auto mb-3" />
                        <h3 className="font-semibold">My Appointments</h3>
                    </Link>

                    <Link href="/doctor/availability" className="card-hover text-center">
                        <FaClock className="text-4xl text-secondary-600 mx-auto mb-3" />
                        <h3 className="font-semibold">Set Availability</h3>
                    </Link>

                    <Link href="/doctor/profile" className="card-hover text-center">
                        <FaUsers className="text-4xl text-accent-600 mx-auto mb-3" />
                        <h3 className="font-semibold">My Profile</h3>
                    </Link>
                </div>

                {/* Recent Appointments */}
                <div className="card">
                    <h2 className="text-2xl font-bold mb-6">Recent Appointments</h2>

                    {appointments.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <FaCalendarAlt className="text-6xl mx-auto mb-4 opacity-20" />
                            <p>No appointments yet</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {appointments.map((appointment) => (
                                <div key={appointment.id} className="border rounded-lg p-4 hover:shadow-md transition-all">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-semibold text-lg">
                                                {appointment.patient_first_name} {appointment.patient_last_name}
                                            </h3>
                                            <p className="text-sm text-gray-600">Symptoms: {appointment.symptoms || 'N/A'}</p>
                                            <p className="text-sm text-gray-500 mt-1">
                                                📅 {new Date(appointment.appointment_date).toLocaleDateString()} at {appointment.start_time}
                                            </p>
                                        </div>
                                        <span className={`badge ${appointment.status === 'scheduled' ? 'badge-info' :
                                                appointment.status === 'completed' ? 'badge-success' :
                                                    appointment.status === 'cancelled' ? 'badge-danger' :
                                                        'badge-warning'
                                            }`}>
                                            {appointment.status}
                                        </span>
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
