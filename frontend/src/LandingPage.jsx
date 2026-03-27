import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
    const navigate = useNavigate();
    const { scrollYProgress } = useScroll();
    const yHero = useTransform(scrollYProgress, [0, 1], [0, 180]);

    return (
        <div className="min-h-screen overflow-hidden relative" style={{ background: 'var(--bg)', color: 'var(--text)' }}>

            {/* Nav */}
            <nav className="fixed top-0 w-full px-8 py-6 flex justify-between items-center z-50"
                style={{ borderBottom: '1px solid var(--border)', backdropFilter: 'blur(20px)', background: 'rgba(7,7,26,0.7)' }}>
                <div className="text-base font-bold tracking-widest uppercase" style={{ fontFamily: 'var(--font-sans)', letterSpacing: '0.2em' }}>
                    HireSignal
                </div>
                <button
                    onClick={() => navigate('/auth')}
                    className="text-sm font-medium px-5 py-2 rounded-full transition-all"
                    style={{ border: '1px solid var(--border-strong)', color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}
                    onMouseEnter={e => { e.target.style.color = 'var(--text)'; e.target.style.borderColor = 'rgba(124,111,247,0.5)'; }}
                    onMouseLeave={e => { e.target.style.color = 'var(--muted)'; e.target.style.borderColor = 'var(--border-strong)'; }}
                >
                    Sign In
                </button>
            </nav>

            {/* Ambient orbs */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute rounded-full blur-[120px] opacity-20"
                    style={{ width: 600, height: 600, top: -100, left: -100, background: 'radial-gradient(circle, #7C6FF7, transparent)' }} />
                <div className="absolute rounded-full blur-[120px] opacity-10"
                    style={{ width: 500, height: 500, bottom: 100, right: -100, background: 'radial-gradient(circle, #4F9EF8, transparent)' }} />
            </div>

            {/* Hero */}
            <section className="h-screen flex flex-col items-center justify-center relative px-4">
                <motion.div
                    style={{ y: yHero }}
                    className="text-center relative z-10"
                >
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                        className="mb-6"
                    >
                        <span className="text-xs font-medium tracking-[0.3em] uppercase px-4 py-2 rounded-full"
                            style={{ border: '1px solid rgba(124,111,247,0.4)', color: 'var(--accent)', fontFamily: 'var(--font-sans)', background: 'rgba(124,111,247,0.08)' }}>
                            AI Interview Simulator
                        </span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 60 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                        className="text-[clamp(4rem,12vw,10rem)] leading-[0.88] tracking-tight mb-8"
                        style={{ fontFamily: 'var(--font-serif)' }}
                    >
                        the{' '}
                        <span className="italic" style={{ background: 'linear-gradient(135deg, #7C6FF7, #4F9EF8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            art
                        </span>
                        <br />
                        of talk.
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className="text-lg mb-12 max-w-md mx-auto"
                        style={{ color: 'var(--muted)', fontFamily: 'var(--font-sans)', lineHeight: 1.7 }}
                    >
                        Practice interviews with an AI that listens, speaks, and evaluates like a real interviewer.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7, duration: 0.6 }}
                        className="flex gap-4 justify-center"
                    >
                        <button
                            onClick={() => navigate('/auth')}
                            className="px-8 py-4 rounded-full font-semibold text-base transition-all"
                            style={{ background: 'linear-gradient(135deg, #7C6FF7, #4F9EF8)', color: '#fff', fontFamily: 'var(--font-sans)', boxShadow: '0 0 40px rgba(124,111,247,0.3)' }}
                            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 60px rgba(124,111,247,0.5)'}
                            onMouseLeave={e => e.currentTarget.style.boxShadow = '0 0 40px rgba(124,111,247,0.3)'}
                        >
                            Get Started Free
                        </button>
                        <button
                            onClick={() => window.scrollBy({ top: window.innerHeight, behavior: 'smooth' })}
                            className="px-8 py-4 rounded-full font-medium text-base transition-all"
                            style={{ border: '1px solid var(--border-strong)', color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}
                            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
                        >
                            Learn More
                        </button>
                    </motion.div>
                </motion.div>

                {/* Scroll line */}
                <motion.div
                    initial={{ opacity: 0, scaleY: 0 }}
                    animate={{ opacity: 1, scaleY: 1 }}
                    transition={{ delay: 1.2, duration: 0.8 }}
                    className="absolute bottom-10"
                    style={{ transformOrigin: 'top' }}
                >
                    <div className="w-px h-16 mx-auto" style={{ background: 'linear-gradient(to bottom, var(--accent), transparent)' }} />
                </motion.div>
            </section>

            {/* Feature: Voice */}
            <section className="min-h-screen flex items-center justify-center px-8 py-32">
                <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-24 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -40 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                    >
                        <div className="text-xs font-medium tracking-[0.25em] uppercase mb-6" style={{ color: 'var(--accent)', fontFamily: 'var(--font-sans)' }}>
                            01 / Voice
                        </div>
                        <h2 className="text-[clamp(3rem,6vw,5.5rem)] leading-[0.9] mb-8" style={{ fontFamily: 'var(--font-serif)' }}>
                            Real<br />Human<br />
                            <span className="italic" style={{ color: 'var(--muted)' }}>Voice.</span>
                        </h2>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, x: 40 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                    >
                        <div className="p-8 rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                            {/* Fake waveform */}
                            <div className="flex items-center gap-1 mb-6 h-12">
                                {Array.from({ length: 32 }).map((_, i) => (
                                    <motion.div
                                        key={i}
                                        className="flex-1 rounded-full"
                                        style={{ background: 'linear-gradient(to top, #7C6FF7, #4F9EF8)' }}
                                        animate={{ height: ['20%', `${30 + Math.random() * 70}%`, '20%'] }}
                                        transition={{ duration: 1 + Math.random(), repeat: Infinity, delay: i * 0.05 }}
                                    />
                                ))}
                            </div>
                            <p className="text-base leading-relaxed" style={{ color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>
                                Six distinct AI voices — each uniquely calibrated to sound like a real interviewer. No robotic text-to-speech. Just natural, professional conversation.
                            </p>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Feature: Scoring */}
            <section className="min-h-screen flex items-center justify-center px-8 py-32"
                style={{ background: 'var(--surface)' }}>
                <div className="max-w-5xl w-full">
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                        className="text-center mb-20"
                    >
                        <div className="text-xs font-medium tracking-[0.25em] uppercase mb-6" style={{ color: 'var(--accent)', fontFamily: 'var(--font-sans)' }}>
                            02 / Intelligence
                        </div>
                        <h2 className="text-[clamp(3rem,6vw,5.5rem)] leading-[0.9]" style={{ fontFamily: 'var(--font-serif)' }}>
                            Precise <span className="italic" style={{ color: 'var(--muted)' }}>Scoring.</span>
                        </h2>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        viewport={{ once: true }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-6"
                    >
                        {[
                            { label: 'Hire Probability', value: '78%', color: '#34D399' },
                            { label: 'Strengths Identified', value: '3', color: '#7C6FF7' },
                            { label: 'Areas to Improve', value: '2', color: '#F59E0B' }
                        ].map((stat, i) => (
                            <div key={i} className="p-8 rounded-2xl text-center" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                                <div className="text-5xl font-bold mb-2" style={{ fontFamily: 'var(--font-serif)', color: stat.color }}>{stat.value}</div>
                                <div className="text-sm" style={{ color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>{stat.label}</div>
                            </div>
                        ))}
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        viewport={{ once: true }}
                        className="mt-16 text-center"
                    >
                        <button
                            onClick={() => navigate('/auth')}
                            className="px-10 py-5 rounded-full font-semibold text-lg transition-all"
                            style={{ background: 'linear-gradient(135deg, #7C6FF7, #4F9EF8)', color: '#fff', fontFamily: 'var(--font-sans)', boxShadow: '0 0 40px rgba(124,111,247,0.25)' }}
                            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 60px rgba(124,111,247,0.4)'}
                            onMouseLeave={e => e.currentTarget.style.boxShadow = '0 0 40px rgba(124,111,247,0.25)'}
                        >
                            Start Your First Interview
                        </button>
                    </motion.div>
                </div>
            </section>

        </div>
    );
};

export default LandingPage;
