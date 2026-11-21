import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const [lessons, setLessons] = useState(
    JSON.parse(localStorage.getItem('lessons') || '[]')
  );
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const fileInputRef = useRef();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');

  const processFile = async (file) => {
    if (!file || file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file!');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error('File too large! Max 20MB');
      return;
    }

    setUploading(true);
    setProgress(10);
    setProgressText('📤 Uploading PDF...');

    try {
      const formData = new FormData();
      formData.append('pdf', file);

      const uploadRes = await axios.post('/api/pdf/upload', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setProgress(40);
      setProgressText('🧠 Analyzing content...');

      const { sections, fileName, pages, fileId } = uploadRes.data;
      const combinedContent = sections.map(s => s.content).join(' ');
      const topicName = fileName.replace('.pdf', '').replace(/_/g, ' ');

      setProgress(65);
      setProgressText('🎬 Generating lesson script with AI...');

      const aiRes = await axios.post('/api/ai/generate-lesson', {
        content: combinedContent,
        topic: topicName
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setProgress(90);
      setProgressText('✨ Preparing your lesson...');

      const lesson = {
        id: fileId || Date.now().toString(),
        fileName,
        pages,
        topic: topicName,
        script: aiRes.data.script,
        content: combinedContent.substring(0, 3000),
        createdAt: new Date().toISOString(),
        sections: sections.length
      };

      const updatedLessons = [lesson, ...lessons];
      setLessons(updatedLessons);
      localStorage.setItem('lessons', JSON.stringify(updatedLessons));

      setProgress(100);
      toast.success('🎉 Lesson created! Starting video...');

      setTimeout(() => {
        navigate(`/video/${lesson.id}`, { state: { lesson } });
      }, 500);

    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to process PDF. Please try again.');
    } finally {
      setUploading(false);
      setProgress(0);
      setProgressText('');
    }
  };

  const handleFileChange = (e) => processFile(e.target.files[0]);
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    processFile(e.dataTransfer.files[0]);
  }, [lessons]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="dashboard-container">
      {/* Loading Overlay */}
      <AnimatePresence>
        {uploading && (
          <motion.div
            className="loading-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              style={{
                background: 'rgba(30, 20, 60, 0.95)',
                border: '1px solid rgba(103, 126, 234, 0.3)',
                borderRadius: '24px',
                padding: '48px',
                textAlign: 'center',
                maxWidth: '400px',
                width: '90%',
              }}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
            >
              {/* Aria loading */}
              <motion.div
                style={{ fontSize: '72px', marginBottom: '16px' }}
                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                🤖
              </motion.div>
              <div className="spinner" style={{ margin: '0 auto 20px' }} />
              <div style={{ fontSize: '18px', fontWeight: '600', color: '#fff', marginBottom: '12px' }}>
                {progressText}
              </div>
              {/* Progress bar */}
              <div style={{
                width: '100%',
                height: '6px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '3px',
                overflow: 'hidden',
              }}>
                <motion.div
                  style={{
                    height: '100%',
                    background: 'linear-gradient(90deg, #667eea, #f093fb)',
                    borderRadius: '3px',
                  }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginTop: '8px' }}>
                {progress}% complete
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="dashboard-header">
        <div className="header-logo">
          <span>🤖</span> AI Tutor
        </div>
        <div className="header-user">
          <div className="user-avatar">
            {(user.name || 'S')[0].toUpperCase()}
          </div>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>
            Hi, {user.name?.split(' ')[0] || 'Student'}!
          </span>
          <button
            className="logout-btn"
            style={{ marginRight: '10px', background: 'linear-gradient(135deg, #667eea, #764ba2)', border: 'none' }}
            onClick={() => navigate('/tutor')}
          >
            Meet Aria
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: '40px' }}
        >
          <h2 style={{ fontSize: '36px', fontWeight: '800', marginBottom: '8px' }}>
            Your <span style={{
              background: 'linear-gradient(135deg, #667eea, #f093fb)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>Learning Hub</span> 🎓
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '16px' }}>
            Upload a PDF and watch Aria turn it into an interactive video lesson!
          </p>
        </motion.div>

        {/* Upload Section */}
        <motion.div
          className={`upload-section ${dragOver ? 'drag-over' : ''}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <span className="upload-icon">📚</span>
          <h3>Drop your PDF here or click to upload</h3>
          <p>Aria will create an animated lesson video just for you!</p>
          <p style={{ marginTop: '8px', fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>
            Supported: PDF files up to 20MB
          </p>
        </motion.div>

        {/* Lessons */}
        {lessons.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="section-title">
              Your <span>Lessons</span> ({lessons.length})
            </h3>
            <div className="lessons-grid">
              {lessons.map((lesson, idx) => (
                <motion.div
                  key={lesson.id}
                  className="lesson-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <div className="lesson-card-icon">
                    {['📖', '🔬', '📊', '💡', '🧠', '🌍'][idx % 6]}
                  </div>
                  <h4 title={lesson.topic}>{lesson.topic}</h4>
                  <div className="lesson-card-meta">
                    <span>📄 {lesson.pages} pages</span>
                    <span>🗓 {formatDate(lesson.createdAt)}</span>
                  </div>
                  <button
                    className="play-btn"
                    onClick={() => navigate(`/video/${lesson.id}`, { state: { lesson } })}
                  >
                    ▶ Watch Lesson
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {lessons.length === 0 && (
          <div className="empty-state">
            <span className="emoji">🎬</span>
            <h3>No lessons yet!</h3>
            <p>Upload your first PDF above to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
