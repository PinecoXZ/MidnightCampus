'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { GraduationCap, Mail, Lock, User, Building2, Eye, EyeOff, ArrowRight, CheckCircle2, RefreshCw } from 'lucide-react';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const VALID_DOMAINS = ['.edu', '.ac.in', '.ac.uk', '.edu.au', '.ac.nz', '.edu.sg', '.edu.my', '.edu.pk'];

function AuthPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isSignUp, setIsSignUp] = useState(searchParams.get('signup') === 'true');
    const [step, setStep] = useState<'form' | 'otp'>('form');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [otp, setOtp] = useState('');
    const [demoOtp, setDemoOtp] = useState('');

    const [form, setForm] = useState({ name: '', email: '', password: '', university: '' });

    const updateForm = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

    const isUniversityEmail = (email: string) => VALID_DOMAINS.some(d => email.toLowerCase().endsWith(d));

    const handleSignUp = async () => {
        setError('');
        if (!form.name || !form.email || !form.password) { setError('All fields are required.'); return; }
        if (!isUniversityEmail(form.email)) { setError('Please use a valid university email (.edu, .ac.in, etc.)'); return; }
        if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
        setLoading(true);
        try {
            const res = await axios.post(`${API}/auth/register`, form);
            setDemoOtp(res.data.otp || '');
            setStep('otp');
        } catch (e: any) {
            setError(e.response?.data?.error || 'Failed to register. Try again.');
        } finally { setLoading(false); }
    };

    const handleVerifyOtp = async () => {
        setError('');
        if (!otp || otp.length !== 6) { setError('Enter the 6-digit OTP.'); return; }
        setLoading(true);
        try {
            const res = await axios.post(`${API}/auth/verify-otp`, { email: form.email, otp });
            localStorage.setItem('uc_token', res.data.token);
            localStorage.setItem('uc_user', JSON.stringify(res.data.user));
            router.push('/dashboard');
        } catch (e: any) {
            setError(e.response?.data?.error || 'Invalid OTP.');
        } finally { setLoading(false); }
    };

    const handleLogin = async () => {
        setError('');
        if (!form.email || !form.password) { setError('Email and password are required.'); return; }
        setLoading(true);
        try {
            const res = await axios.post(`${API}/auth/login`, { email: form.email, password: form.password });
            localStorage.setItem('uc_token', res.data.token);
            localStorage.setItem('uc_user', JSON.stringify(res.data.user));
            router.push('/dashboard');
        } catch (e: any) {
            setError(e.response?.data?.error || 'Login failed. Check your credentials.');
        } finally { setLoading(false); }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-grid">
            <div className="w-full max-w-md">
                {/* Logo */}
                <Link href="/" className="flex items-center justify-center gap-3 mb-10">
                    <div className="w-11 h-11 rounded-xl gradient-bg flex items-center justify-center glow-purple">
                        <GraduationCap size={24} className="text-white" />
                    </div>
                    <span className="text-2xl font-black gradient-text">UniConnect</span>
                </Link>

                <div className="glass-strong rounded-3xl p-8">
                    {/* Toggle */}
                    {step === 'form' && (
                        <div className="flex rounded-xl overflow-hidden mb-8 p-1" style={{ background: 'rgba(15,12,40,0.8)', border: '1px solid rgba(139,92,246,0.2)' }}>
                            <button
                                onClick={() => { setIsSignUp(false); setError(''); }}
                                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${!isSignUp ? 'gradient-bg text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                            >
                                Log In
                            </button>
                            <button
                                onClick={() => { setIsSignUp(true); setError(''); }}
                                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${isSignUp ? 'gradient-bg text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                            >
                                Sign Up
                            </button>
                        </div>
                    )}

                    {/* OTP Step */}
                    {step === 'otp' ? (
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-full gradient-bg flex items-center justify-center mx-auto mb-6 glow-purple">
                                <Mail size={28} className="text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Check your email</h2>
                            <p className="text-slate-400 text-sm mb-2">We sent a 6-digit OTP to <span className="text-purple-400">{form.email}</span></p>
                            {demoOtp && (
                                <div className="glass rounded-xl p-3 mb-6 border border-amber-500/20">
                                    <p className="text-xs text-amber-400">🧪 Demo Mode — Your OTP is: <strong className="text-amber-300 text-base">{demoOtp}</strong></p>
                                </div>
                            )}
                            {!demoOtp && <div className="mb-6" />}
                            <input
                                type="text"
                                placeholder="Enter 6-digit OTP"
                                value={otp}
                                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                className="input-dark text-center text-3xl tracking-[0.4em] font-mono mb-4"
                                maxLength={6}
                            />
                            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
                            <button onClick={handleVerifyOtp} disabled={loading} className="btn-primary w-full justify-center flex items-center gap-2">
                                {loading ? <><div className="spinner" style={{ width: 18, height: 18 }} /> Verifying...</> : <><CheckCircle2 size={18} /> Verify & Continue</>}
                            </button>
                            <button onClick={() => { setStep('form'); setError(''); setOtp(''); }} className="mt-4 text-slate-500 text-sm hover:text-slate-300 flex items-center gap-1 mx-auto">
                                <RefreshCw size={14} /> Start over
                            </button>
                        </div>
                    ) : (
                        <>
                            <h2 className="text-2xl font-bold text-white mb-6">{isSignUp ? '🎓 Create your account' : '👋 Welcome back'}</h2>

                            <div className="space-y-4">
                                {isSignUp && (
                                    <div className="relative">
                                        <User size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                                        <input type="text" placeholder="Full Name" value={form.name} onChange={e => updateForm('name', e.target.value)}
                                            className="input-dark pl-11" />
                                    </div>
                                )}
                                <div className="relative">
                                    <Mail size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <input type="email" placeholder="University email (.edu, .ac, etc.)" value={form.email} onChange={e => updateForm('email', e.target.value)}
                                        className="input-dark pl-11" />
                                </div>
                                {isSignUp && (
                                    <div className="relative">
                                        <Building2 size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                                        <input type="text" placeholder="University name" value={form.university} onChange={e => updateForm('university', e.target.value)}
                                            className="input-dark pl-11" />
                                    </div>
                                )}
                                <div className="relative">
                                    <Lock size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <input type={showPass ? 'text' : 'password'} placeholder="Password (min. 6 chars)" value={form.password} onChange={e => updateForm('password', e.target.value)}
                                        className="input-dark pl-11 pr-12" onKeyDown={e => e.key === 'Enter' && (isSignUp ? handleSignUp() : handleLogin())} />
                                    <button onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                                        {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                                    </button>
                                </div>
                            </div>

                            {!isUniversityEmail(form.email) && form.email.includes('@') && (
                                <p className="text-amber-400 text-xs mt-3">⚠️ Must be a university email (.edu, .ac.in, .ac.uk, .ac, etc.)</p>
                            )}

                            {error && <p className="text-red-400 text-sm mt-4">{error}</p>}

                            <button
                                onClick={isSignUp ? handleSignUp : handleLogin}
                                disabled={loading}
                                className="btn-primary w-full mt-6 flex items-center justify-center gap-2"
                            >
                                {loading
                                    ? <><div className="spinner" style={{ width: 18, height: 18 }} /> {isSignUp ? 'Sending OTP...' : 'Logging in...'}</>
                                    : <>{isSignUp ? 'Send OTP' : 'Log In'} <ArrowRight size={18} /></>
                                }
                            </button>

                            <p className="text-center text-slate-500 text-sm mt-6">
                                {isSignUp ? 'Already have an account? ' : 'New to UniConnect? '}
                                <button onClick={() => { setIsSignUp(!isSignUp); setError(''); }} className="text-purple-400 hover:text-purple-300 font-medium">
                                    {isSignUp ? 'Log in' : 'Sign up free'}
                                </button>
                            </p>
                        </>
                    )}
                </div>

                <p className="text-center text-slate-600 text-xs mt-6">
                    By continuing, you agree to our Terms of Service and Privacy Policy
                </p>
            </div>
        </div>
    );
}

import { Suspense } from 'react';
export default function AuthPageWrapper() {
    return <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="spinner" /></div>}><AuthPage /></Suspense>;
}
