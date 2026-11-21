import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import AriaAvatar from '../components/AriaAvatar';



// ─── SPEECH BUBBLE ────────────────────────────────────────────────────────────
function SpeechBubble({ text, highlight, playing }) {
  const words = text.split(' ');

  return (
    <motion.div
      style={{
        background: 'rgba(255,255,255,0.07)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '20px',
        padding: '20px 24px',
        maxWidth: '600px',
        lineHeight: '1.7',
        fontSize: '17px',
        fontWeight: '500',
        color: '#fff',
        position: 'relative',
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
      }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      key={text}
    >
      {/* Tail */}
      <div style={{
        position: 'absolute',
        bottom: '-12px',
        left: '40px',
        width: '24px',
        height: '24px',
        background: 'rgba(255,255,255,0.07)',
        transform: 'rotate(45deg)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderTop: 'none',
        borderLeft: 'none',
      }} />

      <AnimatedText text={text} highlight={highlight} />
    </motion.div>
  );
}

function AnimatedText({ text, highlight }) {
  const words = text.split(' ');
  const [activeWordIndex, setActiveWordIndex] = useState(-1);

  useEffect(() => {
    // Reset whenever the segment text changes
    setActiveWordIndex(-1);

    // Primary: listen for real word-boundary events fired by the TTS engine
    const onWord = (e) => setActiveWordIndex(e.detail);
    const onReset = () => setActiveWordIndex(-1);

    window.addEventListener('speech-word', onWord);
    window.addEventListener('speech-reset', onReset);
    return () => {
      window.removeEventListener('speech-word', onWord);
      window.removeEventListener('speech-reset', onReset);
    };
  }, [text]);

  return (
    <span>
      {words.map((word, i) => {
        const isHighlight = highlight && word.toLowerCase().includes(highlight.toLowerCase().split(' ')[0]);
        // Word is spoken if its index is <= the currently active word index
        const isSpoken = i <= activeWordIndex;

        return (
          <motion.span
            key={i}
            style={{
              display: 'inline-block',
              color: isHighlight ? '#f093fb' : 'inherit',
              fontWeight: isHighlight ? '700' : 'inherit',
              marginRight: '4px',
              opacity: isSpoken ? 1 : 0.4,
              transition: 'opacity 0.2s ease-out',
            }}
          >
            {word}
          </motion.span>
        );
      })}
    </span>
  );
}

// ─── DOUBT MODAL ─────────────────────────────────────────────────────────────
function DoubtModal({ onClose, onAnswer, context }) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('text'); // 'text' or 'voice'
  const recognitionRef = useRef(null);
  const token = localStorage.getItem('token');

  const startVoiceRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice recognition not supported in this browser. Please use Chrome.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => setRecording(true);
    recognition.onend = () => setRecording(false);
    recognition.onerror = (e) => {
      setRecording(false);
      toast.error('Voice error: ' + e.error);
    };
    recognition.onresult = (e) => {
      const transcript = Array.from(e.results)
        .map(r => r[0].transcript)
        .join('');
      setQuestion(transcript);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopVoiceRecording = () => {
    recognitionRef.current?.stop();
    setRecording(false);
  };

  const submitQuestion = async () => {
    if (!question.trim()) {
      toast.error('Please ask a question!');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post('/api/ai/answer-doubt', {
        question: question.trim(),
        context
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setAnswer(res.data.answer);

      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(res.data.answer);
        utterance.rate = 0.95;
        utterance.pitch = 1.1;
        const voices = window.speechSynthesis.getVoices();
        // Strongly prefer known female English voices (Samantha on Mac, Zira on Windows, Google Female)
        const preferredVoice = voices.find(v =>
          v.name.includes('Samantha') ||
          v.name.includes('Zira') ||
          v.name.includes('Google US English') ||
          (v.name.includes('Female') && (v.lang === 'en-US' || v.lang === 'en-GB'))
        ) || voices.find(v => v.lang === 'en-US' || v.lang === 'en-GB');

        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }

        // Prevent Chrome GC bug
        window.__currentUtterance = utterance;

        window.speechSynthesis.speak(utterance);
      }

    } catch (err) {
      toast.error('Failed to get answer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        style={{
          background: 'linear-gradient(135deg, rgba(15,12,41,0.98) 0%, rgba(48,43,99,0.98) 100%)',
          border: '1px solid rgba(103, 126, 234, 0.3)',
          borderRadius: '24px',
          padding: '36px',
          maxWidth: '520px',
          width: '100%',
          boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
        }}
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
      >
        {/* Aria in doubt mode */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <AriaCharacter emotion="doubt" gesture="thinking" speaking={loading} size={0.7} />
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#fff' }}>Ask Aria!</h3>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
              I'll answer your doubts in real-time 🎤
            </p>
          </div>
        </div>

        {/* Input area */}
        <div style={{ marginBottom: '16px' }}>
          <textarea
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder="Type your question here..."
            rows={3}
            style={{
              width: '100%',
              padding: '14px 16px',
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '15px',
              fontFamily: 'Poppins, sans-serif',
              resize: 'vertical',
              outline: 'none',
            }}
          />
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button
            onClick={recording ? stopVoiceRecording : startVoiceRecording}
            style={{
              flex: 1,
              padding: '12px',
              background: recording
                ? 'linear-gradient(135deg, #ff4444, #cc0000)'
                : 'linear-gradient(135deg, #43e97b, #38f9d7)',
              border: 'none',
              borderRadius: '12px',
              color: recording ? '#fff' : '#1a1a1a',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '15px',
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            {recording ? '🛑 Stop Recording' : '🎤 Ask by Voice'}
          </button>
          <button
            onClick={submitQuestion}
            disabled={loading || !question.trim()}
            style={{
              flex: 1,
              padding: '12px',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              border: 'none',
              borderRadius: '12px',
              color: '#fff',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '15px',
              fontFamily: 'Poppins, sans-serif',
              opacity: loading || !question.trim() ? 0.6 : 1,
            }}
          >
            {loading ? '⏳ Thinking...' : '💬 Get Answer'}
          </button>
        </div>

        {/* Recording indicator */}
        {recording && (
          <motion.div
            style={{
              background: 'rgba(255,68,68,0.15)',
              border: '1px solid rgba(255,68,68,0.3)',
              borderRadius: '10px',
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '16px',
            }}
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ff4444' }} />
            <span style={{ color: '#ff8080', fontSize: '14px', fontWeight: '600' }}>
              Listening... speak your question
            </span>
          </motion.div>
        )}

        {/* Answer */}
        <AnimatePresence>
          {answer && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: 'rgba(103, 126, 234, 0.1)',
                border: '1px solid rgba(103, 126, 234, 0.3)',
                borderRadius: '14px',
                padding: '16px',
                marginBottom: '16px',
                fontSize: '15px',
                color: 'rgba(255,255,255,0.9)',
                lineHeight: '1.6',
              }}
            >
              <div style={{ fontWeight: '700', color: '#667eea', marginBottom: '8px' }}>
                🤖 Aria says:
              </div>
              {answer}
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '12px',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            color: 'rgba(255,255,255,0.7)',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '14px',
            fontFamily: 'Poppins, sans-serif',
          }}
        >
          ← Resume Lesson
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── MAIN VIDEO PLAYER ────────────────────────────────────────────────────────
export default function VideoPlayer() {
  const { lessonId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  const lesson = state?.lesson || JSON.parse(localStorage.getItem('lessons') || '[]').find(l => l.id === lessonId);

  const [script, setScript] = useState(lesson?.script || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [showDoubt, setShowDoubt] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [finished, setFinished] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const timerRef = useRef(null);
  const speechRef = useRef(null);

  const currentSegment = script[currentIndex] || {};
  const totalDuration = script.reduce((acc, s) => acc + (s.text?.split(' ').length * 400 || 3000), 0);

  // Auto-advance through segments
  useEffect(() => {
    if (!playing || showDoubt || finished) return;
    if (!script.length) return;

    const segText = currentSegment.text || '';
    const duration = Math.max(3000, segText.split(' ').length * 380);

    setSpeaking(true);

    // Text to speech
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();

      // Signal AnimatedText to reset
      window.dispatchEvent(new CustomEvent('speech-reset'));

      const utterance = new SpeechSynthesisUtterance(segText);
      utterance.rate = 0.9;
      utterance.pitch = 1.2;

      // Voice selection: prefer known female voices
      const loadVoicesAndSpeak = () => {
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v =>
          v.name.includes('Samantha') ||
          v.name.includes('Zira') ||
          v.name.includes('Google US English') ||
          (v.name.includes('Female') && (v.lang === 'en-US' || v.lang === 'en-GB'))
        ) || voices.find(v => v.lang === 'en-US' || v.lang === 'en-GB');
        if (preferredVoice) utterance.voice = preferredVoice;

        // Build a word-start-char-index map so onboundary can look up the word index
        const wordStartIndices = [];
        let idx = 0;
        segText.split(' ').forEach(word => {
          wordStartIndices.push(idx);
          idx += word.length + 1; // +1 for the space
        });

        // PRIMARY SYNC: fire the current word index on every boundary event
        utterance.onboundary = (e) => {
          if (e.name !== 'word') return;
          // Find which word we're on by matching charIndex to the precomputed starts
          let wordIdx = wordStartIndices.findLastIndex(start => start <= e.charIndex);
          if (wordIdx < 0) wordIdx = 0;
          window.dispatchEvent(new CustomEvent('speech-word', { detail: wordIdx }));
        };

        utterance.onend = () => {
          setSpeaking(false);
          if (currentIndex < script.length - 1) {
            setCurrentIndex(prev => prev + 1);
          } else {
            setFinished(true);
            setPlaying(false);
          }
        };

        utterance.onerror = (e) => {
          if (e.error === 'interrupted') return; // ignore cancels
          setSpeaking(false);
          console.error('SpeechSynthesis error:', e);
          timerRef.current = setTimeout(() => {
            if (currentIndex < script.length - 1) {
              setCurrentIndex(prev => prev + 1);
            } else {
              setFinished(true);
              setPlaying(false);
            }
          }, duration);
        };

        // Prevent Chrome GC bug that cuts long utterances short
        window.__currentUtterance = utterance;
        window.speechSynthesis.speak(utterance);
        speechRef.current = utterance;
      };

      // Voices may not be loaded yet on first render
      if (window.speechSynthesis.getVoices().length > 0) {
        loadVoicesAndSpeak();
      } else {
        window.speechSynthesis.onvoiceschanged = () => loadVoicesAndSpeak();
      }
    } else {
      // Fallback if SpeechSynthesis is not supported
      timerRef.current = setTimeout(() => {
        setSpeaking(false);
        if (currentIndex < script.length - 1) {
          setCurrentIndex(prev => prev + 1);
        } else {
          setFinished(true);
          setPlaying(false);
        }
      }, duration);
    }

    return () => {
      clearTimeout(timerRef.current);
    };
  }, [currentIndex, playing, showDoubt, finished, script]);

  const handlePause = () => {
    if (playing) {
      clearTimeout(timerRef.current);
      window.speechSynthesis?.cancel();
      setSpeaking(false);
      setPlaying(false);
    } else {
      setPlaying(true);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      clearTimeout(timerRef.current);
      window.speechSynthesis?.cancel();
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < script.length - 1) {
      clearTimeout(timerRef.current);
      window.speechSynthesis?.cancel();
      setCurrentIndex(prev => prev + 1);
    }
  };

  const openDoubt = () => {
    clearTimeout(timerRef.current);
    window.speechSynthesis?.cancel();
    setSpeaking(false);
    setPlaying(false);
    setShowDoubt(true);
  };

  const closeDoubt = () => {
    setShowDoubt(false);
    setPlaying(true);
  };

  if (!lesson) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f0c29',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>😕</div>
          <h2 style={{ color: '#fff', marginBottom: '16px' }}>Lesson not found</h2>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              padding: '12px 32px',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              border: 'none',
              borderRadius: '12px',
              color: '#fff',
              fontWeight: '700',
              cursor: 'pointer',
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background particles */}
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            width: `${4 + Math.random() * 8}px`,
            height: `${4 + Math.random() * 8}px`,
            borderRadius: '50%',
            background: ['#667eea', '#764ba2', '#f093fb', '#4facfe'][i % 4],
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            opacity: 0.3,
          }}
          animate={{
            y: [-20, 20, -20],
            opacity: [0.1, 0.4, 0.1],
          }}
          transition={{
            duration: 3 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 3,
          }}
        />
      ))}

      {/* Header */}
      <div style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '14px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 10,
      }}>
        <button
          onClick={() => { window.speechSynthesis?.cancel(); navigate('/dashboard'); }}
          style={{
            padding: '8px 16px',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '8px',
            color: 'rgba(255,255,255,0.7)',
            cursor: 'pointer',
            fontSize: '14px',
            fontFamily: 'Poppins, sans-serif',
          }}
        >
          ← Dashboard
        </button>

        <h3 style={{
          color: '#fff',
          fontSize: '16px',
          fontWeight: '600',
          maxWidth: '300px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          📚 {lesson.topic}
        </h3>

        {/* Progress */}
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>
          {currentIndex + 1} / {script.length}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: '3px', background: 'rgba(255,255,255,0.08)', position: 'relative' }}>
        <motion.div
          style={{
            height: '100%',
            background: 'linear-gradient(90deg, #667eea, #f093fb)',
            originX: 0,
          }}
          animate={{ width: `${((currentIndex + 1) / script.length) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Main stage */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        position: 'relative',
      }}>
        {/* Start screen overlay */}
        <AnimatePresence>
          {!hasStarted && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(15,12,41,0.85)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 20,
              }}
            >
              <motion.div
                style={{ fontSize: '64px', marginBottom: '20px' }}
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                🎓
              </motion.div>
              <h2 style={{ color: '#fff', fontSize: '32px', marginBottom: '10px', fontWeight: '800' }}>Ready to Learn?</h2>
              <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '30px', fontSize: '18px' }}>Start the lesson to hear Aria speak!</p>
              <button
                onClick={() => {
                  setHasStarted(true);
                  setPlaying(true);
                  // Unlock audio context on Chrome securely
                  if ('speechSynthesis' in window) {
                    const unlock = new SpeechSynthesisUtterance('');
                    window.speechSynthesis.speak(unlock);
                  }
                }}
                style={{
                  padding: '16px 40px',
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  border: 'none',
                  borderRadius: '30px',
                  color: '#fff',
                  fontWeight: '700',
                  fontSize: '18px',
                  cursor: 'pointer',
                  boxShadow: '0 10px 30px rgba(103,126,234,0.4)',
                }}
              >
                ▶ Start Lesson
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Finished screen */}
        <AnimatePresence>
          {finished && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                textAlign: 'center',
                zIndex: 5,
              }}
            >
              <motion.div
                style={{ fontSize: '80px', marginBottom: '20px' }}
                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                🎉
              </motion.div>
              <h2 style={{ fontSize: '36px', fontWeight: '800', color: '#fff', marginBottom: '12px' }}>
                Lesson Complete!
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '18px', marginBottom: '32px' }}>
                Amazing job! You finished "{lesson.topic}"
              </p>
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={() => { setCurrentIndex(0); setFinished(false); setPlaying(true); }}
                  style={{
                    padding: '14px 32px',
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '12px',
                    color: '#fff',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontFamily: 'Poppins, sans-serif',
                  }}
                >
                  🔄 Watch Again
                </button>
                <button
                  onClick={() => navigate('/dashboard')}
                  style={{
                    padding: '14px 32px',
                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontFamily: 'Poppins, sans-serif',
                  }}
                >
                  📚 New Lesson
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main lesson view */}
        {!finished && (
          <>
            {/* Speech bubble */}
            <div style={{ marginBottom: '24px', width: '100%', maxWidth: '620px' }}>
              <AnimatePresence mode="wait">
                <SpeechBubble
                  key={currentIndex}
                  text={currentSegment.text || ''}
                  highlight={currentSegment.highlight}
                />
              </AnimatePresence>
            </div>

            {/* Aria character */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 120 }}
            >
              <AriaAvatar
                speaking={speaking && playing}
                emotion={currentSegment.emotion || 'explaining'}
              />
            </motion.div>

            {/* Stage floor */}
            <div style={{
              width: '220px',
              height: '16px',
              background: 'radial-gradient(ellipse, rgba(103,126,234,0.4) 0%, transparent 70%)',
              borderRadius: '50%',
              marginTop: '-4px',
            }} />
          </>
        )}
      </div>

      {/* Controls */}
      {!finished && (
        <div style={{
          background: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          flexWrap: 'wrap',
        }}>
          {/* Prev */}
          <motion.button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#fff',
              fontSize: '20px',
              cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
              opacity: currentIndex === 0 ? 0.4 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            whileTap={{ scale: 0.9 }}
          >
            ⏮
          </motion.button>

          {/* Play/Pause */}
          <motion.button
            onClick={handlePause}
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              border: 'none',
              color: '#fff',
              fontSize: '26px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 25px rgba(103,126,234,0.5)',
            }}
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
          >
            {playing ? '⏸' : '▶'}
          </motion.button>

          {/* Next */}
          <motion.button
            onClick={handleNext}
            disabled={currentIndex === script.length - 1}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#fff',
              fontSize: '20px',
              cursor: currentIndex === script.length - 1 ? 'not-allowed' : 'pointer',
              opacity: currentIndex === script.length - 1 ? 0.4 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            whileTap={{ scale: 0.9 }}
          >
            ⏭
          </motion.button>

          {/* Divider */}
          <div style={{ width: '1px', height: '40px', background: 'rgba(255,255,255,0.1)' }} />

          {/* Ask Doubt Button */}
          <motion.button
            onClick={openDoubt}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #f093fb, #f5576c)',
              border: 'none',
              borderRadius: '50px',
              color: '#fff',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '15px',
              fontFamily: 'Poppins, sans-serif',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 6px 20px rgba(240,147,251,0.4)',
            }}
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.03 }}
            animate={{ boxShadow: ['0 6px 20px rgba(240,147,251,0.4)', '0 8px 30px rgba(240,147,251,0.7)', '0 6px 20px rgba(240,147,251,0.4)'] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            🎤 Ask Doubt
          </motion.button>

          {/* Segment indicator */}
          <div style={{
            display: 'flex',
            gap: '4px',
            alignItems: 'center',
            marginLeft: '8px',
          }}>
            {script.map((_, i) => (
              <motion.div
                key={i}
                onClick={() => {
                  clearTimeout(timerRef.current);
                  window.speechSynthesis?.cancel();
                  setCurrentIndex(i);
                  setPlaying(true);
                }}
                style={{
                  width: i === currentIndex ? '20px' : '6px',
                  height: '6px',
                  borderRadius: '3px',
                  background: i < currentIndex ? '#667eea' : i === currentIndex ? '#f093fb' : 'rgba(255,255,255,0.2)',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Doubt Modal */}
      <AnimatePresence>
        {showDoubt && (
          <DoubtModal
            onClose={closeDoubt}
            context={lesson.content}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
