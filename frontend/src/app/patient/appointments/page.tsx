'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth';
import { patientAPI, appointmentAPI } from '@/lib/api';
import { FaCalendarAlt, FaVideo, FaTimes, FaEdit } from 'react-icons/fa';
import Link from 'next/link';
import VideoCall from '@/components/VideoCall';
import { initSocket, disconnectSocket } from '@/lib/socket';

export default function AppointmentsPage() {
    const router = useRouter();
    const { user, isAuthenticated, isHydrated } = useAuthStore();
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCall, setActiveCall] = useState<string | null>(null);
    const [cancellingId, setCancellingId] = useState<string | null>(null);

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
                if (prev.find(a => a.id === newAppt.id)) return prev;
                return [newAppt, ...prev].sort((a, b) =>
                    new Date(`${a.appointment_date.split('T')[0]}T${a.start_time}`).getTime() -
                    new Date(`${b.appointment_date.split('T')[0]}T${b.start_time}`).getTime()
                );
            });
        });

        socket.on('appointment_updated', (updatedAppt) => {
            setAppointments(prev => prev.map(a => a.id === updatedAppt.id ? updatedAppt : a).sort((a, b) =>
                new Date(`${a.appointment_date.split('T')[0]}T${a.start_time}`).getTime() -
                new Date(`${b.appointment_date.split('T')[0]}T${b.start_time}`).getTime()
            ));
        });

        socket.on('appointment_deleted', ({ id }) => {
            setAppointments(prev => prev.filter(a => a.id !== id));
        });

        return () => {
            // disconnectSocket();
        };
    }, [isAuthenticated, user]);

    const fetchAppointments = async () => {
        try {
            const response = await patientAPI.getAppointments();
            setAppointments(response.data);
        } catch (error) {
            console.error('Error fetching appointments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (appointmentId: string) => {
        if (!confirm('Are you sure you want to cancel this appointment?')) return;

        setCancellingId(appointmentId);
        try {
            await appointmentAPI.cancel(appointmentId, 'Cancelled by patient');
            fetchAppointments();
        } catch (error) {
            console.error('Error cancelling appointment:', error);
            alert('Failed to cancel appointment');
        } finally {
            setCancellingId(null);
        }
    };

    const canJoinCall = (appointment: any) => {
        if (appointment.status !== 'scheduled' && appointment.status !== 'in_progress') return false;

        // Appointment date is stored as ISO string in DB, but start_time is "HH:MM"
        // We need to combine them correctly
        const apptDateStr = new Date(appointment.appointment_date).toISOString().split('T')[0];
        const appointmentDateTime = new Date(`${apptDateStr}T${appointment.start_time}`);

        const now = new Date();
        const timeDiff = now.getTime() - appointmentDateTime.getTime();
        const minutesDiff = timeDiff / (1000 * 60);

        // Can join 15 minutes before and until the appointment ends (assuming 30 mins duration)
        // Adjust logic to be: at most 15 minutes early, and any time after start (until completed)
        return minutesDiff >= -15;
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

    const upcomingAppointments = appointments.filter((a) => a.status === 'scheduled');
    const completedAppointments = appointments.filter((a) => a.status === 'completed');
    const missedAppointments = appointments.filter((a) => a.status === 'missed');
    const cancelledAppointments = appointments.filter((a) => a.status === 'cancelled');

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
            <header className="bg-white shadow-sm border-b">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold gradient-text">My Appointments</h1>
                        <Link href="/patient/dashboard" className="btn btn-outline text-sm">
                            Back to Dashboard
                        </Link>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-6 py-8">
                {/* Upcoming Appointments */}
                <div className="mb-12">
                    <h2 className="text-2xl font-bold mb-6 flex items-center">
                        <span className="w-2 h-8 bg-blue-500 rounded-full mr-3"></span>
                        Upcoming Appointments
                    </h2>
                    {upcomingAppointments.length === 0 ? (
                        <div className="card text-center py-12 bg-gray-50/50">
                            <FaCalendarAlt className="text-6xl text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 mb-4">No upcoming appointments</p>
                            <Link href="/patient/doctors" className="btn btn-primary inline-block">
                                Book Appointment
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {upcomingAppointments.map((appointment) => (
                                <div key={appointment.id} className="card border-l-4 border-blue-500">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3 mb-2">
                                                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-bold">
                                                    {appointment.doctor_first_name[0]}
                                                    {appointment.doctor_last_name[0]}
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-semibold">
                                                        Dr. {appointment.doctor_first_name} {appointment.doctor_last_name}
                                                    </h3>
                                                    <p className="text-sm text-gray-600">{appointment.specialization}</p>
                                                </div>
                                            </div>

                                            <div className="ml-15 space-y-1">
                                                <p className="text-gray-700">
                                                    <strong>Date:</strong> {new Date(appointment.appointment_date).toLocaleDateString('en-IN', {
                                                        weekday: 'long',
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric',
                                                    })}
                                                </p>
                                                <p className="text-gray-700">
                                                    <strong>Time:</strong> {appointment.start_time} - {appointment.end_time}
                                                </p>
                                                <p className="text-gray-700">
                                                    <strong>Hospital:</strong> {appointment.hospital_name}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-col space-y-2">
                                            <span className="badge badge-info">Scheduled</span>
                                            {canJoinCall(appointment) ? (
                                                <button
                                                    onClick={() => setActiveCall(appointment.id)}
                                                    className="btn btn-primary btn-sm flex items-center space-x-2 animate-pulse"
                                                >
                                                    <FaVideo />
                                                    <span>Join Call</span>
                                                </button>
                                            ) : (
                                                <button disabled className="btn btn-outline btn-sm opacity-50 cursor-not-allowed">
                                                    Call Not Available
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleCancel(appointment.id)}
                                                disabled={cancellingId === appointment.id}
                                                className="btn btn-danger btn-sm flex items-center space-x-2"
                                            >
                                                <FaTimes />
                                                <span>{cancellingId === appointment.id ? 'Cancelling...' : 'Cancel'}</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="grid md:grid-cols-1 gap-12">
                    {/* Completed Appointments */}
                    {completedAppointments.length > 0 && (
                        <div>
                            <h2 className="text-2xl font-bold mb-6 flex items-center">
                                <span className="w-2 h-8 bg-green-500 rounded-full mr-3"></span>
                                Completed
                            </h2>
                            <div className="space-y-4">
                                {completedAppointments.map((appointment) => (
                                    <div key={appointment.id} className="card border-l-4 border-green-500 opacity-90">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h3 className="text-lg font-semibold">
                                                    Dr. {appointment.doctor_first_name} {appointment.doctor_last_name}
                                                </h3>
                                                <p className="text-sm text-gray-600">
                                                    {new Date(appointment.appointment_date).toLocaleDateString()} at {appointment.start_time}
                                                </p>
                                            </div>
                                            <span className="badge badge-success">Completed</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Missed Appointments */}
                    {missedAppointments.length > 0 && (
                        <div className="mt-8">
                            <h2 className="text-2xl font-bold mb-6 flex items-center text-orange-600">
                                <span className="w-2 h-8 bg-orange-500 rounded-full mr-3"></span>
                                Missed
                            </h2>
                            <div className="space-y-4">
                                {missedAppointments.map((appointment) => (
                                    <div key={appointment.id} className="card border-l-4 border-orange-500 bg-orange-50/30">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h3 className="text-lg font-semibold">
                                                    Dr. {appointment.doctor_first_name} {appointment.doctor_last_name}
                                                </h3>
                                                <p className="text-sm text-gray-600">
                                                    {new Date(appointment.appointment_date).toLocaleDateString()} at {appointment.start_time}
                                                </p>
                                                <p className="text-xs text-orange-600 mt-2 italic font-medium">Recorded as missed due to non-attendance</p>
                                            </div>
                                            <span className="badge bg-orange-100 text-orange-700 border-orange-200">Missed</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Cancelled Appointments */}
                    {cancelledAppointments.length > 0 && (
                        <div className="mt-8">
                            <h2 className="text-2xl font-bold mb-6 flex items-center text-gray-600">
                                <span className="w-2 h-8 bg-gray-400 rounded-full mr-3"></span>
                                Cancelled
                            </h2>
                            <div className="space-y-4">
                                {cancelledAppointments.map((appointment) => (
                                    <div key={appointment.id} className="card border-l-4 border-gray-400 bg-gray-50 opacity-75">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h3 className="text-lg font-semibold">
                                                    Dr. {appointment.doctor_first_name} {appointment.doctor_last_name}
                                                </h3>
                                                <p className="text-sm text-gray-600">
                                                    {new Date(appointment.appointment_date).toLocaleDateString()} at {appointment.start_time}
                                                </p>
                                                {appointment.cancellation_reason && (
                                                    <p className="text-xs text-gray-500 mt-2 italic">Reason: {appointment.cancellation_reason}</p>
                                                )}
                                            </div>
                                            <span className="badge badge-danger">Cancelled</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
