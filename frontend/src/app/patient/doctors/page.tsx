'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth';
import { doctorAPI } from '@/lib/api';
import { FaSearch, FaStar, FaUserMd, FaHospital, FaCalendarPlus } from 'react-icons/fa';
import Link from 'next/link';

export default function DoctorsPage() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();
    const [doctors, setDoctors] = useState<any[]>([]);
    const [filteredDoctors, setFilteredDoctors] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSpecialty, setSelectedSpecialty] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated || user?.role !== 'patient') {
            router.push('/auth/login');
            return;
        }
        fetchDoctors();
    }, [isAuthenticated, user]);

    const fetchDoctors = async () => {
        try {
            const response = await doctorAPI.getAll();
            setDoctors(response.data);
            setFilteredDoctors(response.data);
        } catch (error) {
            console.error('Error fetching doctors:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let filtered = doctors;

        if (searchTerm) {
            filtered = filtered.filter(
                (doc) =>
                    doc.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    doc.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    doc.specialization.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (selectedSpecialty) {
            filtered = filtered.filter((doc) => doc.specialization === selectedSpecialty);
        }

        setFilteredDoctors(filtered);
    }, [searchTerm, selectedSpecialty, doctors]);

    const specialties = [...new Set(doctors.map((doc) => doc.specialization))];

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
                        <h1 className="text-2xl font-bold gradient-text">Find Doctors</h1>
                        <Link href="/patient/dashboard" className="btn btn-outline text-sm">
                            Back to Dashboard
                        </Link>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-6 py-8">
                {/* Search and Filters */}
                <div className="card mb-8">
                    <div className="grid md:grid-cols-2 gap-4">
                        {/* Search */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Search Doctors
                            </label>
                            <div className="relative">
                                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by name or specialty..."
                                    className="input pl-10"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Specialty Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Filter by Specialty
                            </label>
                            <select
                                className="input"
                                value={selectedSpecialty}
                                onChange={(e) => setSelectedSpecialty(e.target.value)}
                            >
                                <option value="">All Specialties</option>
                                {specialties.map((specialty) => (
                                    <option key={specialty} value={specialty}>
                                        {specialty}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Results */}
                <div className="mb-4 text-gray-600">
                    Found {filteredDoctors.length} doctor{filteredDoctors.length !== 1 ? 's' : ''}
                </div>

                {/* Doctors Grid */}
                {filteredDoctors.length === 0 ? (
                    <div className="card text-center py-12">
                        <FaUserMd className="text-6xl text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No doctors found matching your criteria</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredDoctors.map((doctor) => (
                            <div key={doctor.id} className="card-hover">
                                <div className="flex items-start space-x-4 mb-4">
                                    <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                                        {doctor.first_name[0]}
                                        {doctor.last_name[0]}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-semibold">
                                            Dr. {doctor.first_name} {doctor.last_name}
                                        </h3>
                                        <p className="text-primary-600 font-medium">{doctor.specialization}</p>
                                    </div>
                                </div>

                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center text-sm text-gray-600">
                                        <FaHospital className="mr-2 text-gray-400" />
                                        {doctor.hospital_name}
                                    </div>
                                    <div className="flex items-center text-sm text-gray-600">
                                        <FaStar className="mr-2 text-yellow-500" />
                                        {doctor.rating ? Number(doctor.rating).toFixed(1) : '5.0'} Rating • {doctor.total_consultations || 0} Consultations
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        <strong>Experience:</strong> {doctor.experience_years} years
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        <strong>Fee:</strong> ₹{doctor.consultation_fee}
                                    </div>
                                </div>

                                {doctor.bio && (
                                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{doctor.bio}</p>
                                )}

                                <Link
                                    href={`/patient/book-appointment?doctorId=${doctor.id}`}
                                    className="btn btn-primary w-full flex items-center justify-center space-x-2"
                                >
                                    <FaCalendarPlus />
                                    <span>Book Appointment</span>
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
