'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth';
import { doctorAPI, appointmentAPI } from '@/lib/api';
import { FaCalendarAlt, FaVideo, FaFileMedical } from 'react-icons/fa';
import Link from 'next/link';
import VideoCall from '@/components/VideoCall';

export default function DoctorAppointmentsPage() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCall, setActiveCall] = useState<string | null>(null);
    const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
    const [showMedicalRecordForm, setShowMedicalRecordForm] = useState(false);
    const [medicalRecordData, setMedicalRecordData] = useState({
        diagnosis: '',
        symptoms: '',
        notes: '',
        medications: [{ name: '', dosage: '', frequency: '', duration: '' }],
        instructions: '',
    });

    useEffect(() => {
        if (!isAuthenticated || user?.role !== 'doctor') {
            router.push('/auth/login');
            return;
        }
        fetchAppointments();
    }, [isAuthenticated, user]);

    const fetchAppointments = async () => {
        try {
            const response = await doctorAPI.getAppointments();
            setAppointments(response.data);
        } catch (error) {
            console.error('Error fetching appointments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddMedication = () => {
        setMedicalRecordData({
            ...medicalRecordData,
            medications: [...medicalRecordData.medications, { name: '', dosage: '', frequency: '', duration: '' }],
        });
    };

    const handleMedicationChange = (index: number, field: string, value: string) => {
        const newMedications = [...medicalRecordData.medications];
        newMedications[index] = { ...newMedications[index], [field]: value };
        setMedicalRecordData({ ...medicalRecordData, medications: newMedications });
    };

    const handleSubmitMedicalRecord = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await appointmentAPI.addMedicalRecord(selectedAppointment.id, medicalRecordData);
            alert('Medical record added successfully!');
            setShowMedicalRecordForm(false);
            setSelectedAppointment(null);
            fetchAppointments();
        } catch (error) {
            console.error('Error adding medical record:', error);
            alert('Failed to add medical record');
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

    const todayAppointments = appointments.filter((a) => {
        const today = new Date().toISOString().split('T')[0];
        return a.appointment_date.split('T')[0] === today && a.status === 'scheduled';
    });

    const upcomingAppointments = appointments.filter((a) => {
        const today = new Date().toISOString().split('T')[0];
        return a.appointment_date.split('T')[0] > today && a.status === 'scheduled';
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
            <header className="bg-white shadow-sm border-b">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold gradient-text">My Appointments</h1>
                        <Link href="/doctor/dashboard" className="btn btn-outline text-sm">
                            Back to Dashboard
                        </Link>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-6 py-8">
                {/* Today's Appointments */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold mb-4">Today's Appointments</h2>
                    {todayAppointments.length === 0 ? (
                        <div className="card text-center py-8">
                            <p className="text-gray-500">No appointments today</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {todayAppointments.map((appointment) => (
                                <AppointmentCard
                                    key={appointment.id}
                                    appointment={appointment}
                                    onJoinCall={setActiveCall}
                                    onAddRecord={(appt) => {
                                        setSelectedAppointment(appt);
                                        setShowMedicalRecordForm(true);
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Upcoming Appointments */}
                <div>
                    <h2 className="text-2xl font-bold mb-4">Upcoming Appointments</h2>
                    {upcomingAppointments.length === 0 ? (
                        <div className="card text-center py-8">
                            <p className="text-gray-500">No upcoming appointments</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {upcomingAppointments.map((appointment) => (
                                <AppointmentCard
                                    key={appointment.id}
                                    appointment={appointment}
                                    onJoinCall={setActiveCall}
                                    onAddRecord={(appt) => {
                                        setSelectedAppointment(appt);
                                        setShowMedicalRecordForm(true);
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Medical Record Form Modal */}
            {showMedicalRecordForm && selectedAppointment && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
                        <h3 className="text-2xl font-bold mb-4">Add Medical Record</h3>
                        <p className="text-gray-600 mb-4">
                            Patient: {selectedAppointment.patient_first_name} {selectedAppointment.patient_last_name}
                        </p>

                        <form onSubmit={handleSubmitMedicalRecord} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Symptoms</label>
                                <textarea
                                    className="input"
                                    rows={2}
                                    value={medicalRecordData.symptoms}
                                    onChange={(e) => setMedicalRecordData({ ...medicalRecordData, symptoms: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Diagnosis</label>
                                <textarea
                                    required
                                    className="input"
                                    rows={2}
                                    value={medicalRecordData.diagnosis}
                                    onChange={(e) => setMedicalRecordData({ ...medicalRecordData, diagnosis: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Notes</label>
                                <textarea
                                    className="input"
                                    rows={3}
                                    value={medicalRecordData.notes}
                                    onChange={(e) => setMedicalRecordData({ ...medicalRecordData, notes: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Medications</label>
                                {medicalRecordData.medications.map((med, index) => (
                                    <div key={index} className="grid grid-cols-2 gap-2 mb-2 p-3 bg-gray-50 rounded">
                                        <input
                                            placeholder="Medicine Name"
                                            className="input"
                                            value={med.name}
                                            onChange={(e) => handleMedicationChange(index, 'name', e.target.value)}
                                        />
                                        <input
                                            placeholder="Dosage"
                                            className="input"
                                            value={med.dosage}
                                            onChange={(e) => handleMedicationChange(index, 'dosage', e.target.value)}
                                        />
                                        <input
                                            placeholder="Frequency"
                                            className="input"
                                            value={med.frequency}
                                            onChange={(e) => handleMedicationChange(index, 'frequency', e.target.value)}
                                        />
                                        <input
                                            placeholder="Duration"
                                            className="input"
                                            value={med.duration}
                                            onChange={(e) => handleMedicationChange(index, 'duration', e.target.value)}
                                        />
                                    </div>
                                ))}
                                <button type="button" onClick={handleAddMedication} className="btn btn-outline btn-sm">
                                    + Add Medication
                                </button>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Instructions</label>
                                <textarea
                                    className="input"
                                    rows={2}
                                    value={medicalRecordData.instructions}
                                    onChange={(e) => setMedicalRecordData({ ...medicalRecordData, instructions: e.target.value })}
                                />
                            </div>

                            <div className="flex space-x-3">
                                <button type="submit" className="btn btn-primary flex-1">
                                    Save Record
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowMedicalRecordForm(false)}
                                    className="btn btn-outline flex-1"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function AppointmentCard({ appointment, onJoinCall, onAddRecord }: any) {
    return (
        <div className="card">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-bold">
                            {appointment.patient_first_name[0]}
                            {appointment.patient_last_name[0]}
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold">
                                {appointment.patient_first_name} {appointment.patient_last_name}
                            </h3>
                            <p className="text-sm text-gray-600">
                                {appointment.blood_group && `Blood Group: ${appointment.blood_group}`}
                            </p>
                        </div>
                    </div>

                    <div className="ml-15 space-y-1">
                        <p className="text-gray-700">
                            <strong>Time:</strong> {appointment.start_time} - {appointment.end_time}
                        </p>
                        {appointment.symptoms && (
                            <p className="text-gray-700">
                                <strong>Symptoms:</strong> {appointment.symptoms}
                            </p>
                        )}
                        {appointment.allergies && (
                            <p className="text-red-600 text-sm">
                                <strong>⚠️ Allergies:</strong> {appointment.allergies}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex flex-col space-y-2">
                    <span className="badge badge-info">{appointment.status}</span>
                    <button onClick={() => onJoinCall(appointment.id)} className="btn btn-primary btn-sm flex items-center space-x-2">
                        <FaVideo />
                        <span>Join Call</span>
                    </button>
                    <button onClick={() => onAddRecord(appointment)} className="btn btn-secondary btn-sm flex items-center space-x-2">
                        <FaFileMedical />
                        <span>Add Record</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
