'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GraduationCap, LogOut, Edit3, Plus, X, Shuffle, Building2, BookOpen, Settings, Users, Globe, Zap, Gamepad2, Laptop, HeartHandshake, History, Crown } from 'lucide-react';

const YEAR_OPTIONS = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Masters', 'PhD'];
const POPULAR_TAGS = ['#MachineLearning', '#WebDev', '#StartupLife', '#DataScience', '#Cybersecurity', '#Medicine', '#Law', '#Finance', '#Design', '#Research'];

interface User { id: string; name: string; email: string; university: string; major?: string; year?: string; tags?: string[]; reputation?: number; }

export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [editing, setEditing] = useState(false);
    const [majorInput, setMajorInput] = useState('');
    const [yearInput, setYearInput] = useState('1st Year');
    const [tagInput, setTagInput] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);
    const [history, setHistory] = useState<any[]>([]);

    useEffect(() => {
        const stored = localStorage.getItem('uc_user');
        const token = localStorage.getItem('uc_token');
        if (!stored || !token) { router.push('/auth'); return; }
        const u = JSON.parse(stored);
        setUser(u);
        setMajorInput(u.major || '');
        setYearInput(u.year || '1st Year');
        setTags(u.tags || []);

        // Simulate Match History arriving via socket/API later on connection
        setHistory([
            { mode: 'techtalk', target: 'Computer Science', timestamp: new Date(Date.now() - 3600000).toISOString() },
            { mode: 'random', target: 'Mechanical Eng', timestamp: new Date(Date.now() - 86400000).toISOString() }
        ]);
    }, []);

    const addTag = (tag: string) => {
        const t = tag.startsWith('#') ? tag : `#${tag}`;
        if (!tags.includes(t) && tags.length < 8) {
            setTags(prev => [...prev, t]);
            setTagInput('');
        }
    };

    const removeTag = (tag: string) => setTags(prev => prev.filter(t => t !== tag));

    const saveProfile = async () => {
        setSaving(true);
        const token = localStorage.getItem('uc_token');
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ major: majorInput, year: yearInput, tags }),
            });
            const data = await res.json();
            if (data.user) {
                setUser(prev => ({ ...prev!, ...data.user }));
                localStorage.setItem('uc_user', JSON.stringify({ ...user, ...data.user }));
                setEditing(false);
            }
        } catch { } finally { setSaving(false); }
    };

    const logout = () => { localStorage.clear(); router.push('/'); };

    const modes = [
        { id: 'random', icon: Shuffle, label: 'Random Chat', desc: 'Match with any verified student worldwide instantly', color: 'from-purple-600 to-violet-500', textColor: 'text-purple-400', glow: 'rgba(124,58,237,0.35)', emoji: '🎲', badge: 'Most Popular' },
        { id: 'campus', icon: Building2, label: 'Campus Mode', desc: 'Connect with students from your own university', color: 'from-cyan-600 to-sky-500', textColor: 'text-cyan-400', glow: 'rgba(6,182,212,0.35)', emoji: '🏫', badge: null },
        { id: 'studybuddy', icon: BookOpen, label: 'Study Buddy', desc: 'Find partners with matching interests and subjects', color: 'from-pink-600 to-rose-500', textColor: 'text-pink-400', glow: 'rgba(236,72,153,0.35)', emoji: '📚', badge: null },
        { id: 'gaming', icon: Gamepad2, label: 'Gaming Zone', desc: 'Find your next duo or squad for Valorant, BGMI, etc.', color: 'from-amber-600 to-orange-500', textColor: 'text-amber-400', glow: 'rgba(245,158,11,0.35)', emoji: '🎮', badge: 'Hot' },
        { id: 'techtalk', icon: Laptop, label: 'Tech Talk', desc: 'Code, AI trends, and startups. Talk shop.', color: 'from-blue-600 to-indigo-500', textColor: 'text-blue-400', glow: 'rgba(59,130,246,0.35)', emoji: '💻', badge: null },
        { id: 'ventroom', icon: HeartHandshake, label: 'Vent Room', desc: 'Mental health, stress relief, and just letting it out.', color: 'from-rose-600 to-red-500', textColor: 'text-rose-400', glow: 'rgba(244,63,94,0.35)', emoji: '💬', badge: 'Safe Space' },
    ];

    if (!user) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="spinner" />
        </div>
    );

    const initials = user.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'UC';

    // Simple local slug generator for preview purposes
    const aliasPreview = user.major ? `${user.major.split(' ')[0]}_${user.year?.substring(0, 3)}` : 'NewStudent';

    return (
        <div className="min-h-screen px-6 py-6 bg-grid">
            {/* Navbar */}
            <nav className="glass sticky top-0 z-50 px-6 py-4 rounded-2xl mb-8 flex items-center justify-between border border-purple-500/10">
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
                        <GraduationCap size={17} className="text-white" />
                    </div>
                    <span className="text-lg font-black gradient-text hidden sm:block">UniConnect</span>
                </Link>
                <div className="flex items-center gap-4 text-sm text-slate-400">
                    <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" style={{ animation: 'ping-slow 2s infinite' }}></span>
                        <span className="hidden sm:block">12,483 online</span>
                    </span>
                    <Link href="/study-room" className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1.5">
                        <Users size={14} /> Study Room
                    </Link>
                    <button onClick={() => setEditing(!editing)} className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1.5">
                        <Settings size={14} /> Profile
                    </button>
                    <button onClick={logout} className="text-slate-500 hover:text-red-400 transition-colors p-2">
                        <LogOut size={17} />
                    </button>
                </div>
            </nav>

            <div className="max-w-6xl mx-auto">
                {/* Welcome + Profile Card */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-10">

                    {/* Left Column: Profile Card */}
                    <div className="glass-strong rounded-2xl p-6 lg:col-span-1">
                        <div className="flex flex-col items-center text-center">
                            <div className="online-pulse mb-4">
                                <div className="w-20 h-20 rounded-full gradient-bg flex items-center justify-center text-2xl font-bold text-white glow-purple">
                                    {initials}
                                </div>
                            </div>
                            <h2 className="text-xl font-bold text-white mb-1">{user.name}</h2>
                            <p className="text-purple-400 text-sm">{user.university}</p>

                            <div className="w-full mt-4 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                                <div className="text-xs text-purple-300 font-medium mb-1 uppercase tracking-wider">Your Chat Alias</div>
                                <div className="text-lg font-mono font-bold text-white">[{aliasPreview}]</div>
                            </div>

                            {!editing ? (
                                <div className="mt-4 w-full">
                                    <div className="flex justify-between text-xs text-slate-400 py-2 border-b border-purple-500/10">
                                        <span>Major</span>
                                        <span className="text-white">{user.major || '—'}</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-slate-400 py-2 border-b border-purple-500/10">
                                        <span>Year</span>
                                        <span className="text-white">{user.year || '1st Year'}</span>
                                    </div>
                                    <div className="mt-4 flex flex-wrap gap-1.5 justify-center">
                                        {(user.tags || []).map(t => <span key={t} className="tag-badge">{t}</span>)}
                                        {(!user.tags || user.tags.length === 0) && <span className="text-xs text-slate-600">No tags yet</span>}
                                    </div>
                                    <button onClick={() => setEditing(true)} className="mt-5 btn-ghost text-xs py-2 px-4 w-full flex items-center justify-center gap-1">
                                        <Edit3 size={13} /> Edit Profile
                                    </button>
                                </div>
                            ) : (
                                <div className="mt-4 w-full space-y-3 text-left">
                                    <div>
                                        <label className="text-xs text-slate-400 mb-1 block">Major</label>
                                        <input value={majorInput} onChange={e => setMajorInput(e.target.value)} placeholder="e.g. Computer Science" className="input-dark text-sm py-2" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 mb-1 block">Year</label>
                                        <select value={yearInput} onChange={e => setYearInput(e.target.value)} className="input-dark text-sm py-2">
                                            {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 mb-1 block">Interests (max 8)</label>
                                        <div className="flex gap-2 mb-2">
                                            <input value={tagInput} onChange={e => setTagInput(e.target.value)} placeholder="#tag" className="input-dark text-sm py-1.5 flex-1"
                                                onKeyDown={e => { if (e.key === 'Enter' && tagInput) addTag(tagInput); }} />
                                            <button onClick={() => tagInput && addTag(tagInput)} className="btn-ghost text-xs px-2 py-1.5"><Plus size={15} /></button>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5 mb-2">
                                            {tags.map(t => (
                                                <span key={t} className="tag-badge flex items-center gap-1 cursor-pointer" onClick={() => removeTag(t)}>
                                                    {t} <X size={10} />
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex gap-2 mt-4">
                                        <button onClick={saveProfile} disabled={saving} className="btn-primary flex-1 text-xs py-2">
                                            {saving ? 'Saving...' : 'Save'}
                                        </button>
                                        <button onClick={() => setEditing(false)} className="btn-ghost text-xs py-2 px-3">Cancel</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Stats & Banners */}
                    <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-6 content-start">

                        {/* Top stat row */}
                        <div className="glass rounded-2xl p-5 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center flex-shrink-0"><Zap size={22} className="text-white" /></div>
                            <div>
                                <div className="text-2xl font-black gradient-text">12,483</div>
                                <div className="text-xs text-slate-400">Students live</div>
                            </div>
                        </div>

                        <div className="glass rounded-2xl p-5 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center flex-shrink-0"><HeartHandshake size={22} className="text-white" /></div>
                            <div>
                                <div className="text-2xl font-black text-emerald-400">{user.reputation || 0}</div>
                                <div className="text-xs text-slate-400">Upvotes received</div>
                            </div>
                        </div>

                        <Link href="/upgrade" className="glass rounded-2xl p-5 flex items-center gap-4 group cursor-pointer border-amber-500/30 hover:border-amber-500/60 transition-colors" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.05) 0%, rgba(217,119,6,0.1) 100%)' }}>
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform"><Crown size={22} className="text-white" /></div>
                            <div>
                                <div className="text-lg font-black text-amber-400">Go Premium</div>
                                <div className="text-xs text-amber-500/80">Filter by Uni & Major</div>
                            </div>
                        </Link>

                        {/* History Panel */}
                        <div className="glass rounded-2xl p-6 sm:col-span-3">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-white flex items-center gap-2"><History size={16} className="text-purple-400" /> Recent Matches</h3>
                                <span className="text-xs text-slate-500">Only you can see this. Identities are blurred.</span>
                            </div>

                            {history.length > 0 ? (
                                <div className="space-y-3">
                                    {history.map((h, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/50 border border-slate-700/50">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-sm filter blur-[2px]">👤</div>
                                                <div>
                                                    <div className="text-sm font-semibold text-slate-200">Someone from {h.target || 'a university'}</div>
                                                    <div className="text-xs text-slate-500 uppercase tracking-widest">{h.mode} Match</div>
                                                </div>
                                            </div>
                                            <div className="text-xs text-slate-600">
                                                {new Date(h.timestamp).toLocaleDateString()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6 text-slate-500 text-sm">
                                    No matches yet. Jump into a room!
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Mode Selection */}
                <div className="mb-6 flex justify-between items-end">
                    <div>
                        <h2 className="text-2xl font-black text-white mb-1">Choose your mode</h2>
                        <p className="text-slate-400 text-sm">Select how you want to connect today</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {modes.map((m) => (
                        <button
                            key={m.id}
                            onClick={() => router.push(`/chat?mode=${m.id}`)}
                            className="glass rounded-2xl p-8 card-hover text-left group relative overflow-hidden cursor-pointer w-full"
                        >
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                style={{ background: `radial-gradient(circle at 50% 50%, ${m.glow}, transparent 70%)` }} />
                            {m.badge && (
                                <span className="absolute top-4 right-4 text-xs px-2 py-1 rounded-full font-semibold"
                                    style={{ background: 'rgba(124,58,237,0.2)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.3)' }}>
                                    {m.badge}
                                </span>
                            )}
                            <div className="text-4xl mb-5 group-hover:scale-110 transition-transform duration-300">{m.emoji}</div>
                            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${m.color} flex items-center justify-center mb-4 group-hover:shadow-lg transition-shadow`}
                                style={{ boxShadow: `0 0 20px ${m.glow}` }}>
                                <m.icon size={21} className="text-white" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">{m.label}</h3>
                            <p className="text-slate-400 text-sm leading-relaxed mb-5">{m.desc}</p>
                            <span className={`${m.textColor} text-sm font-semibold flex items-center gap-2 group-hover:gap-3 transition-all`}>
                                Start chatting →
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
