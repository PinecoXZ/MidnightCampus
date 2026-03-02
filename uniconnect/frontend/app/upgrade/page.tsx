import Link from 'next/link';
import { GraduationCap, ArrowLeft, CheckCircle2, Shield, Zap, Sparkles, Filter, Infinity } from 'lucide-react';

export default function UpgradePage() {
    return (
        <div className="min-h-screen bg-grid py-10 px-6">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="text-center mb-16 relative">
                    <Link href="/dashboard" className="absolute left-0 top-1 text-slate-400 hover:text-white flex items-center gap-1 text-sm btn-ghost px-3 py-2">
                        <ArrowLeft size={16} /> Dashboard
                    </Link>
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 mb-6 glow-amber shadow-xl">
                        <Sparkles size={32} className="text-white" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
                        Upgrade to <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Premium</span>
                    </h1>
                    <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                        Take control of your connections. Filter by university, access unlimited chats, and get priority matchmaking.
                    </p>
                </div>

                {/* Pricing Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-20">

                    {/* Free Tier */}
                    <div className="glass rounded-3xl p-8 border border-white/5 relative flex flex-col">
                        <div className="mb-6 text-slate-400 font-bold uppercase tracking-wider text-sm">Basic</div>
                        <div className="mb-6">
                            <span className="text-4xl font-black text-white">₹0</span>
                            <span className="text-slate-500"> / forever</span>
                        </div>
                        <p className="text-slate-400 text-sm mb-8 pb-8 border-b border-purple-500/10">
                            Everything you need to start meeting students right now.
                        </p>
                        <ul className="space-y-4 mb-10 flex-1">
                            {['Random worldwide matching', 'Campus & Study modes', 'Anonymous aliases', 'Basic reputation system', 'Standard match speed (15-30s)'].map((feature, i) => (
                                <li key={i} className="flex items-start gap-3 text-slate-300 text-sm">
                                    <CheckCircle2 size={18} className="text-slate-500 flex-shrink-0 mt-0.5" />
                                    {feature}
                                </li>
                            ))}
                        </ul>
                        <button disabled className="w-full py-4 rounded-xl glass text-slate-500 font-semibold cursor-not-allowed border border-white/5">
                            Your Current Plan
                        </button>
                    </div>

                    {/* Premium Tier */}
                    <div className="rounded-3xl p-8 relative flex flex-col border border-amber-500/50 shadow-2xl" style={{ background: 'linear-gradient(180deg, rgba(245,158,11,0.1) 0%, rgba(15,23,42,0.8) 100%)' }}>
                        <div className="absolute top-0 right-8 transform -translate-y-1/2 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
                            Most Popular
                        </div>
                        <div className="mb-6 text-amber-500 font-bold uppercase tracking-wider text-sm">Premium</div>
                        <div className="mb-6">
                            <span className="text-4xl font-black text-white">₹199</span>
                            <span className="text-slate-500"> / month</span>
                        </div>
                        <p className="text-emerald-400 text-sm mb-8 pb-8 border-b border-amber-500/20 font-medium">
                            Or save 20% by paying ₹599 quarterly.
                        </p>
                        <ul className="space-y-4 mb-10 flex-1">
                            {[
                                { text: 'Filter matches by Country / Uni / Major', icon: <Filter size={18} className="text-amber-500 flex-shrink-0 mt-0.5" /> },
                                { text: 'Unlimited daily chats/extensions', icon: <Infinity size={18} className="text-amber-500 flex-shrink-0 mt-0.5" /> },
                                { text: 'Priority matchmaking (instant)', icon: <Zap size={18} className="text-amber-500 flex-shrink-0 mt-0.5" /> },
                                { text: 'Reconnect feature for skipped users', icon: <Shield size={18} className="text-amber-500 flex-shrink-0 mt-0.5" /> },
                                { text: 'Exclusive profile badge', icon: <Sparkles size={18} className="text-amber-500 flex-shrink-0 mt-0.5" /> },
                            ].map((feature, i) => (
                                <li key={i} className="flex items-start gap-3 text-white text-sm font-medium">
                                    {feature.icon}
                                    {feature.text}
                                </li>
                            ))}
                        </ul>
                        <button className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold transition-all shadow-lg hover:shadow-amber-500/25 relative group overflow-hidden">
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                Upgrade Now <ArrowLeft className="rotate-180" size={16} />
                            </span>
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                        </button>
                    </div>

                </div>

                {/* FAQ or Trust Badges could go here */}
                <div className="text-center text-slate-500 text-sm flex items-center justify-center gap-2">
                    <Shield size={14} /> Secure payments processed via Razorpay
                </div>
            </div>
        </div>
    );
}
