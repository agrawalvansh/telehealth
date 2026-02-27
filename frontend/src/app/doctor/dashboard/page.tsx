'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth';
import { doctorAPI, appointmentAPI } from '@/lib/api';
import { FaCalendarAlt, FaUsers, FaCheckCircle, FaClock, FaVideo } from 'react-icons/fa';
import Link from 'next/link';
import GlobalSearch from '@/components/GlobalSearch';
import { initSocket, disconnectSocket } from '@/lib/socket';
import nextDynamic from 'next/dynamic';
const VideoCall = nextDynamic(() => import('@/components/VideoCall'), { ssr: false });

const canJoinCall = (appointment: any) => {
    if (appointment.status !== 'scheduled' && appointment.status !== 'in_progress') return false;
    const apptDateStr = new Date(appointment.appointment_date).toISOString().split('T')[0];
    const appointmentDateTime = new Date(`${apptDateStr}T${appointment.start_time}`);
    const now = new Date();
    const timeDiff = now.getTime() - appointmentDateTime.getTime();
    const minutesDiff = timeDiff / (1000 * 60);
    return minutesDiff >= -15;
};

export default function DoctorDashboard() {
    const router = useRouter();
    const { user, isAuthenticated, isHydrated } = useAuthStore();
    const [appointments, setAppointments] = useState<any[]>([]);
    const [stats, setStats] = useState({ today: 0, total: 0, completed: 0 });
    const [loading, setLoading] = useState(true);
    const [activeCall, setActiveCall] = useState<string | null>(null);

    useEffect(() => {
        if (!isHydrated) return;

        if (!isAuthenticated || user?.role !== 'doctor') {
            router.push('/auth/login');
            return;
        }
        if (!user?.isApproved) {
            router.push('/auth/pending-approval');
            return;
        }
        fetchData();

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
            setStats(prev => ({ ...prev, today: prev.today + 1, total: prev.total + 1 }));
            fetchData();
        });

        socket.on('appointment_updated', (updatedAppt) => {
            setAppointments(prev => {
                const updated = prev.map(a => a.id === updatedAppt.id ? updatedAppt : a);
                return updated
                    .filter(a => ['scheduled', 'in_progress'].includes(a.status))
                    .sort((a, b) => new Date(`${a.appointment_date.split('T')[0]}T${a.start_time}`).getTime() -
                        new Date(`${b.appointment_date.split('T')[0]}T${b.start_time}`).getTime())
                    .slice(0, 5);
            });
            if (updatedAppt.status === 'completed') {
                setStats(prev => ({ ...prev, completed: prev.completed + 1 }));
            }
            fetchData();
        });

        socket.on('appointment_deleted', ({ id }) => {
            setAppointments(prev => prev.filter(a => a.id !== id));
            setStats(prev => ({ ...prev, total: prev.total - 1 }));
            fetchData();
        });

        return () => {
            disconnectSocket();
        };
    }, [isAuthenticated, user]);

    const fetchData = async () => {
        try {
            const profileResponse = await doctorAPI.getProfile();
            const profile = profileResponse.data;

            const appointmentsResponse = await doctorAPI.getAppointments();
            const allAppointments = appointmentsResponse.data;

            const upcoming = allAppointments
                .filter((a: any) => ['scheduled', 'in_progress'].includes(a.status))
                .sort((a: any, b: any) =>
                    new Date(`${a.appointment_date.split('T')[0]}T${a.start_time}`).getTime() -
                    new Date(`${b.appointment_date.split('T')[0]}T${b.start_time}`).getTime()
                )
                .slice(0, 5);

            setAppointments(upcoming);
            setStats({
                today: profile.today_consultations || 0,
                total: allAppointments.length,
                completed: allAppointments.filter((a: any) => a.status === 'completed').length,
            });
        } catch (error) {
            console.error('Error fetching data:', error);
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
                        <h1 className="text-2xl font-bold gradient-text">Doctor Dashboard</h1>
                        <div className="flex items-center space-x-4">
                            <GlobalSearch />
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
                                                {canJoinCall(appointment) && (
                                                    <button
                                                        onClick={() => setActiveCall(appointment.id)}
                                                        className="btn btn-primary btn-sm flex items-center justify-center space-x-2"
                                                    >
                                                        <FaVideo />
                                                        <span>Join Call</span>
                                                    </button>
                                                )}
                                                {appointment.status === 'scheduled' && !appointment.doctor_attended && (
                                                    <button
                                                        onClick={() => handleMarkAttended(appointment.id)}
                                                        className="btn btn-outline btn-sm border-green-600 text-green-600 hover:bg-green-50 flex items-center justify-center space-x-2"
                                                    >
                                                        <FaCheckCircle />
                                                        <span>Mark Attended</span>
                                                    </button>
                                                )}
                                                {appointment.doctor_attended && appointment.status !== 'completed' && (
                                                    <span className="text-xs text-green-600 font-medium italic">Wait for patient to mark attendance</span>
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
