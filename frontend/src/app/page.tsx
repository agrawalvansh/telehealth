'use client';

import Link from 'next/link';
import { FaHeartbeat, FaUserMd, FaCalendarCheck, FaVideo, FaShieldAlt, FaChartLine } from 'react-icons/fa';

export default function HomePage() {
    return (
        <div className="min-h-screen">
            {/* Navigation */}
            <nav className="glass sticky top-0 z-50 border-b border-white/20">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <FaHeartbeat className="text-3xl text-primary-600" />
                            <span className="text-2xl font-bold gradient-text">TeleHealth</span>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Link href="/auth/login" className="btn btn-outline">
                                Login
                            </Link>
                            <Link href="/auth/signup" className="btn btn-primary">
                                Get Started
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="container mx-auto px-6 py-20 animate-fade-in">
                <div className="text-center max-w-4xl mx-auto">
                    <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                        Healthcare Access for
                        <span className="gradient-text"> Everyone, Everywhere</span>
                    </h1>
                    <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                        Breaking barriers in rural healthcare with cloud-based teleconsultations,
                        centralized medical records, and 24/7 access to qualified doctors.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/auth/signup?role=patient" className="btn btn-primary text-lg px-8 py-4">
                            I'm a Patient
                        </Link>
                        <Link href="/auth/signup?role=doctor" className="btn btn-secondary text-lg px-8 py-4">
                            I'm a Doctor
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="container mx-auto px-6 py-20">
                <h2 className="section-title text-center mb-12">Why Choose TeleHealth?</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <FeatureCard
                        icon={<FaVideo className="text-4xl text-primary-600" />}
                        title="Video Consultations"
                        description="Connect with doctors via secure audio/video calls from the comfort of your home."
                    />
                    <FeatureCard
                        icon={<FaUserMd className="text-4xl text-secondary-600" />}
                        title="Qualified Doctors"
                        description="Access to verified, experienced doctors across multiple specializations."
                    />
                    <FeatureCard
                        icon={<FaCalendarCheck className="text-4xl text-accent-600" />}
                        title="Easy Scheduling"
                        description="Book, reschedule, or cancel appointments with just a few clicks."
                    />
                    <FeatureCard
                        icon={<FaShieldAlt className="text-4xl text-primary-600" />}
                        title="Secure Records"
                        description="Your medical history, prescriptions, and reports stored safely in the cloud."
                    />
                    <FeatureCard
                        icon={<FaChartLine className="text-4xl text-secondary-600" />}
                        title="Health Tracking"
                        description="Monitor your health journey with comprehensive medical records."
                    />
                    <FeatureCard
                        icon={<FaHeartbeat className="text-4xl text-accent-600" />}
                        title="24/7 Support"
                        description="Healthcare guidance available whenever you need it most."
                    />
                </div>
            </section>

            {/* How It Works */}
            <section className="bg-gradient-to-r from-primary-50 to-secondary-50 py-20">
                <div className="container mx-auto px-6">
                    <h2 className="section-title text-center mb-12">How It Works</h2>
                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        <StepCard
                            number="1"
                            title="Create Account"
                            description="Sign up as a patient or doctor in less than 2 minutes."
                        />
                        <StepCard
                            number="2"
                            title="Find & Book"
                            description="Search for doctors by specialty and book an appointment."
                        />
                        <StepCard
                            number="3"
                            title="Consult Online"
                            description="Join the video call at your appointment time and get diagnosed."
                        />
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="container mx-auto px-6 py-20">
                <div className="grid md:grid-cols-4 gap-8 text-center">
                    <StatCard number="10,000+" label="Patients Served" />
                    <StatCard number="500+" label="Verified Doctors" />
                    <StatCard number="50,000+" label="Consultations" />
                    <StatCard number="4.8/5" label="Average Rating" />
                </div>
            </section>

            {/* CTA Section */}
            <section className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-20">
                <div className="container mx-auto px-6 text-center">
                    <h2 className="text-4xl font-bold mb-6">Ready to Get Started?</h2>
                    <p className="text-xl mb-8 opacity-90">
                        Join thousands of patients and doctors transforming rural healthcare.
                    </p>
                    <Link href="/auth/signup" className="btn bg-white text-primary-600 hover:bg-gray-100 text-lg px-8 py-4">
                        Create Free Account
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-300 py-12">
                <div className="container mx-auto px-6">
                    <div className="grid md:grid-cols-3 gap-8">
                        <div>
                            <div className="flex items-center space-x-2 mb-4">
                                <FaHeartbeat className="text-2xl text-primary-400" />
                                <span className="text-xl font-bold text-white">TeleHealth</span>
                            </div>
                            <p className="text-sm">
                                Bringing quality healthcare to rural and remote areas through technology.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-white mb-4">Quick Links</h4>
                            <ul className="space-y-2 text-sm">
                                <li><Link href="/auth/login" className="hover:text-primary-400">Login</Link></li>
                                <li><Link href="/auth/signup" className="hover:text-primary-400">Sign Up</Link></li>
                                <li><Link href="#" className="hover:text-primary-400">About Us</Link></li>
                                <li><Link href="#" className="hover:text-primary-400">Contact</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-white mb-4">Contact</h4>
                            <p className="text-sm">Email: support@telehealth.com</p>
                            <p className="text-sm">Phone: +91-1800-123-4567</p>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
                        <p>&copy; 2024 TeleHealth. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
    return (
        <div className="card-hover text-center">
            <div className="flex justify-center mb-4">{icon}</div>
            <h3 className="text-xl font-semibold mb-2">{title}</h3>
            <p className="text-gray-600">{description}</p>
        </div>
    );
}

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
    return (
        <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-glow">
                {number}
            </div>
            <h3 className="text-xl font-semibold mb-2">{title}</h3>
            <p className="text-gray-600">{description}</p>
        </div>
    );
}

function StatCard({ number, label }: { number: string; label: string }) {
    return (
        <div className="card">
            <div className="text-4xl font-bold gradient-text mb-2">{number}</div>
            <div className="text-gray-600">{label}</div>
        </div>
    );
}
