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

// Secret admin page - all quotes overview
app.get('/admin-k9x7m', (req, res) => {
  let html = `<!DOCTYPE html><html lang="he" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>ניהול ציטוטים</title>
<link href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;700;900&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Heebo',sans-serif;background:#0a1628;color:#f0f0f0;padding:1.5rem;direction:rtl}
h1{text-align:center;font-size:1.8rem;margin-bottom:1.5rem;color:#ffd166}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:1rem;max-width:1400px;margin:0 auto}
.card{background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:1rem;display:flex;gap:1rem;align-items:flex-start}
.card img{width:70px;height:70px;border-radius:12px;object-fit:cover;flex-shrink:0}
.info{flex:1;min-width:0}
.name{font-weight:900;font-size:1.1rem;color:#ffd166;margin-bottom:0.2rem}
.sport{font-size:0.8rem;color:#a0aec0;margin-bottom:0.4rem}
.quote-he{font-size:0.9rem;line-height:1.6;margin-bottom:0.3rem;border-right:2px solid #ff6b35;padding-right:0.6rem}
.quote-en{font-size:0.8rem;color:#a0aec0;font-style:italic;direction:ltr;text-align:left;line-height:1.5}
.num{background:#ff6b35;color:white;font-weight:900;font-size:0.75rem;padding:0.15rem 0.5rem;border-radius:8px;display:inline-block;margin-bottom:0.3rem}
</style></head><body>
<h1>כל הציטוטים (${quotes.length})</h1>
<div class="grid">`;

  quotes.forEach((q, i) => {
    html += `<div class="card">
<img src="${q.image}" alt="${q.name_he}">
<div class="info">
<span class="num">#${i + 1}</span>
<div class="name">${q.name_he}</div>
<div class="sport">${q.sport_he}</div>
<div class="quote-he">${q.quote_he}</div>
<div class="quote-en">"${q.quote_en}"</div>
</div></div>`;
  });

  html += '</div></body></html>';
  res.send(html);
});

// Fallback: serve index.html for any non-API route
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Quotes server running on port ${PORT}`);
});
