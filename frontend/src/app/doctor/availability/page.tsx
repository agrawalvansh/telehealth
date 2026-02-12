'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth';
import { doctorAPI } from '@/lib/api';
import { FaClock, FaPlus, FaTrash } from 'react-icons/fa';
import Link from 'next/link';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function AvailabilityPage() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();
    const [availability, setAvailability] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newSlot, setNewSlot] = useState({
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '17:00',
    });

    useEffect(() => {
        if (!isAuthenticated || user?.role !== 'doctor') {
            router.push('/auth/login');
            return;
        }
        fetchAvailability();
    }, [isAuthenticated, user]);

    const fetchAvailability = async () => {
        try {
            const response = await doctorAPI.getAvailability();
            setAvailability(response.data);
        } catch (error) {
            console.error('Error fetching availability:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddSlot = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await doctorAPI.addAvailability(newSlot);
            setShowAddForm(false);
            setNewSlot({ dayOfWeek: 1, startTime: '09:00', endTime: '17:00' });
            fetchAvailability();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to add availability slot');
        }
    };

    const handleDeleteSlot = async (id: string) => {
        if (!confirm('Delete this availability slot?')) return;
        try {
            await doctorAPI.deleteAvailability(id);
            fetchAvailability();
        } catch (error) {
            alert('Failed to delete slot');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    const groupedByDay = DAYS.map((day, index) => ({
        day,
        dayIndex: index,
        slots: availability.filter((slot) => slot.day_of_week === index),
    }));

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
            <header className="bg-white shadow-sm border-b">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold gradient-text">My Availability</h1>
                        <div className="flex space-x-3">
                            <button onClick={() => setShowAddForm(true)} className="btn btn-primary text-sm">
                                <FaPlus className="inline mr-2" />
                                Add Slot
                            </button>
                            <Link href="/doctor/dashboard" className="btn btn-outline text-sm">
                                Back to Dashboard
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-6 py-8">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groupedByDay.map(({ day, dayIndex, slots }) => (
                        <div key={dayIndex} className="card">
                            <h3 className="text-lg font-bold mb-3 flex items-center">
                                <FaClock className="mr-2 text-primary-600" />
                                {day}
                            </h3>
                            {slots.length === 0 ? (
                                <p className="text-gray-500 text-sm">No availability set</p>
                            ) : (
                                <div className="space-y-2">
                                    {slots.map((slot) => (
                                        <div key={slot.id} className="flex items-center justify-between bg-blue-50 p-2 rounded">
                                            <span className="text-sm font-medium">
                                                {slot.start_time} - {slot.end_time}
                                            </span>
                                            <button
                                                onClick={() => handleDeleteSlot(slot.id)}
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Add Slot Modal */}
            {showAddForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6">
                        <h3 className="text-2xl font-bold mb-4">Add Availability Slot</h3>
                        <form onSubmit={handleAddSlot} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Day of Week</label>
                                <select
                                    className="input"
                                    value={newSlot.dayOfWeek}
                                    onChange={(e) => setNewSlot({ ...newSlot, dayOfWeek: parseInt(e.target.value) })}
                                >
                                    {DAYS.map((day, index) => (
                                        <option key={index} value={index}>
                                            {day}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Start Time</label>
                                <input
                                    type="time"
                                    required
                                    className="input"
                                    value={newSlot.startTime}
                                    onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">End Time</label>
                                <input
                                    type="time"
                                    required
                                    className="input"
                                    value={newSlot.endTime}
                                    onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                                />
                            </div>

                            <div className="flex space-x-3">
                                <button type="submit" className="btn btn-primary flex-1">
                                    Add Slot
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowAddForm(false)}
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
