const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

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
app.post('/waitlist', async (req, res) => {
  console.log('[POST] /waitlist', req.body);
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
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
app.post('/beta/signup', async (req, res) => {
  console.log('[POST] /beta/signup', req.body);
  const { name, email } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Name and email required' });
  const exists = await db.collection('betaSignups').findOne({ email });
  if (exists) {
    console.log('[POST] /beta/signup - Email already registered:', email);
    return res.status(400).json({ error: 'Email already registered' });
  }
  await db.collection('beta_request').insertOne({ name, email, createdAt: new Date() });
  console.log('[POST] /beta/signup - Registered:', email);
  res.json({ success: true });
});

// Beta invite: { name, email, course, experience, goals, availability }
app.post('/beta/invite', async (req, res) => {
  console.log('[POST] /beta/invite', req.body);
  const { name, email, course, experience, goals, availability } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Name and email required' });
  const exists = await db.collection('betaInvites').findOne({ email });
  if (exists) {
    console.log('[POST] /beta/invite - Email already registered:', email);
    return res.status(400).json({ error: 'Email already registered' });
  }
  await db.collection('beta_invite').insertOne({
    name, email, course, experience, goals, availability, createdAt: new Date()
  });
  console.log('[POST] /beta/invite - Registered:', email);
  res.json({ success: true });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
