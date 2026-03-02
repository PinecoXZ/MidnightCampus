import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'UniConnect — Chat with Students Worldwide',
    description: 'The verified student chat platform. Connect with university students globally through random video and text chat. Omegle for uni students.',
    keywords: 'university chat, student chat, omegle for students, campus connect, student networking',
    openGraph: {
        title: 'UniConnect — Chat with Students Worldwide',
        description: 'Connect with verified university students globally. Random video chat, campus matching, and study buddy mode.',
        type: 'website',
    },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body>
                <div className="orb orb-purple" />
                <div className="orb orb-cyan" />
                <div className="orb orb-pink" />
                <div className="relative z-10">
                    {children}
                </div>
            </body>
        </html>
    );
}
