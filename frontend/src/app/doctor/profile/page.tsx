'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth';
import { doctorAPI } from '@/lib/api';
import { FaUserMd, FaSave } from 'react-icons/fa';
import Link from 'next/link';

export default function DoctorProfilePage() {
    const router = useRouter();
    const { user, isAuthenticated, updateUser } = useAuthStore();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        specialization: '',
        qualification: '',
        experienceYears: '',
        hospitalName: '',
        hospitalAddress: '',
        registrationNumber: '',
        bio: '',
        consultationFee: '',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!isAuthenticated || user?.role !== 'doctor') {
            router.push('/auth/login');
            return;
        }
        fetchProfile();
    }, [isAuthenticated, user]);

    const fetchProfile = async () => {
        try {
            const response = await doctorAPI.getProfile();
            const profile = response.data;
            setFormData({
                firstName: profile.first_name || '',
                lastName: profile.last_name || '',
                phone: profile.phone || '',
                specialization: profile.specialization || '',
                qualification: profile.qualification || '',
                experienceYears: profile.experience_years || '',
                hospitalName: profile.hospital_name || '',
                hospitalAddress: profile.hospital_address || '',
                registrationNumber: profile.registration_number || '',
                bio: profile.bio || '',
                consultationFee: profile.consultation_fee || '',
            });
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setSuccess(false);

        try {
            await doctorAPI.updateProfile(formData);
            updateUser({ firstName: formData.firstName, lastName: formData.lastName });
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Failed to update profile');
        } finally {
            setSaving(false);
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
                        <h1 className="text-2xl font-bold gradient-text">My Profile</h1>
                        <Link href="/doctor/dashboard" className="btn btn-outline text-sm">
                            Back to Dashboard
                        </Link>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-6 py-8 max-w-4xl">
                {success && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
                        ✅ Profile updated successfully!
                    </div>
                )}

                <form onSubmit={handleSubmit} className="card space-y-6">
                    <h2 className="text-xl font-bold flex items-center">
                        <FaUserMd className="mr-2" />
                        Professional Information
                    </h2>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                            <input
                                type="text"
                                required
                                className="input"
                                value={formData.firstName}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                            <input
                                type="text"
                                required
                                className="input"
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                            <input
                                type="tel"
                                className="input"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                            <input
                                type="text"
                                required
                                className="input"
                                value={formData.specialization}
                                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Qualification</label>
                            <input
                                type="text"
                                required
                                className="input"
                                placeholder="e.g., MBBS, MD"
                                value={formData.qualification}
                                onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Experience (Years)</label>
                            <input
                                type="number"
                                className="input"
                                value={formData.experienceYears}
                                onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Hospital Name</label>
                            <input
                                type="text"
                                className="input"
                                value={formData.hospitalName}
                                onChange={(e) => setFormData({ ...formData, hospitalName: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
                            <input
                                type="text"
                                className="input"
                                value={formData.registrationNumber}
                                onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Consultation Fee (₹)</label>
                            <input
                                type="number"
                                className="input"
                                value={formData.consultationFee}
                                onChange={(e) => setFormData({ ...formData, consultationFee: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Hospital Address</label>
                        <textarea
                            className="input"
                            rows={2}
                            value={formData.hospitalAddress}
                            onChange={(e) => setFormData({ ...formData, hospitalAddress: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                        <textarea
                            className="input"
                            rows={4}
                            placeholder="Tell patients about yourself and your expertise..."
                            value={formData.bio}
                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        />
                    </div>

                    <button type="submit" disabled={saving} className="btn btn-primary w-full flex items-center justify-center space-x-2">
                        <FaSave />
                        <span>{saving ? 'Saving...' : 'Save Profile'}</span>
                    </button>
                </form>
            </div>
        </div>
    );
}
