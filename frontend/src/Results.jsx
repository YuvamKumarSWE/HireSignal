import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Results() {
    const { state } = useLocation();
    const navigate = useNavigate();

    if (!state?.evaluation) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
                <div className="text-center">
                    <h1 className="text-4xl mb-4" style={{ fontFamily: 'var(--font-serif)' }}>No results found.</h1>
                    <p className="text-sm mb-8" style={{ color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>Complete an interview to see your evaluation.</p>
                    <button onClick={() => navigate('/dashboard')}
                        className="px-8 py-3 rounded-full text-sm font-medium"
                        style={{ background: 'linear-gradient(135deg, #7C6FF7, #4F9EF8)', color: '#fff', fontFamily: 'var(--font-sans)' }}>
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const { hire_probability, strengths, weaknesses, final_verdict } = state.evaluation;
    const pct = Math.round(hire_probability * 100);
    const scoreColor = pct >= 70 ? '#34D399' : pct >= 45 ? '#F59E0B' : '#F87171';
    const scoreLabel = pct >= 70 ? 'Strong Hire' : pct >= 45 ? 'Borderline' : 'Not Yet';

    return (
        <div className="min-h-screen flex flex-col relative" style={{ background: 'var(--bg)' }}>

            {/* Ambient glow based on score */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute rounded-full blur-[150px] opacity-[0.07]"
                    style={{ width: 600, height: 600, top: -100, left: '50%', transform: 'translateX(-50%)', background: `radial-gradient(circle, ${scoreColor}, transparent)` }} />
            </div>

            {/* Nav */}
            <nav className="px-8 py-6 flex justify-between items-center relative z-10" style={{ borderBottom: '1px solid var(--border)' }}>
                <div onClick={() => navigate('/')} className="cursor-pointer text-sm font-bold tracking-[0.2em] uppercase"
                    style={{ fontFamily: 'var(--font-sans)' }}>
                    HireSignal
                </div>
            </nav>

            <main className="flex-1 flex flex-col items-center p-6 pt-12 max-w-2xl mx-auto w-full relative z-10">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12"
                >
                    <h1 className="text-5xl md:text-6xl mb-3" style={{ fontFamily: 'var(--font-serif)' }}>The Verdict.</h1>
                    <p className="text-sm" style={{ color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>Your interview evaluation</p>
                </motion.div>

                <div className="w-full space-y-4">

                    {/* Score */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.6 }}
                        className="p-8 rounded-2xl text-center"
                        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                    >
                        <p className="text-xs font-medium tracking-[0.2em] uppercase mb-4" style={{ color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>
                            Hire Probability
                        </p>
                        <div className="text-[6rem] font-bold leading-none mb-3" style={{ fontFamily: 'var(--font-serif)', color: scoreColor }}>
                            {pct}%
                        </div>
                        <span className="text-xs px-4 py-1.5 rounded-full font-medium"
                            style={{ background: `${scoreColor}18`, border: `1px solid ${scoreColor}40`, color: scoreColor, fontFamily: 'var(--font-sans)' }}>
                            {scoreLabel}
                        </span>

                        {/* Score bar */}
                        <div className="mt-6 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
                            <motion.div
                                className="h-full rounded-full"
                                style={{ background: scoreColor }}
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ delay: 0.5, duration: 1, ease: 'easeOut' }}
                            />
                        </div>
                    </motion.div>

                    {/* Strengths + Weaknesses side by side */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                        className="grid grid-cols-2 gap-4"
                    >
                        <div className="p-6 rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                            <p className="text-xs font-medium tracking-[0.2em] uppercase mb-4" style={{ color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>
                                Strengths
                            </p>
                            <ul className="space-y-3">
                                {strengths.map((s, i) => (
                                    <li key={i} className="flex gap-2.5 text-sm" style={{ fontFamily: 'var(--font-sans)', lineHeight: 1.5 }}>
                                        <span className="mt-0.5 font-bold flex-shrink-0" style={{ color: '#34D399' }}>+</span>
                                        {s}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="p-6 rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                            <p className="text-xs font-medium tracking-[0.2em] uppercase mb-4" style={{ color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>
                                To Improve
                            </p>
                            <ul className="space-y-3">
                                {weaknesses.map((w, i) => (
                                    <li key={i} className="flex gap-2.5 text-sm" style={{ fontFamily: 'var(--font-sans)', lineHeight: 1.5 }}>
                                        <span className="mt-0.5 font-bold flex-shrink-0" style={{ color: '#F87171' }}>−</span>
                                        {w}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </motion.div>

                    {/* Final verdict */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                        className="p-6 rounded-2xl"
                        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                    >
                        <p className="text-xs font-medium tracking-[0.2em] uppercase mb-3" style={{ color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>
                            Final Verdict
                        </p>
                        <p className="text-sm leading-relaxed" style={{ fontFamily: 'var(--font-sans)', color: 'var(--text)', lineHeight: 1.8 }}>
                            {final_verdict}
                        </p>
                    </motion.div>

                    {/* Actions */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="flex gap-3 pt-2"
                    >
                        <button onClick={() => navigate('/profile')}
                            className="flex-1 py-4 rounded-2xl text-sm font-medium transition-all"
                            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'var(--font-sans)' }}
                            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(124,111,247,0.4)'}
                            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                            View History
                        </button>
                        <button onClick={() => navigate('/dashboard')}
                            className="flex-1 py-4 rounded-2xl text-sm font-semibold"
                            style={{ background: 'linear-gradient(135deg, #7C6FF7, #4F9EF8)', color: '#fff', fontFamily: 'var(--font-sans)', boxShadow: '0 0 30px rgba(124,111,247,0.2)' }}>
                            New Interview
                        </button>
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
