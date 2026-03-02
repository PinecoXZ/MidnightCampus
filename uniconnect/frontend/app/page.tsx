'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Users, Globe, Shield, Zap, ArrowRight, GraduationCap, MessageCircle, Video, BookOpen, Star, ChevronRight } from 'lucide-react';

const stats = [
    { label: 'Universities', value: '500+', icon: GraduationCap },
    { label: 'Students Online', value: '12K+', icon: Users },
    { label: 'Countries', value: '80+', icon: Globe },
    { label: 'Chats Today', value: '45K+', icon: MessageCircle },
];

const features = [
    {
        icon: Shield,
        title: 'Verified Students Only',
        desc: 'Sign up with your university email (.edu, .ac.in, etc.). No randoms, no fake accounts. Just real students.',
        color: 'from-purple-600 to-purple-400',
        glow: 'rgba(124, 58, 237, 0.3)',
    },
    {
        icon: Zap,
        title: 'Smart Matching',
        desc: 'Match by interests, university, or subject. Our algorithm connects you with the most relevant peers.',
        color: 'from-cyan-600 to-cyan-400',
        glow: 'rgba(6, 182, 212, 0.3)',
    },
    {
        icon: Video,
        title: 'HD Video Chat',
        desc: 'Crystal-clear video powered by WebRTC. Skip anytime, go next — just like Omegle but for students.',
        color: 'from-pink-600 to-pink-400',
        glow: 'rgba(236, 72, 153, 0.3)',
    },
    {
        icon: BookOpen,
        title: 'Study Buddy Mode',
        desc: 'Find a study partner from your field. Short or long-term partnerships, you choose.',
        color: 'from-amber-600 to-amber-400',
        glow: 'rgba(245, 158, 11, 0.3)',
    },
];

const modes = [
    { emoji: '🎲', name: 'Random Chat', desc: 'Talk to any student worldwide', color: 'purple' },
    { emoji: '🏫', name: 'Campus Mode', desc: 'Match within your university', color: 'cyan' },
    { emoji: '📚', name: 'Study Buddy', desc: 'Find same-subject partners', color: 'pink' },
    { emoji: '🎮', name: 'Gaming Zone', desc: 'Find your next duo or squad', color: 'amber' },
    { emoji: '💻', name: 'Tech Talk', desc: 'Coding, AI, and startup chats', color: 'blue' },
    { emoji: '💬', name: 'Vent Room', desc: 'Safe space for exam stress', color: 'rose' },
];

const testimonials = [
    { name: 'Priya S.', uni: 'IIT Delhi', text: 'Met my thesis partner here! Can\'t believe how good the matching is.', avatar: '👩‍💻' },
    { name: 'James W.', uni: 'Oxford', text: 'Been using this every day. Way better than Omegle, actually feel safe.', avatar: '👨‍🎓' },
    { name: 'Amara O.', uni: 'MIT', text: 'Campus mode helped me find people from my own uni I never knew!', avatar: '👩‍🔬' },
];

