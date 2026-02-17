'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { searchAPI } from '@/lib/api';
import { FaArrowLeft, FaPhone, FaEnvelope, FaMapMarkerAlt, FaCalendarAlt, FaPills, FaFileMedical, FaExclamationTriangle, FaHeartbeat } from 'react-icons/fa';
import { format } from 'date-fns';

interface PatientProfile {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    registered_date: string;
    date_of_birth: string;
    gender: string;
    blood_group: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    emergency_contact: string;
    allergies: string;
    chronic_conditions: string;
}

interface MedicalRecord {
    id: string;
    diagnosis: string;
    symptoms: string;
    notes: string;
    created_at: string;
    doctor_first_name: string;
    doctor_last_name: string;
    specialization: string;
    appointment_date: string;
    start_time: string;
}

interface Prescription {
    id: string;
    medications: any;
    instructions: string;
    created_at: string;
    doctor_first_name: string;
    doctor_last_name: string;
    specialization: string;
    appointment_date: string;
}

interface Appointment {
    id: string;
    appointment_date: string;
    start_time: string;
    end_time: string;
    status: string;
    symptoms: string;
    doctor_first_name: string;
    doctor_last_name: string;
    specialization: string;
    hospital_name: string;
}

interface Statistics {
    totalAppointments: number;
    completedAppointments: number;
    lastAppointmentDate: string;
    totalMedicalRecords: number;
    totalPrescriptions: number;
}

interface PatientOverviewData {
    profile: PatientProfile;
    medicalRecords: MedicalRecord[];
    prescriptions: Prescription[];
    appointments: Appointment[];
    statistics: Statistics;
}

