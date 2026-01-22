'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth';
import { patientAPI, appointmentAPI } from '@/lib/api';
import { FaCalendarAlt, FaVideo, FaTimes, FaEdit } from 'react-icons/fa';
import Link from 'next/link';
import VideoCall from '@/components/VideoCall';

export default function AppointmentsPage() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCall, setActiveCall] = useState<string | null>(null);
    const [cancellingId, setCancellingId] = useState<string | null>(null);

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
        if (appointment.status !== 'scheduled') return false;

        const appointmentDateTime = new Date(
            `${appointment.appointment_date.split('T')[0]}T${appointment.start_time}`
        );
        const now = new Date();
        const timeDiff = Math.abs(now.getTime() - appointmentDateTime.getTime());
        const minutesDiff = Math.floor(timeDiff / (1000 * 60));

        return minutesDiff <= 15;
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
    const pastAppointments = appointments.filter((a) => ['completed', 'cancelled'].includes(a.status));

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
                <div className="mb-8">
                    <h2 className="text-2xl font-bold mb-4">Upcoming Appointments</h2>
                    {upcomingAppointments.length === 0 ? (
                        <div className="card text-center py-12">
                            <FaCalendarAlt className="text-6xl text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 mb-4">No upcoming appointments</p>
                            <Link href="/patient/doctors" className="btn btn-primary inline-block">
                                Book Appointment
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {upcomingAppointments.map((appointment) => (
                                <div key={appointment.id} className="card">
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
                                                {appointment.symptoms && (
                                                    <p className="text-gray-700">
                                                        <strong>Symptoms:</strong> {appointment.symptoms}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-col space-y-2">
                                            <span className="badge badge-info">Scheduled</span>
                                            {canJoinCall(appointment) ? (
                                                <button
                                                    onClick={() => setActiveCall(appointment.id)}
                                                    className="btn btn-primary btn-sm flex items-center space-x-2"
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

                {/* Past Appointments */}
                {pastAppointments.length > 0 && (
                    <div>
                        <h2 className="text-2xl font-bold mb-4">Past Appointments</h2>
                        <div className="space-y-4">
                            {pastAppointments.map((appointment) => (
                                <div key={appointment.id} className="card opacity-75">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3 mb-2">
                                                <div className="w-12 h-12 bg-gray-400 rounded-full flex items-center justify-center text-white font-bold">
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
                                                    <strong>Date:</strong> {new Date(appointment.appointment_date).toLocaleDateString()}
                                                </p>
                                                <p className="text-gray-700">
                                                    <strong>Time:</strong> {appointment.start_time}
                                                </p>
                                            </div>
                                        </div>

                                        <span
                                            className={`badge ${appointment.status === 'completed' ? 'badge-success' : 'badge-danger'
                                                }`}
                                        >
                                            {appointment.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
