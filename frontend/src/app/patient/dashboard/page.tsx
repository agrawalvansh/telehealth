'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth';
import { patientAPI, appointmentAPI } from '@/lib/api';
import { FaCalendarAlt, FaUserMd, FaFileMedical, FaVideo, FaCheckCircle } from 'react-icons/fa';
import Link from 'next/link';
import { initSocket, disconnectSocket } from '@/lib/socket';
import VideoCall from '@/components/VideoCall';

export default function PatientDashboard() {
    const router = useRouter();
    const { user, isAuthenticated, isHydrated } = useAuthStore();
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCall, setActiveCall] = useState<string | null>(null);

    useEffect(() => {
        if (!isHydrated) return;

        if (!isAuthenticated || user?.role !== 'patient') {
            router.push('/auth/login');
            return;
        }
        fetchAppointments();

        // Socket integration
        const socket = initSocket(user.id);

        socket.on('appointment_created', (newAppt) => {
            setAppointments(prev => {
                const exists = prev.find(a => a.id === newAppt.id);
                if (exists) return prev;
                return [newAppt, ...prev]
                    .filter(a => ['scheduled', 'in_progress'].includes(a.status))
                    .sort((a, b) => new Date(`${a.appointment_date.split('T')[0]}T${a.start_time}`).getTime() -
                        new Date(`${b.appointment_date.split('T')[0]}T${b.start_time}`).getTime())
                    .slice(0, 5);
            });
        });

        socket.on('appointment_updated', (updatedAppt) => {
            setAppointments(prev => {
                const newAppointments = prev.map(a => a.id === updatedAppt.id ? updatedAppt : a);
                // If it was cancelled or completed, it might still stay in latest 5 or be filtered depending on view
                // For dashboard, we usually show "Upcoming", so if status changed to cancelled/completed, we might want to refetch
                // but let's just update for now. The filtering is done in the component if needed.
                return newAppointments
                    .filter(a => ['scheduled', 'in_progress'].includes(a.status))
                    .sort((a, b) => new Date(`${a.appointment_date.split('T')[0]}T${a.start_time}`).getTime() -
                        new Date(`${b.appointment_date.split('T')[0]}T${b.start_time}`).getTime())
                    .slice(0, 5);
            });
            // Force refetch to ensure sorting and filtering are correct
            fetchAppointments();
        });

        socket.on('appointment_deleted', ({ id }) => {
            setAppointments(prev => prev.filter(a => a.id !== id));
        });

        return () => {
            disconnectSocket();
        };
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

    const handleMarkAttended = async (id: string) => {
        try {
            await appointmentAPI.markAttendance(id, true);
        } catch (error) {
            console.error('Error marking attendance:', error);
            alert('Failed to mark attendance');
        }
    };

    if (activeCall) {
        return <VideoCall appointmentId={activeCall} onCallEnd={() => setActiveCall(null)} />;
    }

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
                                                        appointment.status === 'missed' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                                                            'badge-warning'
                                                }`}>
                                                {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                                            </span>
                                            <div className="flex flex-col space-y-2 mt-2">
                                                {appointment.status === 'scheduled' && (
                                                    <button
                                                        onClick={() => setActiveCall(appointment.id)}
                                                        className="btn btn-primary btn-sm flex items-center justify-center space-x-2"
                                                    >
                                                        <FaVideo />
                                                        <span>Join Call</span>
                                                    </button>
                                                )}
                                                {appointment.status === 'scheduled' && !appointment.patient_attended && (
                                                    <button
                                                        onClick={() => handleMarkAttended(appointment.id)}
                                                        className="btn btn-outline btn-sm border-green-600 text-green-600 hover:bg-green-50 flex items-center justify-center space-x-2"
                                                    >
                                                        <FaCheckCircle />
                                                        <span>Mark Attended</span>
                                                    </button>
                                                )}
                                                {appointment.patient_attended && appointment.status !== 'completed' && (
                                                    <span className="text-xs text-green-600 font-medium italic">Wait for doctor to mark attendance</span>
                                                )}
                                            </div>
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
