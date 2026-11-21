const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const authMiddleware = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const UPLOADS_DIR = path.join(__dirname, '../uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// UPLOAD PDF
router.post('/upload', authMiddleware, upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    const filePath = req.file.path;
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);

    const text = pdfData.text;
    const pages = pdfData.numpages;

    // Split into sections for lesson structure
    const sections = splitIntoSections(text);

    res.json({
      success: true,
      fileId: path.basename(req.file.filename, path.extname(req.file.filename)),
      fileName: req.file.originalname,
      pages,
      totalText: text.length,
      sections,
      rawText: text.substring(0, 5000) // First 5000 chars for preview
    });

  } catch (error) {
    console.error('PDF upload error:', error);
    res.status(500).json({ error: error.message || 'Failed to process PDF' });
  }
});

function splitIntoSections(text) {
  // Split text into meaningful sections (paragraphs or by length)
  const cleanText = text.replace(/\s+/g, ' ').trim();
  const sentences = cleanText.split(/(?<=[.!?])\s+/);
  
  const sections = [];
  let currentSection = '';
  let sectionNum = 1;

  for (const sentence of sentences) {
    currentSection += sentence + ' ';
    if (currentSection.length > 400) {
      sections.push({
        id: sectionNum++,
        content: currentSection.trim(),
        duration: Math.ceil(currentSection.split(' ').length / 2.5) // ~2.5 words per second
      });
      currentSection = '';
    }
  }

  if (currentSection.trim()) {
    sections.push({
      id: sectionNum,
      content: currentSection.trim(),
      duration: Math.ceil(currentSection.split(' ').length / 2.5)
    });
  }

  return sections.slice(0, 20); // Max 20 sections
}

module.exports = router;
