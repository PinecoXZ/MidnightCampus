'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GraduationCap, Copy, Check, Play, Pause, RotateCcw, Users, Video, VideoOff, Mic, MicOff } from 'lucide-react';

const FOCUS_MINS = 25;
const BREAK_MINS = 5;

export default function StudyRoomPage() {
    const router = useRouter();
    const [roomCode] = useState(() => Math.random().toString(36).slice(2, 8).toUpperCase());
    const [copied, setCopied] = useState(false);
    const [timerMode, setTimerMode] = useState<'focus' | 'break'>('focus');
    const [seconds, setSeconds] = useState(FOCUS_MINS * 60);
    const [running, setRunning] = useState(false);
    const [session, setSession] = useState(1);
    const [camOff, setCamOff] = useState(false);
    const [muted, setMuted] = useState(false);
    const localVideoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const token = localStorage.getItem('uc_token');
        if (!token) router.push('/auth');
    }, [router]);

    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
            if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        }).catch(() => { });
    }, []);

    useEffect(() => {
        if (!running) return;
        const interval = setInterval(() => {
            setSeconds(s => {
                if (s <= 1) {
                    setRunning(false);
                    if (timerMode === 'focus') {
                        setTimerMode('break');
                        return BREAK_MINS * 60;
                    } else {
                        setTimerMode('focus');
                        setSession(prev => prev + 1);
                        return FOCUS_MINS * 60;
                    }
                }
                return s - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [running, timerMode]);

    const resetTimer = () => { setRunning(false); setTimerMode('focus'); setSeconds(FOCUS_MINS * 60); };
    const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    const progress = timerMode === 'focus' ? 1 - seconds / (FOCUS_MINS * 60) : 1 - seconds / (BREAK_MINS * 60);

    const copyCode = () => { navigator.clipboard.writeText(roomCode); setCopied(true); setTimeout(() => setCopied(false), 2000); };

    // Mock participants
    const participants = [
        { name: 'You', emoji: '👨‍💻', subject: 'Machine Learning', status: 'Focusing' },
        { name: 'Ananya R.', emoji: '👩‍💻', subject: 'Data Science', status: 'Focusing' },
        { name: 'Carlos M.', emoji: '👨‍🔬', subject: 'Algorithms', status: 'On Break' },
    ];

    const circumference = 2 * Math.PI * 54;

    return (
        <div className="min-h-screen px-6 py-6 bg-grid">
            {/* Navbar */}
            <nav className="glass px-6 py-4 rounded-2xl mb-8 flex items-center justify-between border border-purple-500/10">
                <Link href="/dashboard" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center"><GraduationCap size={17} className="text-white" /></div>
                    <span className="text-lg font-black gradient-text hidden sm:block">UniConnect</span>
                </Link>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-slate-400">Study Room</span>
                    <button onClick={copyCode} className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1.5">
                        {copied ? <><Check size={13} className="text-emerald-400" /> Copied!</> : <><Copy size={13} /> {roomCode}</>}
                    </button>
                </div>
                <Link href="/dashboard" className="btn-ghost text-xs py-1.5 px-3">← Dashboard</Link>
            </nav>

            <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left: Timer + Info */}
                    <div className="space-y-6">
                        {/* Pomodoro Timer */}
                        <div className="glass-strong rounded-2xl p-8 text-center">
                            <div className="flex gap-2 justify-center mb-6">
                                <button onClick={() => { setTimerMode('focus'); setSeconds(FOCUS_MINS * 60); setRunning(false); }}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${timerMode === 'focus' ? 'gradient-bg text-white' : 'btn-ghost'}`}>
                                    🎯 Focus
                                </button>
                                <button onClick={() => { setTimerMode('break'); setSeconds(BREAK_MINS * 60); setRunning(false); }}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${timerMode === 'break' ? 'gradient-bg text-white' : 'btn-ghost'}`}>
                                    ☕ Break
                                </button>
                            </div>

                            {/* Circular progress */}
                            <div className="relative w-40 h-40 mx-auto mb-6">
                                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                                    <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(139,92,246,0.1)" strokeWidth="8" />
                                    <circle cx="60" cy="60" r="54" fill="none"
                                        stroke={timerMode === 'focus' ? '#7c3aed' : '#06b6d4'}
                                        strokeWidth="8" strokeLinecap="round"
                                        strokeDasharray={circumference}
                                        strokeDashoffset={circumference * (1 - progress)}
                                        style={{ transition: 'stroke-dashoffset 0.5s ease', filter: `drop-shadow(0 0 8px ${timerMode === 'focus' ? 'rgba(124,58,237,0.6)' : 'rgba(6,182,212,0.6)'})` }}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-4xl font-black text-white tabular-nums">{formatTime(seconds)}</span>
                                    <span className={`text-xs font-medium mt-1 ${timerMode === 'focus' ? 'text-purple-400' : 'text-cyan-400'}`}>
                                        {timerMode === 'focus' ? 'Focus Time' : 'Break Time'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center justify-center gap-4 mb-4">
                                <button onClick={resetTimer} className="w-10 h-10 glass rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                                    <RotateCcw size={16} />
                                </button>
                                <button onClick={() => setRunning(r => !r)}
                                    className="w-16 h-16 rounded-full gradient-bg flex items-center justify-center text-white glow-purple hover:scale-105 transition-transform">
                                    {running ? <Pause size={26} /> : <Play size={26} className="ml-1" />}
                                </button>
                            </div>

                            <div className="glass rounded-xl px-4 py-3 text-sm">
                                <span className="text-slate-400">Session </span>
                                <span className="gradient-text font-bold">{session}</span>
                                <span className="text-slate-400"> · Pomodoro Technique</span>
                            </div>
                        </div>

                        {/* Room Info */}
                        <div className="glass rounded-2xl p-6">
                            <h3 className="font-semibold text-white text-sm mb-4 flex items-center gap-2">
                                <Users size={16} className="text-purple-400" /> Room Members
                            </h3>
                            <div className="space-y-3">
                                {participants.map((p, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full gradient-bg flex items-center justify-center text-base flex-shrink-0">{p.emoji}</div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm text-white font-medium truncate">{p.name}</div>
                                            <div className="text-xs text-slate-500 truncate">{p.subject}</div>
                                        </div>
                                        <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${p.status === 'Focusing' ? 'text-purple-400 bg-purple-500/10' : 'text-cyan-400 bg-cyan-500/10'}`}>
                                            {p.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 pt-4 border-t border-purple-500/10 text-center">
                                <p className="text-xs text-slate-500 mb-2">Share room code with friends</p>
                                <button onClick={copyCode}
                                    className="w-full btn-ghost text-sm py-2 flex items-center justify-center gap-2">
                                    {copied ? <><Check size={14} className="text-emerald-400" /> Copied!</> : <><Copy size={14} /> Copy code: {roomCode}</>}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right: Video Grid */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white">📹 Group Study Session</h2>
                            <div className="flex gap-2">
                                <button onClick={() => setCamOff(c => !c)} className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm transition-all ${camOff ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'glass text-slate-400 hover:text-white'}`}>
                                    {camOff ? <VideoOff size={16} /> : <Video size={16} />}
                                </button>
                                <button onClick={() => setMuted(m => !m)} className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm transition-all ${muted ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'glass text-slate-400 hover:text-white'}`}>
                                    {muted ? <MicOff size={16} /> : <Mic size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Video Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Your video */}
                            <div className="video-tile aspect-video flex items-center justify-center relative">
                                <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover absolute inset-0" style={{ transform: 'scaleX(-1)' }} />
                                {camOff && (
                                    <div className="absolute inset-0 flex items-center justify-center z-10 bg-slate-900/80">
                                        <div className="w-16 h-16 rounded-full gradient-bg flex items-center justify-center text-2xl glow-purple">👨‍💻</div>
                                    </div>
                                )}
                                <div className="absolute bottom-2 left-2 glass px-2 py-1 rounded-lg text-xs text-white">You {muted && '🔇'}</div>
                            </div>

                            {/* Mock participants */}
                            {participants.slice(1).map((p, i) => (
                                <div key={i} className="video-tile aspect-video flex items-center justify-center relative">
                                    <div className="flex flex-col items-center justify-center h-full">
                                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center text-2xl mb-2">
                                            {p.emoji}
                                        </div>
                                        <p className="text-xs text-slate-400">{p.name}</p>
                                    </div>
                                    <div className="absolute bottom-2 left-2 glass px-2 py-1 rounded-lg text-xs text-white">{p.name}</div>
                                    <div className={`absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full ${p.status === 'Focusing' ? 'bg-purple-500/20 text-purple-400' : 'bg-cyan-500/20 text-cyan-400'}`}>
                                        {p.status}
                                    </div>
                                </div>
                            ))}

                            {/* Empty slot */}
                            <div className="video-tile aspect-video flex items-center justify-center border-dashed border-2 border-purple-500/20" style={{ background: 'rgba(15,12,40,0.3)' }}>
                                <div className="text-center">
                                    <div className="w-10 h-10 rounded-full glass flex items-center justify-center mx-auto mb-2 text-slate-500">+</div>
                                    <p className="text-xs text-slate-600">Invite with code<br /><span className="text-purple-500 font-mono">{roomCode}</span></p>
                                </div>
                            </div>
                        </div>

                        {/* Session Notes */}
                        <div className="glass rounded-2xl p-6">
                            <h3 className="font-semibold text-white text-sm mb-3">📝 Session Notes (shared)</h3>
                            <textarea
                                placeholder="Take notes here... everyone in the room can see these."
                                className="input-dark w-full h-32 resize-none text-sm"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