export default function LandingPage() {
    const [count, setCount] = useState(0);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (count < 12483) setCount(prev => Math.min(prev + Math.floor((12483 - prev) / 10) + 1, 12483));
        }, 50);
        return () => clearTimeout(timer);
    }, [count]);

    return (
        <div className="min-h-screen bg-grid">
            {/* Navbar */}
            <nav className="glass sticky top-0 z-50 px-6 py-4 border-b border-purple-500/10">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center glow-purple">
                            <GraduationCap size={20} className="text-white" />
                        </div>
                        <span className="text-xl font-bold gradient-text">UniConnect</span>
                    </div>
                    <div className="hidden md:flex items-center gap-8 text-sm text-slate-400">
                        <a href="#features" className="hover:text-purple-400 transition-colors">Features</a>
                        <a href="#modes" className="hover:text-purple-400 transition-colors">Modes</a>
                        <a href="#testimonials" className="hover:text-purple-400 transition-colors">Reviews</a>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/auth" className="btn-ghost text-sm py-2 px-4">Log In</Link>
                        <Link href="/auth?signup=true" className="btn-primary text-sm py-2 px-4">Get Started</Link>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section className="relative pt-24 pb-20 px-6 text-center overflow-hidden">
                <div className="max-w-4xl mx-auto">
                    <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-sm text-purple-300 mb-8 animate-fade-in border border-purple-500/20">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" style={{ animation: 'ping-slow 2s infinite' }}></span>
                        <span>{count.toLocaleString()} students online right now</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight animate-fade-in-delay-1">
                        <span className="text-white">Purpose-Driven</span><br />
                        <span className="gradient-text glow-text">Student Chat</span>
                    </h1>

                    <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in-delay-2">
                        No random chaos. Choose your mode, match with verified students, and skip the awkward silence with icebreakers.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-delay-3">
                        <Link href="/auth?signup=true" className="btn-primary text-lg py-4 px-8 flex items-center justify-center gap-2 group">
                            Start Chatting Free
                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link href="#modes" className="btn-ghost text-lg py-4 px-8">
                            Explore Modes
                        </Link>
                    </div>

                    <div className="mt-6 text-sm text-slate-500 animate-fade-in-delay-4">
                        ✅ University email required &nbsp;·&nbsp; 🔒 No chat logs stored &nbsp;·&nbsp; 🚀 Free forever
                    </div>
                </div>

                {/* Hero visual */}
                <div className="mt-20 max-w-5xl mx-auto relative animate-fade-in-delay-5">
                    <div className="gradient-border">
                        <div className="glass-strong rounded-2xl p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="video-tile h-48 flex items-center justify-center">
                                    <div className="text-center">
                                        <div className="w-16 h-16 rounded-full gradient-bg flex items-center justify-center mx-auto mb-3 glow-purple">
                                            <span className="text-2xl">👨‍💻</span>
                                        </div>
                                        <p className="text-sm text-purple-300 font-medium">You</p>
                                        <p className="text-xs text-slate-500">MIT · Computer Science</p>
                                    </div>
                                </div>
                                <div className="video-tile h-48 flex items-center justify-center">
                                    <div className="text-center">
                                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-600 to-cyan-400 flex items-center justify-center mx-auto mb-3 glow-cyan">
                                            <span className="text-2xl">👩‍🔬</span>
                                        </div>
                                        <p className="text-sm text-cyan-300 font-medium">Matched!</p>
                                        <p className="text-xs text-slate-500">IIT Bombay · Data Science</p>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 flex items-center gap-3">
                                <div className="flex-1 input-dark text-slate-500 text-sm py-2">Type a message...</div>
                                <button className="btn-primary py-2 px-4 text-sm">Send</button>
                                <button className="btn-ghost py-2 px-4 text-sm text-red-400 border-red-500/20">Next →</button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats */}
            <section className="py-16 px-6">
                <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
                    {stats.map((stat, i) => (
                        <div key={i} className="glass rounded-2xl p-6 text-center card-hover">
                            <stat.icon size={28} className="text-purple-400 mx-auto mb-3" />
                            <div className="text-3xl font-black gradient-text mb-1">{stat.value}</div>
                            <div className="text-sm text-slate-500">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Features */}
            <section id="features" className="py-20 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-black text-white mb-4">
                            Not just another <span className="gradient-text">chat app</span>
                        </h2>
                        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                            Built from the ground up for the student experience. Safe, smart, and actually fun.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {features.map((f, i) => (
                            <div key={i} className="glass rounded-2xl p-8 card-hover group">
                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}
                                    style={{ boxShadow: `0 0 30px ${f.glow}` }}>
                                    <f.icon size={26} className="text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
                                <p className="text-slate-400 leading-relaxed">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Modes */}
            <section id="modes" className="py-20 px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-black text-white mb-4">
                            Three ways to <span className="gradient-text">connect</span>
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {modes.map((m, i) => (
                            <Link key={i} href="/auth?signup=true"
                                className="glass rounded-2xl p-8 card-hover text-center group cursor-pointer block">
                                <div className="text-5xl mb-6 group-hover:scale-125 transition-transform duration-300">{m.emoji}</div>
                                <h3 className="text-xl font-bold text-white mb-2">{m.name}</h3>
                                <p className="text-slate-400 text-sm mb-6">{m.desc}</p>
                                <span className="text-purple-400 text-sm flex items-center justify-center gap-1 group-hover:gap-2 transition-all">
                                    Try it <ChevronRight size={16} />
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section id="testimonials" className="py-20 px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-black text-white mb-4">
                            Loved by <span className="gradient-text">students</span>
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {testimonials.map((t, i) => (
                            <div key={i} className="glass rounded-2xl p-6 card-hover">
                                <div className="flex items-center gap-1 mb-4">
                                    {[...Array(5)].map((_, j) => <Star key={j} size={14} className="text-amber-400 fill-amber-400" />)}
                                </div>
                                <p className="text-slate-300 mb-6 text-sm leading-relaxed">"{t.text}"</p>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center text-lg">{t.avatar}</div>
                                    <div>
                                        <div className="font-semibold text-white text-sm">{t.name}</div>
                                        <div className="text-xs text-slate-500">{t.uni}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-24 px-6">
                <div className="max-w-3xl mx-auto text-center">
                    <div className="glass-strong rounded-3xl p-12 gradient-border">
                        <h2 className="text-4xl font-black text-white mb-4">
                            Ready to meet your<br /><span className="gradient-text">next study buddy?</span>
                        </h2>
                        <p className="text-slate-400 mb-8 text-lg">Join 12,000+ students already on UniConnect. Free forever.</p>
                        <Link href="/auth?signup=true" className="btn-primary text-lg py-4 px-10 inline-flex items-center gap-2 group">
                            Create Free Account
                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-purple-500/10 py-10 px-6 text-center text-slate-500 text-sm">
                <div className="flex items-center justify-center gap-2 mb-4">
                    <div className="w-7 h-7 rounded-lg gradient-bg flex items-center justify-center">
                        <GraduationCap size={15} className="text-white" />
                    </div>
                    <span className="font-bold text-white">UniConnect</span>
                </div>
                <p>© 2024 UniConnect. Made for students, by students. 🎓</p>
                <p className="mt-2 text-xs">University email required. No chat logs stored. GDPR compliant.</p>
            </footer>
        </div>
    );
}
