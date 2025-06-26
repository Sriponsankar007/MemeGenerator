import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { MongoClient } from 'mongodb';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const memeSchema = new mongoose.Schema({
  user: { type: String, required: true },
  image: String, // base64 or URL
  topText: String,
  bottomText: String,
  fontFamily: String,
  topColor: String,
  bottomColor: String,
  bgColor: String,
  createdAt: { type: Date, default: Date.now }
});

const Meme = mongoose.model('Meme', memeSchema);

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true }
});
const User = mongoose.model('User', userSchema);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// MongoDB native client setup
const mongoClient = new MongoClient(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
let mongoConnected = false;

async function connectMongo() {
  if (!mongoConnected) {
    await mongoClient.connect();
    mongoConnected = true;
    console.log('MongoDB native client connected');
  }
}

// Save meme
app.post('/api/memes', async (req, res) => {
  try {
    const { image, user, ...rest } = req.body;
    // Upload image to Cloudinary
    const uploadRes = await cloudinary.uploader.upload(image, {
      folder: 'memes',
      upload_preset: 'ml_default',
    });
    // Save meme with Cloudinary URL
    const meme = new Meme({
      user,
      ...rest,
      image: uploadRes.secure_url,
    });
    await meme.save();
    console.log(`Meme saved for user: ${user}`);
    res.status(201).json(meme);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save meme' });
  }
});

// Get all memes
app.get('/api/memes', async (req, res) => {
  try {
    const { user } = req.query;
    if (!user) return res.status(400).json({ error: 'User required' });
    const memes = await Meme.find({ user }).sort({ createdAt: -1 });
    res.json(memes);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch memes' });
  }
});

// Delete meme
app.delete('/api/memes/:id', async (req, res) => {
  try {
    await Meme.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete meme' });
  }
});

// Simple root route
app.get('/', (req, res) => {
  res.send('Meme API running');
});

// Serve React build static files if build exists
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const buildPath = path.join(__dirname, '..', 'build');
if (fs.existsSync(buildPath)) {
  app.use(express.static(buildPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
}

// User login (create if not exists)
app.post('/api/login', async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: 'Username required' });
  let user = await User.findOne({ username });
  if (!user) user = await User.create({ username });
  res.json({ username: user.username });
});

// User registration and per-user DB creation
app.post('/api/register', async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: 'Username required' });
  try {
    await connectMongo();
    // Save username in main users DB (optional, for listing users)
    let user = await User.findOne({ username });
    if (!user) user = await User.create({ username });
    // Create a DB for the user (MongoDB creates DB on first write)
    const userDb = mongoClient.db(username);
    // Optionally, create an 'images' collection with an index
    await userDb.createCollection('images').catch(() => {}); // ignore if exists
    await userDb.collection('images').createIndex({ imageId: 1 }, { unique: true }).catch(() => {});
    res.json({ username });
  } catch (err) {
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Save image data in user's DB
app.post('/api/:username/images', async (req, res) => {
  const { username } = req.params;
  const { imageUrl, imageId, imageDetails } = req.body;
  if (!imageUrl || !imageId || !imageDetails) {
    return res.status(400).json({ error: 'imageUrl, imageId, and imageDetails required' });
  }
  try {
    await connectMongo();
    const userDb = mongoClient.db(username);
    const result = await userDb.collection('images').insertOne({ imageUrl, imageId, imageDetails });
    res.status(201).json({ success: true, id: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save image data', details: err.message });
  }
});

// Get all images for a user
app.get('/api/:username/images', async (req, res) => {
  const { username } = req.params;
  try {
    await connectMongo();
    const userDb = mongoClient.db(username);
    const images = await userDb.collection('images').find({}).toArray();
    res.json(images);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch images', details: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));