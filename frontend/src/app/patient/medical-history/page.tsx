'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth';
import { patientAPI } from '@/lib/api';
import { FaFileMedical, FaPrescriptionBottle, FaUserMd, FaCalendarAlt } from 'react-icons/fa';
import Link from 'next/link';

export default function MedicalHistoryPage() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();
    const [medicalRecords, setMedicalRecords] = useState<any[]>([]);
    const [prescriptions, setPrescriptions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'records' | 'prescriptions'>('records');

    useEffect(() => {
        if (!isAuthenticated || user?.role !== 'patient') {
            router.push('/auth/login');
            return;
        }
        fetchData();
    }, [isAuthenticated, user]);

    const fetchData = async () => {
        try {
            const [recordsResponse, prescriptionsResponse] = await Promise.all([
                patientAPI.getMedicalHistory(),
                patientAPI.getPrescriptions(),
            ]);
            setMedicalRecords(recordsResponse.data);
            setPrescriptions(prescriptionsResponse.data);
        } catch (error) {
            console.error('Error fetching medical data:', error);
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
            <header className="bg-white shadow-sm border-b">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold gradient-text">Medical History</h1>
                        <Link href="/patient/dashboard" className="btn btn-outline text-sm">
                            Back to Dashboard
                        </Link>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-6 py-8">
                {/* Tabs */}
                <div className="flex space-x-4 mb-6">
                    <button
                        onClick={() => setActiveTab('records')}
                        className={`px-6 py-3 rounded-lg font-medium transition-all ${activeTab === 'records'
                                ? 'bg-primary-600 text-white shadow-md'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        <FaFileMedical className="inline mr-2" />
                        Medical Records ({medicalRecords.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('prescriptions')}
                        className={`px-6 py-3 rounded-lg font-medium transition-all ${activeTab === 'prescriptions'
                                ? 'bg-primary-600 text-white shadow-md'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        <FaPrescriptionBottle className="inline mr-2" />
                        Prescriptions ({prescriptions.length})
                    </button>
                </div>

                {/* Medical Records Tab */}
                {activeTab === 'records' && (
                    <div>
                        {medicalRecords.length === 0 ? (
                            <div className="card text-center py-12">
                                <FaFileMedical className="text-6xl text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">No medical records yet</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {medicalRecords.map((record) => (
                                    <div key={record.id} className="card">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-bold">
                                                    {record.doctor_first_name[0]}
                                                    {record.doctor_last_name[0]}
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-semibold">
                                                        Dr. {record.doctor_first_name} {record.doctor_last_name}
                                                    </h3>
                                                    <p className="text-sm text-gray-600">{record.specialization}</p>
                                                </div>
                                            </div>
                                            <div className="text-right text-sm text-gray-600">
                                                <p>
                                                    <FaCalendarAlt className="inline mr-1" />
                                                    {new Date(record.created_at).toLocaleDateString()}
                                                </p>
                                                {record.appointment_date && (
                                                    <p className="text-xs">
                                                        Appointment: {new Date(record.appointment_date).toLocaleDateString()}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            {record.symptoms && (
                                                <div>
                                                    <h4 className="font-semibold text-gray-700 mb-1">Symptoms:</h4>
                                                    <p className="text-gray-600">{record.symptoms}</p>
                                                </div>
                                            )}

                                            {record.diagnosis && (
                                                <div>
                                                    <h4 className="font-semibold text-gray-700 mb-1">Diagnosis:</h4>
                                                    <p className="text-gray-600">{record.diagnosis}</p>
                                                </div>
                                            )}

                                            {record.notes && (
                                                <div>
                                                    <h4 className="font-semibold text-gray-700 mb-1">Doctor's Notes:</h4>
                                                    <p className="text-gray-600">{record.notes}</p>
                                                </div>
                                            )}

                                            {record.vital_signs && (
                                                <div>
                                                    <h4 className="font-semibold text-gray-700 mb-1">Vital Signs:</h4>
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                                        {Object.entries(record.vital_signs).map(([key, value]) => (
                                                            <div key={key} className="bg-gray-50 p-2 rounded">
                                                                <p className="text-xs text-gray-500">{key}</p>
                                                                <p className="font-medium">{String(value)}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Prescriptions Tab */}
                {activeTab === 'prescriptions' && (
                    <div>
                        {prescriptions.length === 0 ? (
                            <div className="card text-center py-12">
                                <FaPrescriptionBottle className="text-6xl text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">No prescriptions yet</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {prescriptions.map((prescription) => (
                                    <div key={prescription.id} className="card">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-12 h-12 bg-gradient-to-br from-secondary-500 to-accent-500 rounded-full flex items-center justify-center text-white font-bold">
                                                    {prescription.doctor_first_name[0]}
                                                    {prescription.doctor_last_name[0]}
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-semibold">
                                                        Dr. {prescription.doctor_first_name} {prescription.doctor_last_name}
                                                    </h3>
                                                    <p className="text-sm text-gray-600">{prescription.specialization}</p>
                                                </div>
                                            </div>
                                            <div className="text-right text-sm text-gray-600">
                                                <p>
                                                    <FaCalendarAlt className="inline mr-1" />
                                                    {new Date(prescription.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div>
                                                <h4 className="font-semibold text-gray-700 mb-2">Medications:</h4>
                                                <div className="space-y-2">
                                                    {Array.isArray(prescription.medications) &&
                                                        prescription.medications.map((med: any, index: number) => (
                                                            <div key={index} className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                                                <p className="font-medium text-blue-900">{med.name}</p>
                                                                <div className="grid grid-cols-3 gap-2 mt-1 text-sm text-blue-800">
                                                                    <p>
                                                                        <strong>Dosage:</strong> {med.dosage}
                                                                    </p>
                                                                    <p>
                                                                        <strong>Frequency:</strong> {med.frequency}
                                                                    </p>
                                                                    <p>
                                                                        <strong>Duration:</strong> {med.duration}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                </div>
                                            </div>

                                            {prescription.instructions && (
                                                <div>
                                                    <h4 className="font-semibold text-gray-700 mb-1">Instructions:</h4>
                                                    <p className="text-gray-600">{prescription.instructions}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
