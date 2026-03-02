'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { Mic, MicOff, Video, VideoOff, PhoneOff, SkipForward, Send, Flag, GraduationCap, Loader2, Users, Timer, ThumbsUp, PlusCircle } from 'lucide-react';
import Link from 'next/link';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';
const ICE_SERVERS = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }] };

type ChatStatus = 'connecting' | 'waiting' | 'matched' | 'disconnected';

interface Message { text: string; fromSelf: boolean; ts: string; }
interface PeerInfo { name: string; university: string; tags: string[]; reputation?: number; }

function ChatPageInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const mode = searchParams.get('mode') || 'random';

    const socketRef = useRef<Socket | null>(null);
    const pcRef = useRef<RTCPeerConnection | null>(null);
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [status, setStatus] = useState<ChatStatus>('connecting');
    const [muted, setMuted] = useState(false);
    const [camOff, setCamOff] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMsg, setInputMsg] = useState('');
    const [peerInfo, setPeerInfo] = useState<PeerInfo | null>(null);
    const [queueSize, setQueueSize] = useState(0);

    // New Features State
    const [icebreaker, setIcebreaker] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [canExtend, setCanExtend] = useState(true);
    const [hasUpvoted, setHasUpvoted] = useState(false);
    const [extendRequested, setExtendRequested] = useState(false);

    const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('uc_user') || 'null') : null;

    const initPeerConnection = useCallback((isInitiator: boolean) => {
        const pc = new RTCPeerConnection(ICE_SERVERS);
        pcRef.current = pc;

        localStreamRef.current?.getTracks().forEach(t => pc.addTrack(t, localStreamRef.current!));

        pc.ontrack = (e) => {
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0];
        };

        pc.onicecandidate = (e) => {
            if (e.candidate) socketRef.current?.emit('ice-candidate', { candidate: e.candidate });
        };

        pc.onconnectionstatechange = () => {
            if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
                setStatus('disconnected');
            }
        };

        if (isInitiator) {
            pc.createOffer().then(offer => {
                pc.setLocalDescription(offer);
                socketRef.current?.emit('webrtc-offer', { offer });
            });
        }

        return pc;
    }, []);

    useEffect(() => {
        let mounted = true;

        const start = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                localStreamRef.current = stream;
                if (localVideoRef.current) localVideoRef.current.srcObject = stream;
            } catch {
                console.warn('Camera/mic not available');
            }

            if (!mounted) return;
            const socket = io(SOCKET_URL, { transports: ['websocket'] });
            socketRef.current = socket;

            socket.on('connect', () => {
                setStatus('waiting');
                socket.emit('join-queue', {
                    mode,
                    userInfo: { name: user?.name, university: user?.university, tags: user?.tags || [], major: user?.major, year: user?.year }
                });
            });

            socket.on('waiting', ({ queueSize: qs }: { queueSize: number }) => {
                setQueueSize(qs);
                setStatus('waiting');
            });

            socket.on('matched', ({ peerInfo: pi, isInitiator, icebreaker: ib, timer }: { peerInfo: PeerInfo; isInitiator: boolean; icebreaker?: string; timer?: number }) => {
                setPeerInfo(pi);
                setIcebreaker(ib || null);
                if (timer) setTimeLeft(timer);
                setCanExtend(true);
                setExtendRequested(false);
                setHasUpvoted(false);
                setStatus('matched');
                setMessages([]);
                initPeerConnection(isInitiator);
            });

            socket.on('timer-update', ({ timeLeft: t }: { timeLeft: number }) => {
                setTimeLeft(t);
            });

            socket.on('chat-extended', ({ timer }: { timer: number }) => {
                setTimeLeft(timer);
                // Can only extend once
                setCanExtend(false);
                setExtendRequested(false);
            });

            socket.on('webrtc-offer', async ({ offer }: { offer: RTCSessionDescriptionInit }) => {
                const pc = pcRef.current || initPeerConnection(false);
                await pc.setRemoteDescription(offer);
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socket.emit('webrtc-answer', { answer });
            });

            socket.on('webrtc-answer', async ({ answer }: { answer: RTCSessionDescriptionInit }) => {
                await pcRef.current?.setRemoteDescription(answer);
            });

            socket.on('ice-candidate', async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
                try { await pcRef.current?.addIceCandidate(candidate); } catch { }
            });

            socket.on('receive-message', ({ message, timestamp }: { message: string; timestamp: string }) => {
                setMessages(prev => [...prev, { text: message, fromSelf: false, ts: timestamp }]);
            });

            socket.on('peer-disconnected', () => {
                setStatus('disconnected');
                setPeerInfo(null);
                setIcebreaker(null);
                setTimeLeft(null);
                if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
                pcRef.current?.close();
                pcRef.current = null;
            });

            socket.on('skipped', () => {
                setStatus('waiting');
                setPeerInfo(null);
                setIcebreaker(null);
                setTimeLeft(null);
                setMessages([]);
                if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
                pcRef.current?.close();
                pcRef.current = null;
                socket.emit('join-queue', {
                    mode,
                    userInfo: { name: user?.name, university: user?.university, tags: user?.tags || [], major: user?.major, year: user?.year }
                });
            });
        };

        start();

        return () => {
            mounted = false;
            localStreamRef.current?.getTracks().forEach(t => t.stop());
            socketRef.current?.disconnect();
            pcRef.current?.close();
        };
    }, [mode]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const toggleMute = () => {
        localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
        setMuted(m => !m);
    };

    const toggleCam = () => {
        localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
        setCamOff(c => !c);
    };

    const skip = () => socketRef.current?.emit('skip');
    const endChat = () => { socketRef.current?.disconnect(); router.push('/dashboard'); };

    const sendMessage = () => {
        if (!inputMsg.trim()) return;
        socketRef.current?.emit('send-message', { message: inputMsg });
        setMessages(prev => [...prev, { text: inputMsg, fromSelf: true, ts: new Date().toISOString() }]);
        setInputMsg('');
    };

    const extendChat = () => {
        if (!canExtend || extendRequested) return;
        socketRef.current?.emit('extend-chat');
        setExtendRequested(true);
        setMessages(prev => [...prev, { text: "⏳ You requested to extend the chat.", fromSelf: true, ts: new Date().toISOString() }]);
    };

    const upvotePeer = () => {
        if (hasUpvoted || status !== 'matched') return;
        socketRef.current?.emit('upvote');
        setHasUpvoted(true);
        setMessages(prev => [...prev, { text: "💖 You upvoted this user!", fromSelf: true, ts: new Date().toISOString() }]);
    };

    const formatTime = (seconds: number) => {
        if (seconds <= 0) return "0:00";
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const modeLabels: Record<string, string> = {
        random: '🎲 Random', campus: '🏫 Campus', studybuddy: '📚 Study Buddy',
        gaming: '🎮 Gaming Zone', techtalk: '💻 Tech Talk', ventroom: '💬 Vent Room'
    };

    return (
        <div className="h-screen flex flex-col bg-grid overflow-hidden">
            {/* Header */}
            <header className="glass px-6 py-3 flex items-center justify-between border-b border-purple-500/10 flex-shrink-0">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard" className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center"><GraduationCap size={16} className="text-white" /></div>
                        <span className="font-bold gradient-text hidden sm:block">UniConnect</span>
                    </Link>
                    <span className="glass px-3 py-1 rounded-full text-xs text-purple-300 border border-purple-500/20">{modeLabels[mode] || modeLabels['random']}</span>
                </div>

                <div className="flex items-center gap-3">
                    {status === 'matched' && peerInfo && timeLeft !== null && (
                        <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-mono text-sm border font-bold ${timeLeft < 30 ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse' : 'glass text-emerald-400 border-emerald-500/20'}`}>
                            <Timer size={14} />
                            {formatTime(timeLeft)}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <Link href="/dashboard" className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1.5"><Users size={13} /> Dashboard</Link>
                </div>
            </header>

            {/* Main */}
            <div className="flex flex-1 overflow-hidden">
                {/* Video Section */}
                <div className="flex-1 flex flex-col p-4 gap-4 min-w-0">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 min-h-0">
                        {/* Remote */}
                        <div className="video-tile flex items-center justify-center relative">
                            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover absolute inset-0" />
                            {status !== 'matched' && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                                    {status === 'connecting' && <><div className="spinner mb-4" /><p className="text-slate-400 text-sm">Connecting...</p></>}
                                    {status === 'waiting' && (
                                        <div className="text-center">
                                            <Loader2 size={40} className="text-purple-400 animate-spin mx-auto mb-4" />
                                            <p className="text-white font-medium mb-1">Finding your match...</p>
                                            <p className="text-slate-500 text-xs">{queueSize} student{queueSize !== 1 ? 's' : ''} in queue</p>
                                        </div>
                                    )}
                                    {status === 'disconnected' && (
                                        <div className="text-center">
                                            <p className="text-slate-400 mb-4 text-sm">Partner disconnected</p>
                                            <button onClick={skip} className="btn-primary text-sm py-2 px-4">Find Next →</button>
                                        </div>
                                    )}
                                </div>
                            )}
                            {status === 'matched' && peerInfo && (
                                <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 shadow-xl max-w-[80%]">
                                    <div className="flex items-center justify-between gap-4">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-white font-bold">{peerInfo.name}</span>
                                                <span className="text-xs bg-emerald-500/20 text-emerald-400 px-1.5 rounded flex items-center gap-1"><ThumbsUp size={10} /> {peerInfo.reputation || 0}</span>
                                            </div>
                                            <div className="text-slate-300 text-xs mt-0.5">{peerInfo.university || 'Hidden University'}</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Local */}
                        <div className="video-tile flex items-center justify-center relative">
                            <video ref={localVideoRef} autoPlay playsInline muted className={`w-full h-full object-cover absolute inset-0 ${camOff ? 'opacity-0' : 'opacity-100'}`} style={{ transform: 'scaleX(-1)' }} />
                            {camOff ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-slate-900/80 backdrop-blur-sm">
                                    <div className="w-16 h-16 rounded-full gradient-bg flex items-center justify-center text-xl glow-purple mb-4">
                                        {user?.name?.[0] || '?'}
                                    </div>
                                    <p className="text-slate-300 text-sm mb-4">Your camera is off for privacy.</p>
                                    <button onClick={toggleCam} className="btn-primary text-xs py-2 px-4 shadow-lg flex items-center gap-2">
                                        <Video size={14} /> Enable Camera
                                    </button>
                                </div>
                            ) : (
                                <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 shadow-xl">
                                    <div className="text-white text-sm font-medium flex items-center gap-2">You {muted && <span className="text-red-400 text-xs">🔇 Muted</span>}</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-center gap-4 flex-shrink-0">
                        <button onClick={toggleMute} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${muted ? 'bg-red-500/20 border border-red-500/40 text-red-400' : 'glass text-slate-300 hover:text-white'}`}>
                            {muted ? <MicOff size={20} /> : <Mic size={20} />}
                        </button>
                        <button onClick={toggleCam} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${camOff ? 'bg-red-500/20 border border-red-500/40 text-red-400' : 'glass text-slate-300 hover:text-white'}`}>
                            {camOff ? <VideoOff size={20} /> : <Video size={20} />}
                        </button>

                        <div className="w-px h-8 bg-slate-700 mx-2"></div>

                        <button onClick={skip} className="w-14 h-14 rounded-full gradient-bg flex items-center justify-center text-white font-bold glow-purple hover:scale-110 transition-transform text-sm shadow-lg">
                            <SkipForward size={22} />
                        </button>

                        <div className="w-px h-8 bg-slate-700 mx-2"></div>

                        <button onClick={upvotePeer} disabled={hasUpvoted || status !== 'matched'} title="Upvote this student" className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${hasUpvoted ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 cursor-default' : 'glass text-slate-300 hover:text-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed'}`}>
                            <ThumbsUp size={18} className={hasUpvoted ? 'fill-current' : ''} />
                        </button>

                        <button onClick={endChat} className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 hover:bg-red-500/40 transition-colors">
                            <PhoneOff size={20} />
                        </button>
                    </div>
                </div>

                {/* Chat Panel */}
                <div className="w-80 glass-strong border-l border-purple-500/10 flex flex-col hidden md:flex">
                    <div className="px-5 py-4 border-b border-purple-500/10 flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-white text-sm">Live Chat</h3>
                            {canExtend && status === 'matched' && timeLeft !== null && (
                                <button onClick={extendChat} disabled={extendRequested} className="text-xs flex items-center gap-1 text-amber-400 hover:text-amber-300 disabled:opacity-50 transition-colors">
                                    <PlusCircle size={14} /> {extendRequested ? 'Requested' : 'Extend'}
                                </button>
                            )}
                        </div>
                        {peerInfo?.tags && peerInfo.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-3">
                                {peerInfo.tags.slice(0, 3).map(t => <span key={t} className="tag-badge text-[10px] px-2 py-0.5">{t}</span>)}
                            </div>
                        )}
                    </div>

                    {status === 'matched' && icebreaker && (
                        <div className="px-4 py-3 bg-indigo-500/10 border-b border-indigo-500/20">
                            <div className="flex items-start gap-2">
                                <span className="text-indigo-400 text-lg leading-none mt-0.5">❄️</span>
                                <div>
                                    <div className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest mb-1">Icebreaker</div>
                                    <div className="text-xs text-indigo-100 italic">"{icebreaker}"</div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                        {messages.length === 0 && (
                            <div className="text-center text-slate-600 text-sm mt-8">
                                <p className="text-2xl mb-2">👋</p>
                                <p>{status === 'matched' ? 'Say hello!' : 'Messages will appear here when matched.'}</p>
                            </div>
                        )}
                        {messages.map((m, i) => (
                            <div key={i} className={m.fromSelf ? 'flex justify-end' : 'flex justify-start'}>
                                <div
                                    className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${m.fromSelf
                                        ? 'bg-gradient-to-br from-purple-600 to-violet-700 text-white rounded-tr-sm'
                                        : 'glass text-slate-200 rounded-tl-sm border border-purple-500/10'
                                        }`}
                                >
                                    {m.text}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="px-4 py-4 border-t border-purple-500/10 flex-shrink-0">
                        <div className="flex gap-2">
                            <input
                                value={inputMsg}
                                onChange={e => setInputMsg(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                                placeholder={status === 'matched' ? 'Type a message...' : 'Waiting for match...'}
                                disabled={status !== 'matched'}
                                className="input-dark flex-1 text-sm py-2.5 disabled:opacity-40"
                            />
                            <button onClick={sendMessage} disabled={status !== 'matched' || !inputMsg.trim()}
                                className="btn-primary px-3 py-2.5 disabled:opacity-40 disabled:cursor-not-allowed">
                                <Send size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

import { Suspense } from 'react';
export default function ChatPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="spinner" /></div>}>
            <ChatPageInner />
        </Suspense>
    );
}
