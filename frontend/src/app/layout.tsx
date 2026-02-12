import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'Telehealth - Remote Healthcare for Rural Areas',
    description: 'Cloud-based telehealth platform providing remote medical consultations and centralized health records for rural and remote communities.',
    keywords: 'telehealth, telemedicine, rural healthcare, remote consultation, online doctor',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className={inter.className}>
                {children}
            </body>
        </html>
    );
}
