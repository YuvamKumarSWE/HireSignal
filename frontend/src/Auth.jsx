import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from './firebase';
import { apiFetch } from './api';

const Auth = () => {
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleGoogleSignIn = async () => {
        try {
            setError('');
            setLoading(true);
            const result = await signInWithPopup(auth, googleProvider);
            await apiFetch('/api/user', {
                method: 'POST',
                body: JSON.stringify({ photoURL: result.user.photoURL })
            });
            navigate('/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
            style={{ background: 'var(--bg)' }}>

            {/* Ambient glow */}
            <div className="absolute pointer-events-none"
                style={{ width: 600, height: 600, top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'radial-gradient(circle, rgba(124,111,247,0.08) 0%, transparent 70%)', borderRadius: '50%' }} />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-sm relative z-10"
            >
                {/* Card */}
                <div className="p-10 rounded-3xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>

                    {/* Logo */}
                    <div className="text-center mb-10">
                        <div
                            onClick={() => navigate('/')}
                            className="inline-block cursor-pointer mb-8"
                        >
                            <span className="text-sm font-bold tracking-[0.25em] uppercase" style={{ fontFamily: 'var(--font-sans)', color: 'var(--muted)' }}>
                                HireSignal
                            </span>
                        </div>
                        <h1 className="text-4xl mb-3" style={{ fontFamily: 'var(--font-serif)' }}>Welcome back.</h1>
                        <p className="text-sm" style={{ color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>
                            Sign in to continue your practice
                        </p>
                    </div>

                    {/* Error */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mb-6 px-4 py-3 rounded-xl text-sm"
                            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#F87171', fontFamily: 'var(--font-sans)' }}
                        >
                            {error}
                        </motion.div>
                    )}

                    {/* Google Button */}
                    <button
                        onClick={handleGoogleSignIn}
                        disabled={loading}
                        className="w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-medium text-sm transition-all disabled:opacity-50"
                        style={{ background: 'var(--surface-2)', border: '1px solid var(--border-strong)', color: 'var(--text)', fontFamily: 'var(--font-sans)' }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(124,111,247,0.5)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-strong)'}
                    >
                        {loading ? (
                            <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
                        ) : (
                            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                        )}
                        {loading ? 'Signing in...' : 'Continue with Google'}
                    </button>

                    <p className="mt-8 text-center text-xs" style={{ color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>
                        Secure authentication via Google OAuth
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default Auth;
