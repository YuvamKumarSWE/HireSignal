import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams, useLocation } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || '${API_BASE}';

const Interview = () => {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [answer, setAnswer] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);
    const [error, setError] = useState(null);
    const [isVoiceMode, setIsVoiceMode] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isPlayingAudio, setIsPlayingAudio] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [isConnecting, setIsConnecting] = useState(true);
    const [retryCount, setRetryCount] = useState(0);
    const [voiceInfo, setVoiceInfo] = useState(location.state?.voice || null);
    const MAX_RETRIES = 5;
    const RETRY_DELAY = 2000; // 2 seconds
    const isFinishingRef = useRef(false); // Prevent duplicate finish calls

    const finishInterview = async () => {
        // Prevent duplicate calls
        if (isFinishingRef.current) {
            console.log('⚠️ finishInterview already in progress, skipping duplicate call');
            return;
        }

        try {
            isFinishingRef.current = true;
            console.log('🏁 Finishing interview...');
            setIsLoading(true);
            setIsCompleted(true); // Immediately mark as completed to prevent showing question again
            setCurrentQuestion(null); // Clear the current question

            const res = await fetch(
                `${API_BASE}/api/interview/${sessionId}/end`,
                { method: "POST" }
            );

            const data = await res.json();

            navigate(`/results/${sessionId}`, {
                state: {
                    evaluation: data.evaluation,
                    transcript: data.transcript
                }
            });
        } catch (err) {
            console.error(err);
            setError("Failed to evaluate interview");
            setIsCompleted(false); // Reset if there's an error
            isFinishingRef.current = false; // Reset the guard on error
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch the current question when component mounts or after submitting an answer
    const fetchQuestion = async (isRetry = false) => {
        try {
            setIsLoading(true);
            console.log('📝 Fetching question...');
            const response = await fetch(`${API_BASE}/api/interview/${sessionId}/question`);
            const data = await response.json();

            if (data.completed) {
                console.log('✅ Interview completed, finishing...');
                finishInterview();
            } else if (data.success) {
                console.log(`📋 Question ${data.questionNumber}/${data.totalQuestions}: ${data.question}`);
                setCurrentQuestion(data);
                setIsConnecting(false);
                setRetryCount(0); // Reset retry count on success
            } else {
                setError(data.error || 'Failed to load question');
                setIsConnecting(false);
            }
        } catch (err) {
            console.error('Error fetching question:', err);

            // Only retry on initial connection, not on subsequent errors
            if (isConnecting && retryCount < MAX_RETRIES) {
                console.log(`Connection attempt ${retryCount + 1}/${MAX_RETRIES} failed. Retrying in ${RETRY_DELAY / 1000}s...`);
                setRetryCount(prev => prev + 1);
                setTimeout(() => {
                    fetchQuestion(true);
                }, RETRY_DELAY);
            } else {
                // Only set error after all retries exhausted
                setError('Failed to connect to server. Please ensure the backend is running on port 3000.');
                setIsConnecting(false);
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (sessionId) {
            fetchQuestion();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId]);

    // Play question as audio in voice mode
    const playQuestionAudio = async () => {
        try {
            setIsPlayingAudio(true);
            const response = await fetch(`${API_BASE}/api/interview/${sessionId}/question/audio`);
            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);

            audio.onended = () => {
                setIsPlayingAudio(false);
                URL.revokeObjectURL(audioUrl);
            };

            await audio.play();
        } catch (err) {
            console.error('Error playing audio:', err);
            setIsPlayingAudio(false);
            alert('Failed to play audio. This may be due to:\n\n1. Backend not running on port 3000\n2. ElevenLabs API key invalid or needs credits\n3. Network connection issue\n\nPlease check the backend console for detailed errors.');
        }
    };

    // Start recording voice answer
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            const localChunks = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    localChunks.push(e.data);
                }
            };

            recorder.onstop = async () => {
                const audioBlob = new Blob(localChunks, { type: 'audio/webm' });
                await submitVoiceAnswer(audioBlob);
                stream.getTracks().forEach(track => track.stop());
            };

            setMediaRecorder(recorder);
            recorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error('Error starting recording:', err);
            alert('Failed to access microphone. Please allow microphone permissions.');
        }
    };

    // Stop recording
    const stopRecording = () => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
            setIsRecording(false);
        }
    };

    // Submit voice answer
    const submitVoiceAnswer = async (audioBlob) => {
        try {
            setIsLoading(true);
            const formData = new FormData();
            formData.append('audio', audioBlob, 'answer.webm');
            formData.append('questionId', currentQuestion.questionId);

            const response = await fetch(`${API_BASE}/api/interview/${sessionId}/answer/audio`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                console.log('Transcribed:', data.transcribedText);
                if (data.hasMoreQuestions) {
                    fetchQuestion();
                } else {
                    finishInterview();
                }
            } else {
                setError(data.error || 'Failed to submit voice answer');
            }
        } catch (err) {
            setError('Failed to submit voice answer');
            console.error('Error submitting voice:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmitAnswer = async (e) => {
        e.preventDefault();
        if (!answer.trim()) return;

        try {
            setIsLoading(true);
            const response = await fetch(`${API_BASE}/api/interview/${sessionId}/answer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    questionId: currentQuestion.questionId,
                    answer: answer
                })
            });

            const data = await response.json();

            if (data.success) {
                console.log(`✅ Answer submitted. hasMoreQuestions: ${data.hasMoreQuestions}`);
                setAnswer(''); // Clear the answer
                if (data.hasMoreQuestions) {
                    console.log('➡️ Fetching next question...');
                    fetchQuestion(); // Fetch next question
                } else {
                    console.log('🏁 No more questions, finishing interview...');
                    finishInterview();
                }
            } else {
                setError(data.error || 'Failed to submit answer');
            }
        } catch (err) {
            setError('Failed to submit answer');
            console.error('Error submitting answer:', err);
        } finally {
            setIsLoading(false);
        }
    };

    if (isConnecting && !currentQuestion) {
        return (
            <div className="min-h-screen bg-[#EAE7DE] text-[#1A1A1A] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-[#1A1A1A] border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                    <h1 className="text-3xl font-serif mb-4">Connecting to server...</h1>
                    <p className="text-lg opacity-60 mb-2">
                        {retryCount > 0 ? `Retry attempt ${retryCount}/${MAX_RETRIES}` : 'Establishing connection'}
                    </p>
                    <p className="text-sm opacity-40">
                        Please ensure the backend is running on port 3000
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#EAE7DE] text-[#1A1A1A] flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-4xl font-serif mb-4">Error</h1>
                    <p className="text-lg mb-8">{error}</p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="px-8 py-3 bg-[#1A1A1A] text-[#EAE7DE] rounded-full"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    if (isCompleted) {
        return (
            <div className="min-h-screen bg-[#EAE7DE] text-[#1A1A1A] flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center max-w-2xl p-8"
                >
                    <h1 className="text-6xl font-serif mb-6">Interview Complete!</h1>
                    <p className="text-xl mb-8 opacity-60">
                        Thank you for completing the interview. Your responses have been recorded.
                    </p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#EAE7DE] text-[#1A1A1A] flex flex-col relative overflow-hidden">
            <nav className="p-8 flex justify-between items-center z-10">
                <div
                    onClick={() => navigate('/dashboard')}
                    className="text-xl font-bold tracking-tighter font-sans uppercase cursor-pointer hover:opacity-60 transition-opacity"
                >
                    HireSignal
                </div>
                <div className="flex items-center gap-4">
                    {voiceInfo && (
                        <div className="text-sm opacity-60 flex items-center gap-2">
                            <span>🎙️</span>
                            <span className="font-medium">{voiceInfo.name}</span>
                            <span className="opacity-50">({voiceInfo.gender})</span>
                        </div>
                    )}
                    {currentQuestion && (
                        <div className="text-sm opacity-60">
                            Question {currentQuestion.questionNumber} of {currentQuestion.totalQuestions}
                        </div>
                    )}
                    <button
                        onClick={() => setIsVoiceMode(!isVoiceMode)}
                        className={`px-4 py-2 text-sm font-bold rounded-full transition-all ${isVoiceMode
                            ? 'bg-[#1A1A1A] text-[#EAE7DE]'
                            : 'border-2 border-[#1A1A1A] text-[#1A1A1A]'
                            }`}
                    >
                        {isVoiceMode ? '🎤 Voice Mode' : '⌨️ Text Mode'}
                    </button>
                </div>
            </nav>

            <main className="flex-1 flex flex-col items-center justify-center p-4 max-w-4xl mx-auto w-full z-10">
                {isLoading && !currentQuestion ? (
                    <div className="text-center">
                        <div className="w-12 h-12 border-4 border-[#1A1A1A] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-lg opacity-60">Loading question...</p>
                    </div>
                ) : currentQuestion ? (
                    <>
                        <motion.div
                            key={currentQuestion.questionId}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="w-full text-center mb-12"
                        >
                            <h1 className="text-3xl md:text-4xl font-serif mb-6 leading-tight">
                                {currentQuestion.question}
                            </h1>
                            <p className="text-sm uppercase tracking-widest opacity-40 mb-4">
                                {currentQuestion.category} • ~{currentQuestion.expectedDuration}s expected
                            </p>
                            {isVoiceMode && (
                                <button
                                    onClick={playQuestionAudio}
                                    disabled={isPlayingAudio}
                                    className="px-6 py-3 bg-[#1A1A1A] text-[#EAE7DE] rounded-full hover:scale-105 transition-all disabled:opacity-50"
                                >
                                    {isPlayingAudio ? '🔊 Playing...' : '🔊 Play Question'}
                                </button>
                            )}
                        </motion.div>

                        {isVoiceMode ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.3, duration: 0.6 }}
                                className="w-full text-center"
                            >
                                <div className="mb-8">
                                    {isRecording ? (
                                        <div className="flex flex-col items-center gap-6">
                                            <div className="w-32 h-32 bg-red-500 rounded-full animate-pulse flex items-center justify-center">
                                                <span className="text-6xl">🎤</span>
                                            </div>
                                            <p className="text-xl font-bold">Recording...</p>
                                            <button
                                                onClick={stopRecording}
                                                className="px-12 py-4 bg-[#1A1A1A] text-[#EAE7DE] text-lg font-bold rounded-full hover:scale-105 transition-all"
                                            >
                                                ⏹ Stop Recording
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-6">
                                            <div className="w-32 h-32 bg-[#1A1A1A] rounded-full flex items-center justify-center hover:scale-105 transition-all cursor-pointer"
                                                onClick={startRecording}>
                                                <span className="text-6xl">🎤</span>
                                            </div>
                                            <button
                                                onClick={startRecording}
                                                disabled={isLoading}
                                                className="px-12 py-4 bg-[#1A1A1A] text-[#EAE7DE] text-lg font-bold rounded-full hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                                            >
                                                🎤 Start Recording Answer
                                            </button>
                                            <button
                                                onClick={() => navigate('/dashboard')}
                                                className="px-8 py-3 border-2 border-[#1A1A1A] text-[#1A1A1A] rounded-full hover:bg-[#1A1A1A] hover:text-[#EAE7DE] transition-all"
                                            >
                                                Exit Interview
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ) : (
                            <motion.form
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.3, duration: 0.6 }}
                                onSubmit={handleSubmitAnswer}
                                className="w-full"
                            >
                                <div className="relative group mb-8">
                                    <div className="absolute -inset-1 bg-gradient-to-r from-gray-200 to-gray-300 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                                    <textarea
                                        value={answer}
                                        onChange={(e) => setAnswer(e.target.value)}
                                        placeholder="Type your answer here..."
                                        className="relative w-full h-[220px] bg-[#F4F1E8] p-6 text-base font-sans rounded-xl border border-[#D1D1D1] focus:border-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#1A1A1A] resize-none transition-all shadow-sm placeholder:opacity-30"
                                        required
                                        disabled={isLoading}
                                    />
                                </div>

                                <div className="flex justify-center gap-4">
                                    <button
                                        type="button"
                                        onClick={() => navigate('/dashboard')}
                                        className="px-8 py-4 border-2 border-[#1A1A1A] text-[#1A1A1A] text-lg font-sans font-bold rounded-full hover:bg-[#1A1A1A] hover:text-[#EAE7DE] transition-all"
                                        disabled={isLoading}
                                    >
                                        Exit Interview
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isLoading || !answer.trim()}
                                        className="px-12 py-4 bg-[#1A1A1A] text-[#EAE7DE] text-lg font-sans font-bold rounded-full hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
                                    >
                                        {isLoading ? (
                                            <>
                                                <span className="w-5 h-5 border-2 border-[#EAE7DE] border-t-transparent rounded-full animate-spin"></span>
                                                Submitting...
                                            </>
                                        ) : (
                                            "Next Question →"
                                        )}
                                    </button>
                                </div>
                            </motion.form>
                        )}
                    </>
                ) : null}
            </main>

            {/* Decorative background elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vh] h-[120vh] border border-[#1A1A1A] opacity-[0.03] rounded-full pointer-events-none"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vh] h-[80vh] border border-[#1A1A1A] opacity-[0.03] rounded-full pointer-events-none"></div>
        </div>
    );
};

export default Interview;
