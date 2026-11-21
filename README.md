# 🤖 AI Tutor Platform

An AI-powered tutoring platform that converts PDF documents into animated video lessons with a virtual AI teacher character named **Aria**.

---

## 🌟 Features

- **Student Registration & Login** - Secure authentication system
- **Animated Welcome Page** - Aria introduces herself on first login
- **Dashboard** - Upload PDFs and manage your lessons
- **AI-Generated Video Lessons** - Aria teaches your PDF content in an animated video
- **Text-to-Speech** - Aria actually talks to you using browser TTS
- **Pause & Ask Doubts** - Pause the lesson and ask questions by text or voice mic
- **Real-time AI Answers** - Aria answers doubts using OpenAI GPT-3.5

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+ installed
- npm installed

---

## Setup Instructions

### Step 1: Setup Backend

```bash
cd backend
npm install
```

Create your `.env` file:
```bash
cp .env.example .env
```

Edit `backend/.env` and add your API key:
```
PORT=5000
JWT_SECRET=any_random_secret_string_here
OPENAI_API_KEY=sk-your-openai-api-key-here
AI_PROVIDER=openai
```

> ⚠️ **Note**: If you don't have an OpenAI API key, the app still works! Aria will use a built-in fallback script to teach your PDF content. You just won't get AI-generated custom scripts. Get a free API key at https://platform.openai.com

Start the backend:
```bash
npm run dev
# OR
node server.js
```
Backend runs on http://localhost:5000

---

### Step 2: Setup Frontend

Open a new terminal:
```bash
cd frontend
npm install
npm start
```

Frontend runs on http://localhost:3000

---

## 🎮 How to Use

1. **Open** http://localhost:3000 in Chrome (recommended for voice features)
2. **Register** a new account
3. **Watch** Aria welcome you with animation
4. **Upload** any PDF from your Dashboard
5. **Watch** Aria teach the content in an animated video
6. **Press Pause** anytime, then click **"Ask Doubt"**
7. **Type or speak** your question, get instant AI answers!

---

## 📁 Project Structure

```
ai-tutor-platform/
├── backend/
│   ├── server.js          # Main Express server
│   ├── routes/
│   │   ├── auth.js        # Login/Register APIs
│   │   ├── pdf.js         # PDF upload & parsing
│   │   └── ai.js          # AI lesson generation & doubt answering
│   ├── middleware/
│   │   └── auth.js        # JWT auth middleware
│   ├── data/              # User data storage (JSON files)
│   ├── uploads/           # Uploaded PDF files
│   └── .env.example       # Environment variables template
│
└── frontend/
    ├── public/
    │   └── index.html
    └── src/
        ├── App.js         # Main router
        ├── App.css        # Global styles
        ├── index.js       # Entry point
        └── pages/
            ├── Login.js       # Login page
            ├── Register.js    # Registration page
            ├── Welcome.js     # Animated welcome with Aria
            ├── Dashboard.js   # PDF upload + lesson library
            └── VideoPlayer.js # Main video player with Aria
```

---

## 🔑 API Keys

### OpenAI (Recommended)
- Get key at: https://platform.openai.com/api-keys
- Used for: Custom lesson scripts + doubt answering + voice transcription (Whisper)
- Cost: Very low (~$0.002 per lesson)

### Without API Key
- App works with built-in fallback scripts
- Doubt answering returns a smart pre-built response
- Aria still animates, talks (browser TTS), and teaches!

---

## 🛠️ Tech Stack

**Frontend**: React 18, Framer Motion, React Router, Axios, React Hot Toast
**Backend**: Node.js, Express, Multer, pdf-parse, JWT, bcrypt
**AI**: OpenAI GPT-3.5 Turbo + Whisper (optional)
**Storage**: Local JSON files (no database needed!)

---

## 💡 Tips

- Use **Google Chrome** for best voice recognition support
- PDFs should be text-based (not scanned images) for best results
- Lesson length depends on PDF size (avg 7-10 segments)
- Aria uses your browser's text-to-speech voices

---

## 🐛 Common Issues

**"PDF parse error"** → Make sure the PDF has selectable text (not a scanned image)

**"Voice recognition not supported"** → Use Google Chrome browser

**Aria not speaking** → Allow browser audio permission; click anywhere first (browser autoplay policy)

**Backend not connecting** → Make sure backend is running on port 5000 and frontend is on 3000

---

## 🎓 Built With ❤️ for Learning
