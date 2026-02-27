'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth';
import { doctorAPI, appointmentAPI } from '@/lib/api';
import { FaCalendarAlt, FaVideo, FaFileMedical } from 'react-icons/fa';
import Link from 'next/link';
import nextDynamic from 'next/dynamic';
const VideoCall = nextDynamic(() => import('@/components/VideoCall'), { ssr: false });
import { initSocket, disconnectSocket } from '@/lib/socket';

const canJoinCall = (appointment: any) => {
    if (appointment.status !== 'scheduled' && appointment.status !== 'in_progress') return false;
    const apptDateStr = new Date(appointment.appointment_date).toISOString().split('T')[0];
    const appointmentDateTime = new Date(`${apptDateStr}T${appointment.start_time}`);
    const now = new Date();
    const timeDiff = now.getTime() - appointmentDateTime.getTime();
    const minutesDiff = timeDiff / (1000 * 60);
    return minutesDiff >= -15;
};

export default function DoctorAppointmentsPage() {
    const router = useRouter();
    const { user, isAuthenticated, isHydrated } = useAuthStore();
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
        if (!isHydrated) return;

        if (!isAuthenticated || user?.role !== 'doctor') {
            router.push('/auth/login');
            return;
        }
        fetchAppointments();

        // Socket integration
        const socket = initSocket(user.id);

        socket.on('appointment_created', (newAppt) => {
            setAppointments(prev => {
                if (prev.find(a => a.id === newAppt.id)) return prev;
                return [newAppt, ...prev];
            });
        });

        socket.on('appointment_updated', (updatedAppt) => {
            setAppointments(prev => prev.map(a => a.id === updatedAppt.id ? updatedAppt : a));
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

    const today = new Date();
    today.setHours(0, 0, 0, 0);

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
                        <Link href="/doctor/dashboard" className="btn btn-outline text-sm">
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
                        Upcoming Schedule
                    </h2>
                    {upcomingAppointments.length === 0 ? (
                        <div className="card text-center py-12 bg-gray-50/50">
                            <FaCalendarAlt className="text-6xl text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">No upcoming appointments scheduled</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {upcomingAppointments.map((appointment) => (
                                <AppointmentCard
                                    key={appointment.id}
                                    appointment={appointment}
                                    onJoinCall={setActiveCall}
                                    onAddRecord={(appt: any) => {
                                        setSelectedAppointment(appt);
                                        setShowMedicalRecordForm(true);
                                    }}
                                />
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
                                Recently Completed
                            </h2>
                            <div className="space-y-4">
                                {completedAppointments.map((appointment) => (
                                    <div key={appointment.id} className="card border-l-4 border-green-500 opacity-90">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h3 className="text-lg font-semibold">
                                                    {appointment.patient_first_name} {appointment.patient_last_name}
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
                        <div>
                            <h2 className="text-2xl font-bold mb-6 flex items-center text-orange-600">
                                <span className="w-2 h-8 bg-orange-500 rounded-full mr-3"></span>
                                Missed Appointments
                            </h2>
                            <div className="space-y-4">
                                {missedAppointments.map((appointment) => (
                                    <div key={appointment.id} className="card border-l-4 border-orange-500 bg-orange-50/30">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h3 className="text-lg font-semibold">
                                                    {appointment.patient_first_name} {appointment.patient_last_name}
                                                </h3>
                                                <p className="text-sm text-gray-600">
                                                    {new Date(appointment.appointment_date).toLocaleDateString()} at {appointment.start_time}
                                                </p>
                                                <p className="text-xs text-orange-600 mt-2 italic">Marked as missed due to no-show</p>
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
                        <div>
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
                                                    {appointment.patient_first_name} {appointment.patient_last_name}
                                                </h3>
                                                <p className="text-sm text-gray-600">
                                                    {new Date(appointment.appointment_date).toLocaleDateString()} at {appointment.start_time}
                                                </p>
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
                    {canJoinCall(appointment) ? (
                        <button onClick={() => onJoinCall(appointment.id)} className="btn btn-primary btn-sm flex items-center space-x-2">
                            <FaVideo />
                            <span>Join Call</span>
                        </button>
                    ) : (
                        <button disabled className="btn btn-outline btn-sm opacity-50 cursor-not-allowed">
                            Call Not Available
                        </button>
                    )}
                    <button onClick={() => onAddRecord(appointment)} className="btn btn-secondary btn-sm flex items-center space-x-2">
                        <FaFileMedical />
                        <span>Add Record</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
