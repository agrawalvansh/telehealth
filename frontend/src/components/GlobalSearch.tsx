'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { FaSearch, FaTimes } from 'react-icons/fa';
import { searchAPI } from '../lib/api';
import { useRouter } from 'next/navigation';

interface SearchResult {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    date_of_birth: string;
    gender: string;
    blood_group: string;
    city: string;
    state: string;
}

export default function GlobalSearch() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    // Keyboard shortcut to open search (Ctrl+K or Cmd+K)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(true);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
                setQuery('');
                setResults([]);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Focus input when modal opens
    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen]);

    // Debounced search
    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setIsLoading(true);
            try {
                const response = await searchAPI.searchPatients(query);
                setResults(response.data);
                setSelectedIndex(0);
            } catch (error) {
                console.error('Search error:', error);
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    // Keyboard navigation in results
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex((prev) => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter' && results.length > 0) {
            e.preventDefault();
            handleSelectPatient(results[selectedIndex]);
        }
    };

    const handleSelectPatient = (patient: SearchResult) => {
        router.push(`/doctor/patient-overview/${patient.id}`);
        setIsOpen(false);
        setQuery('');
        setResults([]);
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

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                title="Global Search (Ctrl+K)"
            >
                <FaSearch className="text-gray-500" />
                <span className="text-gray-600 text-sm">Search patients...</span>
                <span className="text-xs bg-gray-300 px-2 py-1 rounded text-gray-600 font-mono">
                    Ctrl+K
                </span>
            </button>
        );
    }

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/50 z-50 animate-fade-in"
                onClick={() => {
                    setIsOpen(false);
                    setQuery('');
                    setResults([]);
                }}
            />

            {/* Search Modal */}
            <div className="fixed top-20 left-1/2 transform -translate-x-1/2 w-full max-w-2xl z-50 animate-slide-up">
                <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
                    {/* Search Input */}
                    <div className="flex items-center px-4 py-4 border-b border-gray-200">
                        <FaSearch className="text-gray-400 mr-3" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Search patients by name, email, or phone..."
                            className="flex-1 outline-none text-lg"
                        />
                        {query && (
                            <button
                                onClick={() => {
                                    setQuery('');
                                    setResults([]);
                                }}
                                className="ml-2 text-gray-400 hover:text-gray-600"
                            >
                                <FaTimes />
                            </button>
                        )}
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                setQuery('');
                                setResults([]);
                            }}
                            className="ml-3 text-sm text-gray-500 hover:text-gray-700 px-3 py-1 bg-gray-100 rounded"
                        >
                            ESC
                        </button>
                    </div>

                    {/* Results */}
                    <div className="max-h-96 overflow-y-auto">
                        {isLoading && (
                            <div className="p-8 text-center">
                                <div className="loading-spinner mx-auto"></div>
                                <p className="mt-2 text-gray-500">Searching...</p>
                            </div>
                        )}

                        {!isLoading && query && results.length === 0 && (
                            <div className="p-8 text-center text-gray-500">
                                No patients found matching &quot;{query}&quot;
                            </div>
                        )}

                        {!isLoading && results.length > 0 && (
                            <div>
                                {results.map((patient, index) => (
                                    <button
                                        key={patient.id}
                                        onClick={() => handleSelectPatient(patient)}
                                        className={`w-full text-left px-6 py-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 ${index === selectedIndex ? 'bg-primary-50' : ''
                                            }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-3">
                                                    <h3 className="font-semibold text-lg text-gray-900">
                                                        {patient.first_name} {patient.last_name}
                                                    </h3>
                                                    {patient.blood_group && (
                                                        <span className="badge badge-danger">
                                                            {patient.blood_group}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="mt-1 flex items-center space-x-4 text-sm text-gray-600">
                                                    <span>{patient.email}</span>
                                                    {patient.phone && (
                                                        <>
                                                            <span>•</span>
                                                            <span>{patient.phone}</span>
                                                        </>
                                                    )}
                                                    {patient.date_of_birth && (
                                                        <>
                                                            <span>•</span>
                                                            <span>{calculateAge(patient.date_of_birth)} years</span>
                                                        </>
                                                    )}
                                                    {patient.gender && (
                                                        <>
                                                            <span>•</span>
                                                            <span>{patient.gender}</span>
                                                        </>
                                                    )}
                                                </div>
                                                {(patient.city || patient.state) && (
                                                    <div className="mt-1 text-sm text-gray-500">
                                                        📍 {patient.city}{patient.city && patient.state && ', '}{patient.state}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                                <div className="p-3 bg-gray-50 text-center text-xs text-gray-500">
                                    Use ↑↓ arrows to navigate, Enter to select
                                </div>
                            </div>
                        )}

                        {!isLoading && !query && (
                            <div className="p-8 text-center text-gray-400">
                                <FaSearch className="text-4xl mx-auto mb-3 text-gray-300" />
                                <p>Type to search for patients</p>
                                <p className="text-xs mt-2">Search by name, email, or phone number</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
