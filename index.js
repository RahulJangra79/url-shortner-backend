require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { nanoid } = require('nanoid');
const QRCode = require('qrcode');

const app = express();

// https://url-shortner-three-rosy.vercel.app/

const corsOptions = {
    origin: 'https://url-shortner-three-rosy.vercel.app',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  };
  
  app.use(cors(corsOptions));
  
// app.use(cors());
app.use(express.json());

// DB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Error connecting to MongoDB:', err));

const urlSchema = new mongoose.Schema({
  originalUrl: String,
  shortUrl: String,
  clicks: { type: Number, default: 0 },
});

const Url = mongoose.model('Url', urlSchema);

// API to create short URL
app.post('/api/short', async (req, res) => {
  try {
    const { originalUrl } = req.body;
    if (!originalUrl) {
      return res.status(400).json({ error: 'Missing original URL' });
    }

    const shortUrl = nanoid(8);
    const url = new Url({ originalUrl, shortUrl });

    const backendBaseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
    const myUrl = `${backendBaseUrl}/${shortUrl}`;
    const qrCodeImg = await QRCode.toDataURL(myUrl);

    await url.save();
    return res.status(200).json({ message: "URL Generated", shortUrl: myUrl, qrCodeImg });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error generating URL" });
  }
});

// Redirect short URL
app.get('/:shortUrl', async (req, res) => {
  try {
    const { shortUrl } = req.params;
    const url = await Url.findOne({ shortUrl });
    if (url) {
      url.clicks++;
      await url.save();
      return res.redirect(url.originalUrl);
    } else {
      return res.status(404).json({ message: "URL not found" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
