const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8003;
const EVENTS_FILE = path.join(__dirname, 'events.json');

// The password requested by the client
const ADMIN_PASSWORD = 'NoahsArk2026!';

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
// Serve static files from the current directory (the website)
app.use(express.static(__dirname));

// Utility to read events
function getEvents() {
  if (!fs.existsSync(EVENTS_FILE)) return [];
  const data = fs.readFileSync(EVENTS_FILE, 'utf-8');
  try {
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

// Utility to write events
function saveEvents(events) {
  fs.writeFileSync(EVENTS_FILE, JSON.stringify(events, null, 2));
}

// Public API: Get active events (auto-filters out expired ones)
app.get('/api/events', (req, res) => {
  const events = getEvents();
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of today

  // Filter: Keep events where the date is >= today
  const activeEvents = events.filter(e => {
    const eventDate = new Date(e.date);
    return eventDate >= today;
  });

  // Sort by date (closest first)
  activeEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  res.json(activeEvents);
});

// Admin API: Get all events (including expired, for admin visibility)
app.post('/api/admin/events', (req, res) => {
  const { password } = req.body;
  if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });
  
  const events = getEvents();
  events.sort((a, b) => new Date(a.date) - new Date(b.date));
  res.json(events);
});

// Admin API: Add/Edit an event
app.post('/api/events/add', (req, res) => {
  const { password, event } = req.body;
  if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });

  let events = getEvents();
  
  if (event.id) {
    const idx = events.findIndex(e => e.id === event.id);
    if (idx !== -1) {
      events[idx] = { ...events[idx], ...event }; // Update
      saveEvents(events);
      return res.json({ success: true, message: 'Event updated successfully' });
    }
  }

  // Automatically cleanup very old events
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  events = events.filter(e => new Date(e.date) >= thirtyDaysAgo);

  const newEvent = {
    id: Date.now().toString(),
    ...event
  };
  events.push(newEvent);
  saveEvents(events);
  
  res.json({ success: true, message: 'Event added successfully', event: newEvent });
});

// Admin API: Delete an event
app.post('/api/events/delete', (req, res) => {
  const { password, id } = req.body;
  if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });

  let events = getEvents();
  events = events.filter(e => e.id !== id);
  saveEvents(events);

  res.json({ success: true, message: 'Event deleted' });
});

// ========================
// NOTICES API
// ========================
const NOTICES_FILE = path.join(__dirname, 'notices.json');

function getNotices() {
  if (!fs.existsSync(NOTICES_FILE)) return [];
  try { return JSON.parse(fs.readFileSync(NOTICES_FILE, 'utf-8')); } catch (e) { return []; }
}
function saveNotices(notices) {
  fs.writeFileSync(NOTICES_FILE, JSON.stringify(notices, null, 2));
}

// Public API
app.get('/api/notices', (req, res) => {
  res.json(getNotices());
});

// Admin API
app.post('/api/admin/notices', (req, res) => {
  const { password } = req.body;
  if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });
  res.json(getNotices());
});

app.post('/api/notices/add', (req, res) => {
  const { password, notice } = req.body;
  if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });

  let notices = getNotices();
  if (notice.id) {
    const idx = notices.findIndex(n => n.id === notice.id);
    if (idx !== -1) {
      notices[idx] = { ...notices[idx], ...notice };
      saveNotices(notices);
      return res.json({ success: true });
    }
  }

  notice.id = Date.now().toString();
  notices.push(notice);
  saveNotices(notices);
  res.json({ success: true });
});

app.post('/api/notices/delete', (req, res) => {
  const { password, id } = req.body;
  if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });
  let notices = getNotices();
  notices = notices.filter(n => n.id !== id);
  saveNotices(notices);
  res.json({ success: true });
});

