'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/auth';
import { doctorAPI, appointmentAPI } from '@/lib/api';
import { FaCalendarAlt, FaClock, FaUserMd } from 'react-icons/fa';
import Link from 'next/link';
import { initSocket, disconnectSocket } from '@/lib/socket';

function BookAppointmentContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const doctorId = searchParams.get('doctorId');
    const { user, isAuthenticated, isHydrated } = useAuthStore();
    const [doctor, setDoctor] = useState<any>(null);
    const [availability, setAvailability] = useState<any[]>([]);
    const [busySlots, setBusySlots] = useState<any[]>([]);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [symptoms, setSymptoms] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!isHydrated) return;

        if (!isAuthenticated || user?.role !== 'patient') {
            router.push('/auth/login');
            return;
        }
        if (!doctorId) {
            router.push('/patient/doctors');
            return;
        }
        fetchDoctorDetails();

        // Socket integration
        const socket = initSocket(user.id);

        socket.on('AVAILABILITY_UPDATE', (data) => {
            if (data.doctorId === doctorId) {
                fetchDoctorDetails();
            }
        });

        socket.on('appointment_created', (data) => {
            if (data.doctor_id === doctorId && data.appointment_date === selectedDate) {
                if (selectedDate) fetchBusySlots(selectedDate);
            }
        });

        return () => {
            // disconnectSocket();
        };
    }, [isAuthenticated, user, doctorId, selectedDate]);

    const fetchDoctorDetails = async () => {
        try {
            const [docResponse, availResponse] = await Promise.all([
                doctorAPI.getById(doctorId!),
                doctorAPI.getAvailabilityById(doctorId!),
            ]);
            setDoctor(docResponse.data);
            setAvailability(availResponse.data);
        } catch (error) {
            console.error('Error fetching doctor details:', error);
            setError('Failed to load doctor details');
        } finally {
            setLoading(false);
        }
    };

    const fetchBusySlots = async (date: string) => {
        try {
            const response = await doctorAPI.getBusySlots(doctorId!, date);
            setBusySlots(response.data);
        } catch (error) {
            console.error('Error fetching busy slots:', error);
        }
    };

    const getAvailableTimeSlots = () => {
        if (!selectedDate) return [];

        const dateObj = new Date(selectedDate);
        const dayOfWeek = dateObj.getDay();

        const daySlots = availability.filter((slot) => slot.day_of_week === dayOfWeek && slot.is_available);

        // Generate time slots (30-minute intervals)
        const slots: string[] = [];
        const now = new Date();
        const isToday = selectedDate === now.toISOString().split('T')[0];

        daySlots.forEach((slot) => {
            const [startHour, startMin] = slot.start_time.split(':').map(Number);
            const [endHour, endMin] = slot.end_time.split(':').map(Number);

            let currentHour = startHour;
            let currentMin = startMin;

            while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
                const timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;

                // Check if slot is in the past (for today)
                let isPast = false;
                if (isToday) {
                    const slotTime = new Date(`${selectedDate}T${timeStr}`);
                    if (slotTime < now) isPast = true;
                }

                // Check if slot is already booked (busy)
                // We assume slots are 30 mins, so we check if any busy slot overlaps
                const isBusy = busySlots.some(busy => busy.start_time === timeStr || (busy.start_time <= timeStr && busy.end_time > timeStr));

                if (!isPast && !isBusy) {
                    slots.push(timeStr);
                }

                currentMin += 30;
                if (currentMin >= 60) {
                    currentMin = 0;
                    currentHour++;
                }
            }
        });

        return Array.from(new Set(slots)).sort(); // Remove duplicates and sort
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        try {
            const [startHour, startMin] = selectedTime.split(':').map(Number);
            const endHour = startMin === 30 ? startHour + 1 : startHour;
            const endMin = startMin === 30 ? 0 : 30;
            const endTime = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;

            await appointmentAPI.create({
                doctorId,
                appointmentDate: selectedDate,
                startTime: selectedTime,
                endTime,
                symptoms,
            });

            setSuccess(true);
            setTimeout(() => {
                router.push('/patient/appointments');
            }, 2000);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to book appointment');
        } finally {
            setSubmitting(false);
        }
    };

    const timeSlots = getAvailableTimeSlots();

    // Get minimum date (today)
    const today = new Date().toISOString().split('T')[0];
    // Get maximum date (3 months from now)
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);
    const maxDateStr = maxDate.toISOString().split('T')[0];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="card text-center max-w-md">
                    <div className="text-6xl mb-4">✅</div>
                    <h2 className="text-2xl font-bold mb-2">Appointment Booked!</h2>
                    <p className="text-gray-600 mb-4">Redirecting to your appointments...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
            <header className="bg-white shadow-sm border-b">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold gradient-text">Book Appointment</h1>
                        <Link href="/patient/doctors" className="btn btn-outline text-sm">
                            Back to Doctors
                        </Link>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-6 py-8 max-w-4xl">
                {/* Doctor Info */}
                {doctor && (
                    <div className="card mb-8">
                        <div className="flex items-start space-x-4">
                            <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                                {doctor.first_name[0]}
                                {doctor.last_name[0]}
                            </div>
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold">
                                    Dr. {doctor.first_name} {doctor.last_name}
                                </h2>
                                <p className="text-primary-600 font-medium text-lg">{doctor.specialization}</p>
                                <p className="text-gray-600 mt-1">{doctor.hospital_name}</p>
                                <p className="text-gray-600">Consultation Fee: ₹{doctor.consultation_fee}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Booking Form */}
                <div className="card">
                    <h3 className="text-xl font-bold mb-6">Select Date & Time</h3>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Date Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <FaCalendarAlt className="inline mr-2" />
                                Select Date
                            </label>
                            <input
                                type="date"
                                required
                                className="input"
                                min={today}
                                max={maxDateStr}
                                value={selectedDate}
                                onChange={(e) => {
                                    const date = e.target.value;
                                    setSelectedDate(date);
                                    setSelectedTime('');
                                    if (date) fetchBusySlots(date);
                                }}
                            />
                        </div>

                        {/* Time Selection */}
                        {selectedDate && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <FaClock className="inline mr-2" />
                                    Select Time Slot
                                </label>
                                {timeSlots.length === 0 ? (
                                    <p className="text-red-600 text-sm">No available slots for this date</p>
                                ) : (
                                    <div className="grid grid-cols-4 gap-2">
                                        {timeSlots.map((slot) => (
                                            <button
                                                key={slot}
                                                type="button"
                                                onClick={() => setSelectedTime(slot)}
                                                className={`py-2 px-4 rounded-lg border transition-all ${selectedTime === slot
                                                    ? 'bg-primary-600 text-white border-primary-600'
                                                    : 'bg-white border-gray-300 hover:border-primary-400'
                                                    }`}
                                            >
                                                {slot}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Symptoms */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Describe Your Symptoms
                            </label>
                            <textarea
                                className="input"
                                rows={4}
                                placeholder="Please describe your symptoms or reason for consultation..."
                                value={symptoms}
                                onChange={(e) => setSymptoms(e.target.value)}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={!selectedDate || !selectedTime || submitting}
                            className="btn btn-primary w-full"
                        >
                            {submitting ? 'Booking...' : 'Confirm Booking'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default function BookAppointmentPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="loading-spinner"></div></div>}>
            <BookAppointmentContent />
        </Suspense>
    );
}
