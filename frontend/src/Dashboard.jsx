import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { auth } from './firebase';
import { apiFetch } from './api';

const ROLES = ['Software Engineer', 'Frontend Engineer', 'Backend Engineer', 'Full Stack Engineer', 'Data Scientist', 'Machine Learning Engineer', 'DevOps Engineer', 'Product Manager', 'Designer'];
const LEVELS = ['Intern', 'Entry-level', 'Mid-level', 'Senior', 'Staff', 'Principal', 'Manager'];

const Dashboard = () => {
    const [jobDescription, setJobDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [role, setRole] = useState('Software Engineer');
    const [level, setLevel] = useState('Mid-level');
    const navigate = useNavigate();

    const selectStyle = {
        background: 'var(--surface-2)',
        border: '1px solid var(--border)',
        color: 'var(--text)',
        fontFamily: 'var(--font-sans)',
        borderRadius: '12px',
        padding: '12px 16px',
        width: '100%',
        fontSize: '14px',
        outline: 'none',
        cursor: 'pointer',
        appearance: 'none',
        WebkitAppearance: 'none',
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            if (!auth.currentUser) { navigate('/auth'); return; }
            const response = await apiFetch('/api/interview/start', {
                method: 'POST',
                body: JSON.stringify({ role, level, jobDescription })
            });
            const data = await response.json();
            if (data.success) {
                navigate(`/interview/${data.sessionId}`, { state: { voice: data.voice } });
            } else {
                alert('Failed to start interview: ' + (data.error || 'Unknown error'));
            }
        } catch {
            alert('Failed to connect to server.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col relative" style={{ background: 'var(--bg)' }}>

            {/* Ambient */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute rounded-full blur-[150px] opacity-10"
                    style={{ width: 700, height: 700, top: -200, right: -100, background: 'radial-gradient(circle, #7C6FF7, transparent)' }} />
            </div>

            {/* Nav */}
            <nav className="px-8 py-6 flex justify-between items-center relative z-10"
                style={{ borderBottom: '1px solid var(--border)' }}>
                <div onClick={() => navigate('/')} className="cursor-pointer text-sm font-bold tracking-[0.2em] uppercase"
                    style={{ fontFamily: 'var(--font-sans)' }}>
                    HireSignal
                </div>
                <button onClick={() => navigate('/profile')}
                    className="text-sm font-medium transition-colors"
                    style={{ color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}
                    onMouseEnter={e => e.target.style.color = 'var(--text)'}
                    onMouseLeave={e => e.target.style.color = 'var(--muted)'}>
                    History
                </button>
            </nav>

            <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    className="w-full max-w-2xl"
                >
                    {/* Header */}
                    <div className="mb-10">
                        <h1 className="text-5xl md:text-6xl mb-3" style={{ fontFamily: 'var(--font-serif)' }}>
                            Set the stage.
                        </h1>
                        <p className="text-sm" style={{ color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>
                            Paste the job description and we'll tailor the interview to the role.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Role + Level row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium mb-2 tracking-widest uppercase"
                                    style={{ color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>Role</label>
                                <div className="relative">
                                    <select value={role} onChange={e => setRole(e.target.value)} style={selectStyle}
                                        onFocus={e => e.target.style.borderColor = 'rgba(124,111,247,0.5)'}
                                        onBlur={e => e.target.style.borderColor = 'var(--border)'}>
                                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-xs" style={{ color: 'var(--muted)' }}>↓</div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-2 tracking-widest uppercase"
                                    style={{ color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>Level</label>
                                <div className="relative">
                                    <select value={level} onChange={e => setLevel(e.target.value)} style={selectStyle}
                                        onFocus={e => e.target.style.borderColor = 'rgba(124,111,247,0.5)'}
                                        onBlur={e => e.target.style.borderColor = 'var(--border)'}>
                                        {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-xs" style={{ color: 'var(--muted)' }}>↓</div>
                                </div>
                            </div>
                        </div>

                        {/* Textarea */}
                        <div>
                            <label className="block text-xs font-medium mb-2 tracking-widest uppercase"
                                style={{ color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>Job Description</label>
                            <textarea
                                value={jobDescription}
                                onChange={e => setJobDescription(e.target.value)}
                                required
                                rows={12}
                                placeholder={"Senior Frontend Engineer at Stripe\n\nResponsibilities:\n— Build high-performance web applications\n— Own the design system\n\nRequirements:\n— 4+ years React experience\n— Strong TypeScript skills"}
                                style={{
                                    background: 'var(--surface)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '16px',
                                    color: 'var(--text)',
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: '13px',
                                    lineHeight: '1.7',
                                    padding: '20px',
                                    width: '100%',
                                    resize: 'none',
                                    outline: 'none',
                                    transition: 'border-color 0.2s',
                                }}
                                onFocus={e => e.target.style.borderColor = 'rgba(124,111,247,0.5)'}
                                onBlur={e => e.target.style.borderColor = 'var(--border)'}
                            />
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 rounded-2xl font-semibold text-base transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                            style={{
                                background: isLoading ? 'var(--surface-2)' : 'linear-gradient(135deg, #7C6FF7, #4F9EF8)',
                                color: '#fff',
                                fontFamily: 'var(--font-sans)',
                                boxShadow: isLoading ? 'none' : '0 0 40px rgba(124,111,247,0.25)',
                            }}
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
                                        style={{ borderColor: 'rgba(255,255,255,0.4)', borderTopColor: 'transparent' }} />
                                    Generating interview...
                                </>
                            ) : 'Begin Simulation →'}
                        </button>
                    </form>
                </motion.div>
            </main>
        </div>
    );
};

export default Dashboard;