// ========================
// EXTENDED MINISTRY CRUD APIs
// ========================
function setupCrud(app, name, fileTarget) {
  const filePath = path.join(__dirname, fileTarget);
  function getData() {
    if (!fs.existsSync(filePath)) return [];
    try { return JSON.parse(fs.readFileSync(filePath, 'utf-8')); } catch (e) { return []; }
  }
  function saveData(data) { fs.writeFileSync(filePath, JSON.stringify(data, null, 2)); }
  
  app.get(`/api/${name}`, (req, res) => res.json(getData()));
  app.post(`/api/admin/${name}`, (req, res) => {
    if (req.body.password !== ADMIN_PASSWORD) return res.status(401).json({error: 'Unauthorized'});
    res.json(getData());
  });
  app.post(`/api/${name}/add`, (req, res) => {
    if (req.body.password !== ADMIN_PASSWORD) return res.status(401).json({error: 'Unauthorized'});
    let items = getData();
    const payload = req.body.item;
    if (payload.id) {
      const idx = items.findIndex(i => i.id === payload.id);
      if (idx !== -1) {
        items[idx] = { ...items[idx], ...payload };
        saveData(items);
        return res.json({success: true});
      }
    }
    payload.id = Date.now().toString();
    items.push(payload);
    saveData(items);
    res.json({success: true});
  });
  app.post(`/api/${name}/delete`, (req, res) => {
    if (req.body.password !== ADMIN_PASSWORD) return res.status(401).json({error: 'Unauthorized'});
    let items = getData();
    items = items.filter(i => i.id !== req.body.id);
    saveData(items);
    res.json({success: true});
  });
}

setupCrud(app, 'scriptures', 'scriptures.json');
setupCrud(app, 'officials', 'officials.json');
setupCrud(app, 'services', 'services.json');

// ========================
// DIOCESE API (bishop name)
// ========================
const DIOCESE_FILE = path.join(__dirname, 'diocese.json');

function getDiocese() {
  if (!fs.existsSync(DIOCESE_FILE)) return { bishopName: 'The Rt. Rev. Bishop of Harare' };
  try { return JSON.parse(fs.readFileSync(DIOCESE_FILE, 'utf-8')); } catch (e) { return { bishopName: 'The Rt. Rev. Bishop of Harare' }; }
}
function saveDiocese(data) {
  fs.writeFileSync(DIOCESE_FILE, JSON.stringify(data, null, 2));
}

app.get('/api/diocese', (req, res) => res.json(getDiocese()));

app.post('/api/admin/diocese', (req, res) => {
  if (req.body.password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });
  res.json(getDiocese());
});

app.post('/api/diocese/update', (req, res) => {
  const { password, bishopName } = req.body;
  if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });
  const data = getDiocese();
  if (bishopName) data.bishopName = bishopName;
  saveDiocese(data);
  res.json({ success: true, data });
});

// ========================
// MOSAIC API (Life at Noah's Ark images)
// ========================
const MOSAIC_FILE = path.join(__dirname, 'mosaic.json');

function getMosaic() {
  if (!fs.existsSync(MOSAIC_FILE)) return [];
  try { return JSON.parse(fs.readFileSync(MOSAIC_FILE, 'utf-8')); } catch (e) { return []; }
}
function saveMosaic(data) {
  fs.writeFileSync(MOSAIC_FILE, JSON.stringify(data, null, 2));
}

app.get('/api/mosaic', (req, res) => res.json(getMosaic()));

app.post('/api/admin/mosaic', (req, res) => {
  if (req.body.password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });
  res.json(getMosaic());
});

app.post('/api/mosaic/update', (req, res) => {
  const { password, items } = req.body;
  if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });
  if (!Array.isArray(items)) return res.status(400).json({ error: 'Invalid data' });
  saveMosaic(items);
  res.json({ success: true, items });
});

// IMAGE UPLOAD
app.post('/api/upload', (req, res) => {
  const { password, filename, data } = req.body;
  if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });
  if (!filename || !data) return res.status(400).json({ error: 'Missing filename or data' });
  const base64 = data.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64, 'base64');
  const safeName = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
  fs.writeFileSync(path.join(__dirname, safeName), buffer);
  res.json({ success: true, filename: safeName });
});

// Fallback for SPA routing if needed
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Required for Vercel serverless deployment
module.exports = app;
