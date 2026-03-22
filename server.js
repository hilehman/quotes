const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const { quotes } = require('./quotes');

const app = express();
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory counter for quote assignment
let nextIndex = 0;
const assignedMap = new Map(); // visitorId -> quoteIndex

app.get('/api/quote', (req, res) => {
  const total = quotes.length;

  // Check if this visitor already has an assignment via cookie
  const existingId = req.cookies.visitor_id;
  if (existingId && assignedMap.has(existingId)) {
    const idx = assignedMap.get(existingId);
    return res.json({ quote: quotes[idx], index: idx, total });
  }

  // Assign the next quote
  const idx = nextIndex % total;
  nextIndex++;

  // Generate a unique visitor ID
  const visitorId = `v_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  assignedMap.set(visitorId, idx);

  // Set cookie that lasts 24 hours
  res.cookie('visitor_id', visitorId, {
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: 'lax',
  });

  res.json({ quote: quotes[idx], index: idx, total });
});

// Fallback: serve index.html for any non-API route
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Quotes server running on port ${PORT}`);
});
