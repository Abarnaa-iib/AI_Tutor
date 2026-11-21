const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const dotenv = require('dotenv');
dotenv.config();

// Dynamic AI client setup
let groqClient = null;

const getGroq = () => {
  if (!groqClient && process.env.GROQ_API_KEY) {
    const Groq = require('groq-sdk');
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqClient;
};

// GENERATE LESSON SCRIPT from PDF content
router.post('/generate-lesson', authMiddleware, async (req, res) => {
  try {
    const { content, topic } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const prompt = `You are an enthusiastic, friendly AI teacher named "Aria". 
    Create an engaging teaching script strictly based on the provided content below. 
    You MUST NOT invent facts or hallucinate information outside of the provided content.
    
    Topic: ${topic || 'Educational Content'}
    Content: ${content.substring(0, 6000)}
    
    Format your response as a JSON array of teaching segments, each with:
    - "text": what Aria says (clear, simple, engaging language for students, strictly summarizing the content provided)
    - "emotion": one of ["happy", "excited", "thinking", "explaining", "encouraging"]
    - "gesture": one of ["wave", "point", "nod", "thumbsup", "thinking"]
    - "highlight": key term or phrase from this segment (or null)
    
    Make it educational, friendly, and broken into 5-8 segments.
    Always start with a warm greeting.
    Use simple language. Add encouraging words.
    Return ONLY the flat JSON array, no markdown blocks, no other text.`;

    let scriptText = '';

    const provider = process.env.AI_PROVIDER || 'groq';

    if (provider === 'groq' && process.env.GROQ_API_KEY) {
      const groq = getGroq();
      const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
        max_tokens: 2000,
      });
      scriptText = completion.choices[0]?.message?.content || '';
    } else {
      // Fallback mock response if no API key
      scriptText = generateMockScript(topic, content);
    }

    // Parse JSON
    let script;
    try {
      const jsonMatch = scriptText.match(/\[[\s\S]*\]/);
      script = JSON.parse(jsonMatch ? jsonMatch[0] : scriptText);
    } catch {
      script = generateMockScriptParsed(topic, content);
    }

    res.json({ success: true, script });

  } catch (error) {
    console.error('Generate lesson error:', error);
    // Return fallback script
    const fallback = generateMockScriptParsed(req.body.topic, req.body.content);
    res.json({ success: true, script: fallback, fallback: true });
  }
});

// ANSWER DOUBT - Real-time Q&A
router.post('/answer-doubt', authMiddleware, async (req, res) => {
  try {
    const { question, context } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    const prompt = `You are Aria, a friendly AI tutor. A student just asked you a question during a lesson.
    
    Lesson Context (from uploaded material): 
    ${context ? context.substring(0, 4000) : 'General educational topic'}
    
    Student's Question: "${question}"
    
    Answer the student's question relying STRICTLY on the Lesson Context provided above.
    Do NOT invent facts or hallucinate external information. If the answer is not in the context, politely say so.
    Answer in a warm, encouraging, teacher-like way. Keep it concise (2-4 sentences).
    Start with acknowledging the question positively, then give a clear answer based on the text.
    End with encouragement.`;

    let answer = '';

    const provider = process.env.AI_PROVIDER || 'groq';

    if (provider === 'groq' && process.env.GROQ_API_KEY) {
      const groq = getGroq();
      const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
        max_tokens: 300,
      });
      answer = completion.choices[0]?.message?.content || '';
    } else {
      // Fallback answer
      answer = `Great question! "${question}" is something important to understand. Based on what we've covered, the key idea is to focus on the core concepts we discussed. Keep asking questions - curiosity is the best tool for learning! 🌟`;
    }

    res.json({ success: true, answer });

  } catch (error) {
    console.error('Answer doubt error:', error);
    res.json({
      success: true,
      answer: `That's a wonderful question! The answer relates to the concepts we've been exploring. The key thing to remember is to connect the ideas we've discussed. Don't hesitate to ask more - you're doing great! 🌟`,
      fallback: true
    });
  }
});

// TRANSCRIBE AUDIO (using OpenAI Whisper)
router.post('/transcribe', authMiddleware, async (req, res) => {
  try {
    const { audioData } = req.body; // base64 audio

    if (!audioData) {
      return res.status(400).json({ error: 'Audio data required' });
    }

    // If Groq available, use Whisper large v3
    if (process.env.GROQ_API_KEY) {
      const groq = getGroq();
      const audioBuffer = Buffer.from(audioData, 'base64');

      const fs = require('fs');
      const path = require('path');
      const tmpFile = path.join(__dirname, '../uploads', `audio_${Date.now()}.webm`);
      fs.writeFileSync(tmpFile, audioBuffer);

      const transcription = await groq.audio.transcriptions.create({
        file: fs.createReadStream(tmpFile),
        model: 'whisper-large-v3',
        response_format: 'json',
      });

      fs.unlinkSync(tmpFile); // cleanup

      res.json({ success: true, text: transcription.text });
    } else {
      res.json({ success: true, text: '', fallback: true, message: 'Transcription requires Groq API key' });
    }

  } catch (error) {
    console.error('Transcribe error:', error);
    res.json({ success: true, text: '', error: error.message });
  }
});

// Helper: Generate mock script
function generateMockScript(topic, content) {
  return JSON.stringify(generateMockScriptParsed(topic, content));
}

function generateMockScriptParsed(topic, content) {
  const topicName = topic || 'this topic';
  const preview = content ? content.substring(0, 200) : '';

  return [
    {
      text: `Hello there! I'm Aria, your AI tutor! Welcome to today's lesson on ${topicName}. I'm so excited to learn with you today! Let's dive in!`,
      emotion: "excited",
      gesture: "wave",
      highlight: topicName
    },
    {
      text: `Let's start with the fundamentals. ${preview.substring(0, 150)}... These are the building blocks we'll explore together.`,
      emotion: "explaining",
      gesture: "point",
      highlight: "fundamentals"
    },
    {
      text: `This is a really important concept! Understanding this will help you grasp everything else we cover today. Pay close attention!`,
      emotion: "excited",
      gesture: "thumbsup",
      highlight: "important concept"
    },
    {
      text: `Now, let me explain this more clearly. Think of it this way - every new thing you learn builds on what you already know. That's the beauty of learning!`,
      emotion: "thinking",
      gesture: "thinking",
      highlight: null
    },
    {
      text: `Let's look at the key points from our content. The main ideas here are deeply connected and once you understand the pattern, everything clicks into place!`,
      emotion: "explaining",
      gesture: "point",
      highlight: "key points"
    },
    {
      text: `You're doing amazing! Remember, learning is a journey. If you have any doubts, just press the microphone button and ask me anything. I'm here to help you!`,
      emotion: "encouraging",
      gesture: "nod",
      highlight: null
    },
    {
      text: `Excellent work today! You've covered all the main concepts. Keep practicing, stay curious, and remember - every expert was once a beginner. You've got this! 🌟`,
      emotion: "happy",
      gesture: "thumbsup",
      highlight: null
    }
  ];
}

module.exports = router;
