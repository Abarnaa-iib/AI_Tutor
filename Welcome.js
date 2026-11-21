import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const WELCOME_MESSAGES = [
  "Hello! I'm Aria, your AI tutor! 👋",
  "I'm here to make learning fun and easy!",
  "Upload any PDF and I'll teach it to you!",
  "Let's go to your Dashboard! 🚀"
];

export default function Welcome() {
  const [msgIndex, setMsgIndex] = useState(0);
  const [showBtn, setShowBtn] = useState(false);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const timer = setInterval(() => {
      setMsgIndex(prev => {
        if (prev < WELCOME_MESSAGES.length - 1) return prev + 1;
        clearInterval(timer);
        setShowBtn(true);
        return prev;
      });
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated background orbs */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b'][i]}40 0%, transparent 70%)`,
            width: `${200 + i * 100}px`,
            height: `${200 + i * 100}px`,
            left: `${[10, 60, 30, 70, 20][i]}%`,
            top: `${[20, 60, 80, 10, 50][i]}%`,
            transform: 'translate(-50%, -50%)',
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 3 + i,
            repeat: Infinity,
            delay: i * 0.5,
          }}
        />
      ))}

      {/* Welcome text */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ textAlign: 'center', marginBottom: '40px', zIndex: 1 }}
      >
        <h2 style={{
          fontSize: '32px',
          fontWeight: '700',
          color: 'rgba(255,255,255,0.9)',
        }}>
          Welcome, <span style={{
            background: 'linear-gradient(135deg, #667eea, #f093fb)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>{user.name || 'Student'}!</span>
        </h2>
      </motion.div>

      {/* Animated Aria Character */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.3 }}
        style={{ zIndex: 1, marginBottom: '32px' }}
      >
        <AriaCharacter messageIndex={msgIndex} />
      </motion.div>

      {/* Speech Bubble */}
      <AnimatePresence mode="wait">
        <motion.div
          key={msgIndex}
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.9 }}
          transition={{ duration: 0.4 }}
          style={{
            background: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '20px',
            padding: '20px 32px',
            maxWidth: '500px',
            textAlign: 'center',
            fontSize: '20px',
            fontWeight: '600',
            color: '#fff',
            zIndex: 1,
            marginBottom: '32px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          }}
        >
          {WELCOME_MESSAGES[msgIndex]}
        </motion.div>
      </AnimatePresence>

      {/* Progress dots */}
      <div style={{ display: 'flex', gap: '8px', zIndex: 1, marginBottom: '32px' }}>
        {WELCOME_MESSAGES.map((_, i) => (
          <motion.div
            key={i}
            animate={{
              width: i === msgIndex ? '24px' : '8px',
              background: i === msgIndex ? '#667eea' : 'rgba(255,255,255,0.3)',
            }}
            style={{ height: '8px', borderRadius: '4px', transition: 'all 0.3s' }}
          />
        ))}
      </div>

      {/* Go to Dashboard button */}
      <AnimatePresence>
        {showBtn && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => navigate('/dashboard')}
            style={{
              padding: '16px 48px',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              border: 'none',
              borderRadius: '50px',
              color: '#fff',
              fontSize: '18px',
              fontWeight: '700',
              cursor: 'pointer',
              fontFamily: 'Poppins, sans-serif',
              zIndex: 1,
              boxShadow: '0 15px 40px rgba(103, 126, 234, 0.5)',
            }}
            whileHover={{ scale: 1.05, boxShadow: '0 20px 50px rgba(103, 126, 234, 0.7)' }}
            whileTap={{ scale: 0.98 }}
          >
            🎓 Go to Dashboard →
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

function AriaCharacter({ messageIndex }) {
  const emotions = ['wave', 'excited', 'explaining', 'thumbsup'];
  const emotion = emotions[messageIndex] || 'happy';

  const bodyColors = ['#667eea', '#764ba2', '#f093fb'];
  const eyeExpressions = {
    wave: { left: '😊', transform: '' },
    excited: { left: '🤩', transform: '' },
    explaining: { left: '🧐', transform: '' },
    thumbsup: { left: '😄', transform: '' },
    happy: { left: '😊', transform: '' },
  };

  return (
    <motion.div
      style={{
        width: '180px',
        height: '220px',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
      animate={{
        y: [0, -8, 0],
      }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* Glow */}
      <motion.div
        style={{
          position: 'absolute',
          inset: '-20px',
          background: 'radial-gradient(circle, rgba(103,126,234,0.3) 0%, transparent 70%)',
          borderRadius: '50%',
        }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      />

      {/* Head */}
      <motion.div
        style={{
          width: '110px',
          height: '110px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '52px',
          boxShadow: '0 10px 30px rgba(103, 126, 234, 0.5)',
          zIndex: 2,
          border: '3px solid rgba(255,255,255,0.2)',
        }}
        animate={{
          rotate: messageIndex === 0 ? [-5, 5, -5] : [0, 0],
          scale: messageIndex === 1 ? [1, 1.05, 1] : [1],
        }}
        transition={{ duration: 0.8, repeat: messageIndex === 0 ? Infinity : 0 }}
      >
        {['👋', '🤩', '🧐', '🎓'][messageIndex] || '🤖'}
      </motion.div>

      {/* Body */}
      <motion.div
        style={{
          width: '80px',
          height: '70px',
          background: 'linear-gradient(180deg, #667eea, #302b63)',
          borderRadius: '16px 16px 20px 20px',
          marginTop: '-10px',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
        }}
        animate={{
          scaleX: [1, 1.03, 1],
        }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <span style={{ fontSize: '20px' }}>🎯</span>
      </motion.div>

      {/* Arms */}
      <motion.div
        style={{
          position: 'absolute',
          bottom: '55px',
          left: '-12px',
          width: '28px',
          height: '50px',
          background: 'linear-gradient(180deg, #667eea, #302b63)',
          borderRadius: '14px',
          transformOrigin: 'top center',
        }}
        animate={{
          rotate: messageIndex === 0 ? [0, -30, 0] : messageIndex === 3 ? [-20, -20] : [10, 10],
        }}
        transition={{ duration: 0.8, repeat: messageIndex === 0 ? Infinity : 0 }}
      />
      <motion.div
        style={{
          position: 'absolute',
          bottom: '55px',
          right: '-12px',
          width: '28px',
          height: '50px',
          background: 'linear-gradient(180deg, #667eea, #302b63)',
          borderRadius: '14px',
          transformOrigin: 'top center',
        }}
        animate={{
          rotate: messageIndex === 3 ? [30, 40, 30] : [-10, -10],
        }}
        transition={{ duration: 0.8, repeat: messageIndex === 3 ? Infinity : 0 }}
      />

      {/* Legs */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '-4px', zIndex: 1 }}>
        {[1, 2].map(i => (
          <motion.div
            key={i}
            style={{
              width: '22px',
              height: '28px',
              background: 'linear-gradient(180deg, #302b63, #1a1040)',
              borderRadius: '0 0 10px 10px',
            }}
            animate={{ scaleY: [1, 0.95, 1] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.5 }}
          />
        ))}
      </div>

      {/* Speech indicator dots */}
      <motion.div
        style={{
          position: 'absolute',
          top: '-20px',
          right: '-10px',
          display: 'flex',
          gap: '4px',
        }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        {[1, 2, 3].map(i => (
          <div
            key={i}
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#f093fb',
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
}