export default function PatientOverviewPage() {
    const params = useParams();
    const router = useRouter();
    const patientId = params.patientId as string;

    const [data, setData] = useState<PatientOverviewData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadPatientData();
    }, [patientId]);

    const loadPatientData = async () => {
        try {
            setIsLoading(true);
            const response = await searchAPI.getPatientOverview(patientId);
            setData(response.data);
        } catch (err: any) {
            console.error('Error loading patient overview:', err);
            setError(err.response?.data?.error || 'Failed to load patient data');
        } finally {
            setIsLoading(false);
        }
    };

    const calculateAge = (dob: string) => {
        if (!dob) return 'N/A';
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="loading-spinner mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading patient overview...</p>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-8">
                <div className="card max-w-md mx-auto text-center">
                    <p className="text-red-600 mb-4">{error || 'Patient not found'}</p>
                    <button onClick={() => router.back()} className="btn btn-primary">
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    const { profile, medicalRecords, prescriptions, appointments, statistics } = data;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
                    >
                        <FaArrowLeft />
                        <span>Back to Search</span>
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">Patient Overview</h1>
                </div>

                {/* Patient Info Card */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    <div className="lg:col-span-2 card">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">
                                    {profile.first_name} {profile.last_name}
                                </h2>
                                <p className="text-gray-600">{profile.email}</p>
                            </div>
                            {profile.blood_group && (
                                <div className="badge badge-danger text-lg px-4 py-2">
                                    {profile.blood_group}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div>
                                <p className="text-sm text-gray-500">Age / Gender</p>
                                <p className="font-semibold">{calculateAge(profile.date_of_birth)} years / {profile.gender || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 flex items-center">
                                    <FaPhone className="mr-1" /> Phone
                                </p>
                                <p className="font-semibold">{profile.phone || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 flex items-center">
                                    <FaEnvelope className="mr-1" /> Email
                                </p>
                                <p className="font-semibold text-sm">{profile.email}</p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-sm text-gray-500 flex items-center">
                                    <FaMapMarkerAlt className="mr-1" /> Address
                                </p>
                                <p className="font-semibold">
                                    {profile.address ? `${profile.address}, ` : ''}
                                    {profile.city}{profile.city && profile.state && ', '}{profile.state} {profile.pincode}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Emergency Contact</p>
                                <p className="font-semibold">{profile.emergency_contact || 'N/A'}</p>
                            </div>
                        </div>

                        {/* Allergies & Chronic Conditions - Critical Info */}
                        {(profile.allergies || profile.chronic_conditions) && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                {profile.allergies && (
                                    <div className="mb-3 p-3 bg-red-50 border-l-4 border-red-500 rounded">
                                        <div className="flex items-center space-x-2 mb-1">
                                            <FaExclamationTriangle className="text-red-600" />
                                            <span className="font-semibold text-red-800">Allergies</span>
                                        </div>
                                        <p className="text-red-700">{profile.allergies}</p>
                                    </div>
                                )}
                                {profile.chronic_conditions && (
                                    <div className="p-3 bg-yellow-50 border-l-4 border-yellow-500 rounded">
                                        <div className="flex items-center space-x-2 mb-1">
                                            <FaHeartbeat className="text-yellow-600" />
                                            <span className="font-semibold text-yellow-800">Chronic Conditions</span>
                                        </div>
                                        <p className="text-yellow-700">{profile.chronic_conditions}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Statistics Card */}
                    <div className="card">
                        <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
                        <div className="space-y-4">
                            <div className="pb-3 border-b border-gray-200">
                                <p className="text-sm text-gray-500">Total Appointments</p>
                                <p className="text-2xl font-bold text-primary-600">{statistics.totalAppointments}</p>
                            </div>
                            <div className="pb-3 border-b border-gray-200">
                                <p className="text-sm text-gray-500">Completed</p>
                                <p className="text-2xl font-bold text-green-600">{statistics.completedAppointments}</p>
                            </div>
                            <div className="pb-3 border-b border-gray-200">
                                <p className="text-sm text-gray-500">Medical Records</p>
                                <p className="text-2xl font-bold text-secondary-600">{statistics.totalMedicalRecords}</p>
                            </div>
                            <div className="pb-3 border-b border-gray-200">
                                <p className="text-sm text-gray-500">Prescriptions</p>
                                <p className="text-2xl font-bold text-accent-600">{statistics.totalPrescriptions}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Last Visit</p>
                                <p className="font-semibold">
                                    {statistics.lastAppointmentDate
                                        ? format(new Date(statistics.lastAppointmentDate), 'MMM dd, yyyy')
                                        : 'Never'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="card">
                    <div className="border-b border-gray-200 mb-6">
                        <nav className="flex space-x-8">
                            <button className="pb-4 px-2 border-b-2 border-primary-600 font-medium text-primary-600">
                                <FaFileMedical className="inline mr-2" />
                                Medical History
                            </button>
                        </nav>
                    </div>

                    {/* Medical History Timeline */}
                    <div className="space-y-6">
                        <h3 className="text-xl font-semibold mb-4">Medical History</h3>
                        {medicalRecords.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">No medical records found</p>
                        ) : (
                            <div className="space-y-4">
                                {medicalRecords.map((record) => (
                                    <div key={record.id} className="border-l-4 border-primary-500 pl-4 pb-4">
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <p className="font-semibold text-lg text-gray-900">{record.diagnosis}</p>
                                                <p className="text-sm text-gray-600">
                                                    Dr. {record.doctor_first_name} {record.doctor_last_name} • {record.specialization}
                                                </p>
                                            </div>
                                            <div className="text-right text-sm text-gray-500">
                                                {record.appointment_date && format(new Date(record.appointment_date), 'MMM dd, yyyy')}
                                            </div>
                                        </div>
                                        {record.symptoms && (
                                            <div className="mb-2">
                                                <p className="text-sm font-medium text-gray-700">Symptoms:</p>
                                                <p className="text-gray-600">{record.symptoms}</p>
                                            </div>
                                        )}
                                        {record.notes && (
                                            <div>
                                                <p className="text-sm font-medium text-gray-700">Notes:</p>
                                                <p className="text-gray-600">{record.notes}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Prescriptions Section */}
                        <div className="pt-6 border-t border-gray-200">
                            <h3 className="text-xl font-semibold mb-4 flex items-center">
                                <FaPills className="mr-2 text-accent-600" />
                                Prescriptions
                            </h3>
                            {prescriptions.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">No prescriptions found</p>
                            ) : (
                                <div className="space-y-4">
                                    {prescriptions.map((prescription) => (
                                        <div key={prescription.id} className="card bg-accent-50">
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <p className="font-semibold">
                                                        Dr. {prescription.doctor_first_name} {prescription.doctor_last_name}
                                                    </p>
                                                    <p className="text-sm text-gray-600">{prescription.specialization}</p>
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {prescription.appointment_date && format(new Date(prescription.appointment_date), 'MMM dd, yyyy')}
                                                </div>
                                            </div>
                                            {prescription.medications && (
                                                <div className="mb-2">
                                                    <p className="text-sm font-medium text-gray-700 mb-2">Medications:</p>
                                                    <div className="space-y-2">
                                                        {Array.isArray(prescription.medications) ? (
                                                            prescription.medications.map((med: any, index: number) => (
                                                                <div key={index} className="bg-white p-3 rounded-lg border border-gray-200">
                                                                    <div className="grid grid-cols-2 gap-2">
                                                                        <div>
                                                                            <p className="text-xs text-gray-500">Medicine</p>
                                                                            <p className="font-semibold text-gray-900">{med.name || 'N/A'}</p>
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-xs text-gray-500">Dosage</p>
                                                                            <p className="font-semibold text-gray-900">{med.dosage || 'N/A'}</p>
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-xs text-gray-500">Frequency</p>
                                                                            <p className="font-semibold text-gray-900">{med.frequency || 'N/A'} times/day</p>
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-xs text-gray-500">Duration</p>
                                                                            <p className="font-semibold text-gray-900">{med.duration || 'N/A'}</p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="bg-white p-3 rounded-lg border border-gray-200">
                                                                <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                                                                    {JSON.stringify(prescription.medications, null, 2)}
                                                                </pre>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            {prescription.instructions && (
                                                <div>
                                                    <p className="text-sm font-medium text-gray-700">Instructions:</p>
                                                    <p className="text-gray-600">{prescription.instructions}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Appointment History Section */}
                        <div className="pt-6 border-t border-gray-200">
                            <h3 className="text-xl font-semibold mb-4 flex items-center">
                                <FaCalendarAlt className="mr-2 text-secondary-600" />
                                Appointment History
                            </h3>
                            {appointments.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">No appointments found</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doctor</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Specialization</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Symptoms</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {appointments.map((appointment) => (
                                                <tr key={appointment.id}>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        {format(new Date(appointment.appointment_date), 'MMM dd, yyyy')}
                                                        <br />
                                                        <span className="text-sm text-gray-500">{appointment.start_time}</span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        Dr. {appointment.doctor_first_name} {appointment.doctor_last_name}
                                                    </td>
                                                    <td className="px-4 py-3">{appointment.specialization}</td>
                                                    <td className="px-4 py-3">
                                                        <span
                                                            className={`badge ${appointment.status === 'completed'
                                                                ? 'badge-success'
                                                                : appointment.status === 'scheduled'
                                                                    ? 'badge-info'
                                                                    : appointment.status === 'cancelled'
                                                                        ? 'badge-danger'
                                                                        : 'badge-warning'
                                                                }`}
                                                        >
                                                            {appointment.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">{appointment.symptoms || 'N/A'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
