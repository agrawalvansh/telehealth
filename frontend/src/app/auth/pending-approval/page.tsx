'use client';

import Link from 'next/link';
import { FaClock, FaHeartbeat } from 'react-icons/fa';

export default function PendingApprovalPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 px-4">
            <div className="max-w-md w-full card text-center">
                <div className="mb-6">
                    <FaHeartbeat className="text-6xl text-primary-600 mx-auto mb-4" />
                    <FaClock className="text-4xl text-yellow-500 mx-auto" />
                </div>

                <h1 className="text-3xl font-bold mb-4">Account Pending Approval</h1>

                <p className="text-gray-600 mb-6">
                    Thank you for registering as a doctor on TeleHealth! Your account is currently under review by our admin team.
                </p>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-blue-900">
                        <strong>What happens next?</strong>
                    </p>
                    <ul className="text-sm text-blue-800 mt-2 space-y-1 text-left">
                        <li>• Our team will verify your credentials</li>
                        <li>• You'll receive an email once approved</li>
                        <li>• Approval typically takes 24-48 hours</li>
                    </ul>
                </div>

                <p className="text-sm text-gray-500 mb-6">
                    You will be able to access your dashboard and start consultations once your account is approved.
                </p>

                <Link href="/" className="btn btn-primary w-full">
                    Back to Home
                </Link>
            </div>
        </div>
    );
}
