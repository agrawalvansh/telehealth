'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth';
import { adminAPI } from '@/lib/api';
import { FaUsers, FaUserMd, FaCalendarCheck, FaCheckCircle } from 'react-icons/fa';

export default function AdminDashboard() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();
    const [stats, setStats] = useState<any>(null);
    const [pendingDoctors, setPendingDoctors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated || user?.role !== 'admin') {
            router.push('/auth/login');
            return;
        }
        fetchData();
    }, [isAuthenticated, user]);

    const fetchData = async () => {
        try {
            const [statsResponse, doctorsResponse] = await Promise.all([
                adminAPI.getStats(),
                adminAPI.getPendingDoctors(),
            ]);
            setStats(statsResponse.data);
            setPendingDoctors(doctorsResponse.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApproveDoctor = async (doctorId: string) => {
        try {
            await adminAPI.approveDoctor(doctorId);
            fetchData();
            alert('Doctor approved successfully!');
        } catch (error) {
            alert('Failed to approve doctor');
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
            <header className="bg-white shadow-sm border-b">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold gradient-text">Admin Dashboard</h1>
                        <button
                            onClick={() => useAuthStore.getState().logout()}
                            className="btn btn-outline text-sm"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-6 py-8">
                {/* Statistics */}
                {stats && (
                    <div className="grid md:grid-cols-4 gap-6 mb-8">
                        <div className="card text-center">
                            <FaUsers className="text-4xl text-primary-600 mx-auto mb-3" />
                            <div className="text-3xl font-bold gradient-text">{stats.total_patients}</div>
                            <div className="text-gray-600">Total Patients</div>
                        </div>

                        <div className="card text-center">
                            <FaUserMd className="text-4xl text-secondary-600 mx-auto mb-3" />
                            <div className="text-3xl font-bold gradient-text">{stats.total_doctors}</div>
                            <div className="text-gray-600">Approved Doctors</div>
                        </div>

                        <div className="card text-center">
                            <FaCalendarCheck className="text-4xl text-accent-600 mx-auto mb-3" />
                            <div className="text-3xl font-bold gradient-text">{stats.completed_appointments}</div>
                            <div className="text-gray-600">Completed Consultations</div>
                        </div>

                        <div className="card text-center">
                            <FaCheckCircle className="text-4xl text-green-600 mx-auto mb-3" />
                            <div className="text-3xl font-bold gradient-text">{stats.pending_doctors}</div>
                            <div className="text-gray-600">Pending Approvals</div>
                        </div>
                    </div>
                )}

                {/* Pending Doctor Approvals */}
                <div className="card">
                    <h2 className="text-2xl font-bold mb-6">Pending Doctor Approvals</h2>
                    {pendingDoctors.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No pending approvals</p>
                    ) : (
                        <div className="space-y-4">
                            {pendingDoctors.map((doctor) => (
                                <div key={doctor.id} className="border rounded-lg p-4 hover:shadow-md transition-all">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h3 className="text-xl font-semibold">
                                                Dr. {doctor.first_name} {doctor.last_name}
                                            </h3>
                                            <p className="text-primary-600 font-medium">{doctor.specialization}</p>
                                            <div className="mt-2 space-y-1 text-sm text-gray-600">
                                                <p><strong>Email:</strong> {doctor.email}</p>
                                                <p><strong>Phone:</strong> {doctor.phone}</p>
                                                <p><strong>Qualification:</strong> {doctor.qualification}</p>
                                                <p><strong>Experience:</strong> {doctor.experience_years} years</p>
                                                <p><strong>Hospital:</strong> {doctor.hospital_name}</p>
                                                <p><strong>Registration:</strong> {doctor.registration_number}</p>
                                                <p><strong>Applied:</strong> {new Date(doctor.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleApproveDoctor(doctor.id)}
                                            className="btn btn-primary"
                                        >
                                            Approve Doctor
                                        </button>
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
