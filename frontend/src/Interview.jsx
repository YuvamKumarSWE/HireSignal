import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import { apiFetch, apiFetchMultipart, BASE } from './api';

const SOCKET_URL = BASE;

const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

const Interview = () => {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [answer, setAnswer] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);
    const [error, setError] = useState(null);
    const [isVoiceMode, setIsVoiceMode] = useState(true);
    const [isRecording, setIsRecording] = useState(false);
    const [isPlayingAudio, setIsPlayingAudio] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [isConnecting, setIsConnecting] = useState(true);
    const [retryCount, setRetryCount] = useState(0);
    const [voiceInfo] = useState(location.state?.voice || null);
    const [transcriptionStatus, setTranscriptionStatus] = useState(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const MAX_RETRIES = 5;
    const RETRY_DELAY = 2000;
    const isFinishingRef = useRef(false);
    const socketRef = useRef(null);

    useEffect(() => {
        const socket = io(SOCKET_URL);
        socketRef.current = socket;
        socket.emit('join:session', { sessionId });
        socket.on('transcription:status', ({ status }) => {
            setTranscriptionStatus(status);
            if (status === 'done') setTimeout(() => setTranscriptionStatus(null), 2000);
        });
        socket.on('interview:timer', ({ elapsed }) => setElapsedTime(elapsed));
        socket.on('evaluation:complete', ({ evaluation, transcript }) => {
            if (!isFinishingRef.current) return;
            navigate(`/results/${sessionId}`, { state: { evaluation, transcript } });
        });
        return () => { socket.emit('leave:session', { sessionId }); socket.disconnect(); };
    }, [sessionId, navigate]);

    const finishInterview = async () => {
        if (isFinishingRef.current) return;
        try {
            isFinishingRef.current = true;
            setIsLoading(true);
            setIsCompleted(true);
            setCurrentQuestion(null);
            const res = await apiFetch(`/api/interview/${sessionId}/end`, { method: 'POST' });
            const data = await res.json();
            navigate(`/results/${sessionId}`, { state: { evaluation: data.evaluation, transcript: data.transcript } });
        } catch {
            setError('Failed to evaluate interview');
            setIsCompleted(false);
            isFinishingRef.current = false;
        } finally {
            setIsLoading(false);
        }
    };

    const fetchQuestion = async (isRetry = false) => {
        try {
            setIsLoading(true);
            const response = await apiFetch(`/api/interview/${sessionId}/question`);
            const data = await response.json();
            if (data.completed) { finishInterview(); }
            else if (data.success) { setCurrentQuestion(data); setIsConnecting(false); setRetryCount(0); }
            else { setError(data.error || 'Failed to load question'); setIsConnecting(false); }
        } catch {
            if (isConnecting && retryCount < MAX_RETRIES) {
                setRetryCount(p => p + 1);
                setTimeout(() => fetchQuestion(true), RETRY_DELAY);
            } else {
                setError('Failed to connect to server.');
                setIsConnecting(false);
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { if (sessionId) fetchQuestion(); }, [sessionId]); // eslint-disable-line

    const playQuestionAudio = async () => {
        try {
            setIsPlayingAudio(true);
            const response = await apiFetch(`/api/interview/${sessionId}/question/audio`);
            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            audio.onended = () => { setIsPlayingAudio(false); URL.revokeObjectURL(audioUrl); };
            await audio.play();
        } catch {
            setIsPlayingAudio(false);
        }
    };

    useEffect(() => { if (currentQuestion) playQuestionAudio(); }, [currentQuestion?.questionId]); // eslint-disable-line

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            const chunks = [];
            recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
            recorder.onstop = async () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                await submitVoiceAnswer(blob);
                stream.getTracks().forEach(t => t.stop());
            };
            setMediaRecorder(recorder);
            recorder.start();
            setIsRecording(true);
        } catch {
            alert('Microphone access required.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorder?.state === 'recording') { mediaRecorder.stop(); setIsRecording(false); }
    };

    const submitVoiceAnswer = async (audioBlob) => {
        try {
            setIsLoading(true);
            const formData = new FormData();
            formData.append('audio', audioBlob, 'answer.webm');
            formData.append('questionId', currentQuestion.questionId);
            const response = await apiFetchMultipart(`/api/interview/${sessionId}/answer/audio`, { method: 'POST', body: formData });
            const data = await response.json();
            if (data.success) { data.hasMoreQuestions ? fetchQuestion() : finishInterview(); }
            else setError(data.error || 'Failed to submit answer');
        } catch { setError('Failed to submit voice answer'); }
        finally { setIsLoading(false); }
    };

    const handleSubmitAnswer = async (e) => {
        e.preventDefault();
        if (!answer.trim()) return;
        try {
            setIsLoading(true);
            const response = await apiFetch(`/api/interview/${sessionId}/answer`, {
                method: 'POST',
                body: JSON.stringify({ questionId: currentQuestion.questionId, answer })
            });
            const data = await response.json();
            if (data.success) { setAnswer(''); data.hasMoreQuestions ? fetchQuestion() : finishInterview(); }
            else setError(data.error || 'Failed to submit answer');
        } catch { setError('Failed to submit answer'); }
        finally { setIsLoading(false); }
    };

    // ── Loading / Error / Completed states ──

    if (isConnecting && !currentQuestion) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
                <div className="text-center">
                    <div className="w-12 h-12 rounded-full border-2 border-t-transparent animate-spin mx-auto mb-6"
                        style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
                    <p className="text-sm" style={{ color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>
                        {retryCount > 0 ? `Connecting... (${retryCount}/${MAX_RETRIES})` : 'Connecting to server'}
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
                <div className="text-center max-w-sm">
                    <div className="text-4xl mb-4" style={{ fontFamily: 'var(--font-serif)' }}>Something went wrong.</div>
                    <p className="text-sm mb-8" style={{ color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>{error}</p>
                    <button onClick={() => navigate('/dashboard')}
                        className="px-8 py-3 rounded-full text-sm font-medium"
                        style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'var(--font-sans)' }}>
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    if (isCompleted) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
                    <div className="w-16 h-16 rounded-full mx-auto mb-8 flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, #7C6FF7, #4F9EF8)', boxShadow: '0 0 50px rgba(124,111,247,0.3)' }}>
                        <span className="text-2xl">✓</span>
                    </div>
                    <h1 className="text-4xl mb-3" style={{ fontFamily: 'var(--font-serif)' }}>Interview complete.</h1>
                    <p className="text-sm" style={{ color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>Evaluating your responses...</p>
                    <div className="mt-6 w-6 h-6 rounded-full border-2 border-t-transparent animate-spin mx-auto"
                        style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
                </motion.div>
            </div>
        );
    }

    // ── Main interview UI ──
    const progress = currentQuestion
        ? (currentQuestion.questionNumber - 1) / currentQuestion.totalQuestions
        : 0;

    return (
        <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>

            {/* Progress bar */}
            <div className="fixed top-0 left-0 right-0 h-[2px] z-50" style={{ background: 'var(--border)' }}>
                <motion.div
                    className="h-full"
                    style={{ background: 'linear-gradient(to right, #7C6FF7, #4F9EF8)' }}
                    animate={{ width: `${progress * 100}%` }}
                    transition={{ duration: 0.5 }}
                />
            </div>

            {/* Nav */}
            <nav className="px-8 py-5 flex justify-between items-center" style={{ borderBottom: '1px solid var(--border)' }}>
                <div onClick={() => navigate('/dashboard')} className="cursor-pointer text-sm font-bold tracking-[0.2em] uppercase"
                    style={{ fontFamily: 'var(--font-sans)' }}>
                    HireSignal
                </div>
                <div className="flex items-center gap-6">
                    {voiceInfo && (
                        <span className="text-xs px-3 py-1 rounded-full"
                            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>
                            {voiceInfo.name}
                        </span>
                    )}
                    {elapsedTime > 0 && (
                        <span className="text-sm tabular-nums" style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                            {formatTime(elapsedTime)}
                        </span>
                    )}
                    {currentQuestion && (
                        <span className="text-xs" style={{ color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>
                            {currentQuestion.questionNumber} / {currentQuestion.totalQuestions}
                        </span>
                    )}
                    <button
                        onClick={() => setIsVoiceMode(v => !v)}
                        className="text-xs px-4 py-2 rounded-full font-medium transition-all"
                        style={{
                            background: isVoiceMode ? 'rgba(124,111,247,0.15)' : 'var(--surface)',
                            border: `1px solid ${isVoiceMode ? 'rgba(124,111,247,0.4)' : 'var(--border)'}`,
                            color: isVoiceMode ? 'var(--accent)' : 'var(--muted)',
                            fontFamily: 'var(--font-sans)'
                        }}>
                        {isVoiceMode ? 'Voice' : 'Text'}
                    </button>
                </div>
            </nav>

            {/* Main */}
            <main className="flex-1 flex flex-col items-center justify-center p-8 max-w-3xl mx-auto w-full">
                <AnimatePresence mode="wait">
                    {isLoading && !currentQuestion ? (
                        <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
                            <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin mx-auto mb-4"
                                style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
                            <p className="text-sm" style={{ color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>Loading question...</p>
                        </motion.div>
                    ) : currentQuestion ? (
                        <motion.div
                            key={currentQuestion.questionId}
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -24 }}
                            transition={{ duration: 0.5 }}
                            className="w-full"
                        >
                            {/* Category pill */}
                            <div className="mb-8 flex items-center gap-3">
                                <span className="text-xs px-3 py-1 rounded-full font-medium"
                                    style={{ background: 'rgba(124,111,247,0.12)', border: '1px solid rgba(124,111,247,0.25)', color: 'var(--accent)', fontFamily: 'var(--font-sans)' }}>
                                    {currentQuestion.category}
                                </span>
                                {isPlayingAudio && (
                                    <motion.span
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-xs flex items-center gap-2"
                                        style={{ color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>
                                        <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--accent)' }} />
                                        Speaking...
                                    </motion.span>
                                )}
                            </div>

                            {/* Question */}
                            <h2 className="text-3xl md:text-4xl leading-snug mb-12" style={{ fontFamily: 'var(--font-serif)' }}>
                                {currentQuestion.question}
                            </h2>

                            {/* Voice mode */}
                            {isVoiceMode ? (
                                <div className="flex flex-col items-center gap-6">
                                    {transcriptionStatus === 'processing' ? (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                                            <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
                                                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                                                <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
                                                    style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
                                            </div>
                                            <p className="text-sm" style={{ color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>Transcribing...</p>
                                        </motion.div>
                                    ) : isRecording ? (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                                            <motion.div
                                                className="w-20 h-20 rounded-full mx-auto mb-6 cursor-pointer flex items-center justify-center"
                                                style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)' }}
                                                animate={{ boxShadow: ['0 0 0 0 rgba(239,68,68,0.2)', '0 0 0 20px rgba(239,68,68,0)', '0 0 0 0 rgba(239,68,68,0)'] }}
                                                transition={{ duration: 1.5, repeat: Infinity }}
                                                onClick={stopRecording}
                                            >
                                                <div className="w-6 h-6 rounded-sm" style={{ background: '#EF4444' }} />
                                            </motion.div>
                                            <p className="text-sm mb-1" style={{ color: '#F87171', fontFamily: 'var(--font-sans)', fontWeight: 500 }}>Recording</p>
                                            <p className="text-xs" style={{ color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>Click to stop</p>
                                        </motion.div>
                                    ) : (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                                            <motion.button
                                                onClick={startRecording}
                                                disabled={isLoading || isPlayingAudio}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center disabled:opacity-40 transition-all"
                                                style={{ background: 'linear-gradient(135deg, #7C6FF7, #4F9EF8)', boxShadow: '0 0 40px rgba(124,111,247,0.3)' }}
                                            >
                                                <svg width="28" height="28" fill="white" viewBox="0 0 24 24">
                                                    <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm0 15a7 7 0 0 0 7-7h2a9 9 0 0 1-8 8.94V21h-2v-3.06A9 9 0 0 1 3 9h2a7 7 0 0 0 7 7z"/>
                                                </svg>
                                            </motion.button>
                                            <p className="text-sm" style={{ color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>
                                                {isPlayingAudio ? 'Listen to the question first...' : 'Tap to answer'}
                                            </p>
                                        </motion.div>
                                    )}

                                    <button onClick={() => navigate('/dashboard')} className="text-xs mt-4"
                                        style={{ color: 'var(--muted)', fontFamily: 'var(--font-sans)', background: 'none', border: 'none', cursor: 'pointer' }}>
                                        Exit interview
                                    </button>
                                </div>
                            ) : (
                                /* Text mode */
                                <form onSubmit={handleSubmitAnswer} className="space-y-4">
                                    <textarea
                                        value={answer}
                                        onChange={e => setAnswer(e.target.value)}
                                        required
                                        disabled={isLoading}
                                        placeholder="Type your answer..."
                                        rows={7}
                                        style={{
                                            background: 'var(--surface)',
                                            border: '1px solid var(--border)',
                                            borderRadius: '16px',
                                            color: 'var(--text)',
                                            fontFamily: 'var(--font-sans)',
                                            fontSize: '15px',
                                            lineHeight: '1.7',
                                            padding: '20px',
                                            width: '100%',
                                            resize: 'none',
                                            outline: 'none',
                                        }}
                                        onFocus={e => e.target.style.borderColor = 'rgba(124,111,247,0.4)'}
                                        onBlur={e => e.target.style.borderColor = 'var(--border)'}
                                    />
                                    <div className="flex gap-3">
                                        <button type="button" onClick={() => navigate('/dashboard')}
                                            className="px-6 py-3 rounded-xl text-sm font-medium"
                                            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>
                                            Exit
                                        </button>
                                        <button type="submit" disabled={isLoading || !answer.trim()}
                                            className="flex-1 py-3 rounded-xl text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-2"
                                            style={{ background: 'linear-gradient(135deg, #7C6FF7, #4F9EF8)', color: '#fff', fontFamily: 'var(--font-sans)' }}>
                                            {isLoading ? (
                                                <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
                                                    style={{ borderColor: 'rgba(255,255,255,0.5)', borderTopColor: 'transparent' }} />
                                            ) : 'Next →'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </motion.div>
                    ) : null}
                </AnimatePresence>
            </main>
        </div>
    );
};

export default Interview;
