
const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
require('dotenv').config();
const rateLimit = require('express-rate-limit');
const validator = require('validator');

const app = express();
app.use(express.json());
app.use(cors({
  origin: [
    'https://after-school.tech',
    'http://localhost:3000',
    'http://localhost:4000',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:4000'
  ],
}));

// Rate limiting middleware (100 requests per 15 minutes per IP)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Middleware to ensure DB connection is ready
function ensureDbReady(req, res, next) {
  if (!db) {
    return res.status(503).json({ error: 'Database not connected yet. Please try again shortly.' });
  }
  next();
}

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);
let db;

client.connect().then(() => {
  db = client.db("ast_beta");
  console.log('Connected to MongoDB');
});

// Health check route
app.get('/', (req, res) => {
  console.log('[GET] / - Health check');
  res.json({ status: 'ok', message: 'Waitlist/Beta API server is running.' });
});

// Waitlist: { email }
app.post('/waitlist', ensureDbReady, async (req, res) => {
  console.log('[POST] /waitlist', req.body);
  const { email } = req.body;
  if (!email || !validator.isEmail(email)) {
    return res.status(400).json({ error: 'Valid email required' });
  }
  const exists = await db.collection('waitlist').findOne({ email });
  if (exists) {
    console.log('[POST] /waitlist - Email already registered:', email);
    return res.status(400).json({ error: 'Email already registered' });
  }
  await db.collection('waitlist').insertOne({ email, createdAt: new Date() });
  console.log('[POST] /waitlist - Registered:', email);
  res.json({ success: true });
});

// Beta signup: { name, email }
app.post('/beta/signup', ensureDbReady, async (req, res) => {
  console.log('[POST] /beta/signup', req.body);
  const { name, email } = req.body;
  if (!name || typeof name !== 'string' || name.length < 2 || name.length > 100) {
    return res.status(400).json({ error: 'Valid name required (2-100 chars)' });
  }
  if (!email || !validator.isEmail(email)) {
    return res.status(400).json({ error: 'Valid email required' });
  }
  const exists = await db.collection('beta_request').findOne({ email });
  if (exists) {
    console.log('[POST] /beta/signup - Email already registered:', email);
    return res.status(400).json({ error: 'Email already registered' });
  }
  await db.collection('beta_request').insertOne({ name, email, createdAt: new Date() });
  console.log('[POST] /beta/signup - Registered:', email);
  res.json({ success: true });
});

// Beta invite: { name, email, course, experience, goals, availability }
app.post('/beta/invite', ensureDbReady, async (req, res) => {
  console.log('[POST] /beta/invite', req.body);
  const { name, email, course, otherCourse, favColor, nickname, favFood } = req.body;
  if (!name || typeof name !== 'string' || name.length < 2 || name.length > 100) {
    return res.status(400).json({ error: 'Valid name required (2-100 chars)' });
  }
  if (!email || !validator.isEmail(email)) {
    return res.status(400).json({ error: 'Valid email required' });
  }
  if (course && typeof course !== 'string') {
    return res.status(400).json({ error: 'Course must be a string' });
  }
  if (otherCourse && typeof otherCourse !== 'string') {
    return res.status(400).json({ error: 'Other course must be a string' });
  }
  if (favColor && typeof favColor !== 'string') {
    return res.status(400).json({ error: 'Favorite color must be a string' });
  }
  if (nickname && typeof nickname !== 'string') {
    return res.status(400).json({ error: 'Nickname must be a string' });
  }
  if (favFood && typeof favFood !== 'string') {
    return res.status(400).json({ error: 'Favorite food must be a string' });
  }
  const exists = await db.collection('beta_invite').findOne({ email });
  if (exists) {
    console.log('[POST] /beta/invite - Email already registered:', email);
    return res.status(400).json({ error: 'Email already registered' });
  }
  await db.collection('beta_invite').insertOne({
    name, email, course, otherCourse, favColor, nickname, favFood, createdAt: new Date()
  });
  console.log('[POST] /beta/invite - Registered:', email);
  res.json({ success: true });
});

// Beta spots: count of beta_request
app.get('/beta/spots', ensureDbReady, async (req, res) => {
  try {
    const count = await db.collection('beta_request').countDocuments();
    res.json({ spotsTaken: count });
  } catch (error) {
    console.error('[GET] /beta/spots - Error:', error);
    res.status(500).json({ error: 'Failed to fetch beta spots count' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
