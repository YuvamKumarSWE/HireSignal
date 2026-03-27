import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { auth } from './firebase';
import { apiFetch } from './api';

export default function ProfilePage() {
    const navigate = useNavigate();
    const [interviews, setInterviews] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expanded, setExpanded] = useState(null);
    const user = auth.currentUser;

    useEffect(() => {
        if (!user) { navigate('/auth'); return; }
        apiFetch('/api/user/interviews')
            .then(r => r.json())
            .then(data => { if (data.success) setInterviews(data.interviews); else setError('Failed to load interviews'); })
            .catch(() => setError('Failed to connect to server'))
            .finally(() => setIsLoading(false));
    }, [user, navigate]);

    return (
        <div className="min-h-screen flex flex-col relative" style={{ background: 'var(--bg)' }}>

            {/* Ambient */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute rounded-full blur-[150px] opacity-[0.06]"
                    style={{ width: 500, height: 500, top: 0, right: 0, background: 'radial-gradient(circle, #7C6FF7, transparent)' }} />
            </div>

            {/* Nav */}
            <nav className="px-8 py-6 flex justify-between items-center relative z-10" style={{ borderBottom: '1px solid var(--border)' }}>
                <div onClick={() => navigate('/')} className="cursor-pointer text-sm font-bold tracking-[0.2em] uppercase"
                    style={{ fontFamily: 'var(--font-sans)' }}>
                    HireSignal
                </div>
                <button onClick={() => navigate('/dashboard')}
                    className="text-sm font-medium px-5 py-2 rounded-full transition-all"
                    style={{ background: 'linear-gradient(135deg, #7C6FF7, #4F9EF8)', color: '#fff', fontFamily: 'var(--font-sans)' }}>
                    New Interview
                </button>
            </nav>

            <main className="flex-1 p-6 pt-12 max-w-2xl mx-auto w-full relative z-10">

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-10">
                    <h1 className="text-5xl md:text-6xl mb-2" style={{ fontFamily: 'var(--font-serif)' }}>History.</h1>
                    {user && (
                        <p className="text-sm" style={{ color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>
                            {user.displayName || user.email}
                        </p>
                    )}
                </motion.div>

                {/* Loading */}
                {isLoading && (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
                            style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#F87171', fontFamily: 'var(--font-sans)' }}>
                        {error}
                    </div>
                )}

                {/* Empty state */}
                {!isLoading && !error && interviews.length === 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24">
                        <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center"
                            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                            <span style={{ color: 'var(--muted)', fontSize: 24 }}>◎</span>
                        </div>
                        <p className="text-xl mb-2" style={{ fontFamily: 'var(--font-serif)' }}>No interviews yet.</p>
                        <p className="text-sm mb-8" style={{ color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>
                            Complete your first interview to see results here.
                        </p>
                        <button onClick={() => navigate('/dashboard')}
                            className="px-8 py-3 rounded-full text-sm font-semibold"
                            style={{ background: 'linear-gradient(135deg, #7C6FF7, #4F9EF8)', color: '#fff', fontFamily: 'var(--font-sans)' }}>
                            Start Interview
                        </button>
                    </motion.div>
                )}

                {/* List */}
                <div className="space-y-3">
                    {interviews.map((interview, i) => {
                        const pct = interview.evaluation ? Math.round(interview.evaluation.hire_probability * 100) : null;
                        const scoreColor = pct >= 70 ? '#34D399' : pct >= 45 ? '#F59E0B' : '#F87171';
                        const isOpen = expanded === interview.sessionId;
                        const date = interview.completedAt
                            ? new Date(interview.completedAt._seconds * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                            : '—';

                        return (
                            <motion.div
                                key={interview.sessionId}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05, duration: 0.4 }}
                                className="rounded-2xl overflow-hidden"
                                style={{ background: 'var(--surface)', border: `1px solid ${isOpen ? 'rgba(124,111,247,0.3)' : 'var(--border)'}`, transition: 'border-color 0.2s' }}
                            >
                                {/* Header row */}
                                <button
                                    onClick={() => setExpanded(isOpen ? null : interview.sessionId)}
                                    className="w-full px-6 py-5 flex items-center justify-between text-left transition-colors"
                                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                >
                                    <div>
                                        <p className="text-sm font-medium mb-1" style={{ fontFamily: 'var(--font-sans)', color: 'var(--text)' }}>
                                            {interview.jobSpec?.role || 'Interview'}
                                            {interview.jobSpec?.level && <span className="ml-2 text-xs px-2 py-0.5 rounded-full"
                                                style={{ background: 'var(--surface-2)', color: 'var(--muted)', border: '1px solid var(--border)' }}>
                                                {interview.jobSpec.level}
                                            </span>}
                                        </p>
                                        {interview.jobSpec?.company && (
                                            <p className="text-xs mb-1" style={{ color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>
                                                {interview.jobSpec.company}
                                            </p>
                                        )}
                                        <p className="text-xs" style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{date}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {pct !== null && (
                                            <span className="text-2xl font-bold" style={{ fontFamily: 'var(--font-serif)', color: scoreColor }}>
                                                {pct}%
                                            </span>
                                        )}
                                        <motion.span
                                            animate={{ rotate: isOpen ? 180 : 0 }}
                                            transition={{ duration: 0.2 }}
                                            style={{ color: 'var(--muted)', display: 'inline-block', fontSize: 14 }}>
                                            ↓
                                        </motion.span>
                                    </div>
                                </button>

                                {/* Expandable body */}
                                <AnimatePresence initial={false}>
                                    {isOpen && (
                                        <motion.div
                                            key="body"
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                                            style={{ overflow: 'hidden' }}
                                        >
                                            <div className="px-6 pb-6 space-y-6" style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>

                                                {/* Evaluation */}
                                                {interview.evaluation && (
                                                    <div>
                                                        <p className="text-xs font-medium tracking-[0.2em] uppercase mb-3"
                                                            style={{ color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>Evaluation</p>
                                                        <p className="text-sm leading-relaxed mb-4"
                                                            style={{ color: 'var(--text)', fontFamily: 'var(--font-sans)', lineHeight: 1.7 }}>
                                                            {interview.evaluation.final_verdict}
                                                        </p>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="p-4 rounded-xl" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                                                                <p className="text-xs mb-2" style={{ color: '#34D399', fontFamily: 'var(--font-sans)', fontWeight: 500 }}>Strengths</p>
                                                                <ul className="space-y-1.5">
                                                                    {interview.evaluation.strengths.map((s, j) => (
                                                                        <li key={j} className="flex gap-2 text-xs" style={{ fontFamily: 'var(--font-sans)', color: 'var(--text)', lineHeight: 1.5 }}>
                                                                            <span style={{ color: '#34D399' }}>+</span>{s}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                            <div className="p-4 rounded-xl" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                                                                <p className="text-xs mb-2" style={{ color: '#F87171', fontFamily: 'var(--font-sans)', fontWeight: 500 }}>To Improve</p>
                                                                <ul className="space-y-1.5">
                                                                    {interview.evaluation.weaknesses.map((w, j) => (
                                                                        <li key={j} className="flex gap-2 text-xs" style={{ fontFamily: 'var(--font-sans)', color: 'var(--text)', lineHeight: 1.5 }}>
                                                                            <span style={{ color: '#F87171' }}>−</span>{w}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Q&A */}
                                                {interview.answers?.length > 0 && (
                                                    <div>
                                                        <p className="text-xs font-medium tracking-[0.2em] uppercase mb-4"
                                                            style={{ color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>Transcript</p>
                                                        <div className="space-y-4">
                                                            {interview.answers.map((qa, j) => (
                                                                <div key={j} className="space-y-2">
                                                                    <p className="text-xs font-medium" style={{ color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>
                                                                        Q{j + 1} — {qa.question}
                                                                    </p>
                                                                    <p className="text-sm pl-4 leading-relaxed"
                                                                        style={{ borderLeft: '2px solid var(--border)', color: 'var(--text)', fontFamily: 'var(--font-sans)', lineHeight: 1.7 }}>
                                                                        {qa.answer}
                                                                    </p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>
            </main>
        </div>
    );
}
