const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');

const app = express();
const PORT = process.env.PORT || 8003;
const ADMIN_PASSWORD = 'NoahsArk2026!';

// ========================
// FIREBASE INITIALIZATION
// ========================
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Vercel stores multiline env vars with escaped \n — this restores them
      privateKey: process.env.FIREBASE_PRIVATE_KEY
        ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        : undefined,
    }),
  });
}

const db = admin.firestore();

// ========================
// MIDDLEWARE
// ========================
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Fallback: manually parse body if body-parser didn't catch it
app.use((req, res, next) => {
  if (req.body !== undefined) return next();
  const chunks = [];
  req.on('data', c => chunks.push(c));
  req.on('end', () => {
    try { req.body = JSON.parse(Buffer.concat(chunks).toString()); }
    catch (e) { req.body = {}; }
    next();
  });
});

app.use(express.static(__dirname));

// DEBUG endpoint — remove after fixing
app.all('/api/debug', (req, res) => {
  res.json({
    method: req.method,
    body: req.body,
    bodyType: typeof req.body,
    contentType: req.headers['content-type'] || 'none'
  });
});


// ========================
// HELPERS
// ========================
async function getCollection(name) {
  const snap = await db.collection(name).get();
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

async function setDoc(collection, id, data) {
  await db.collection(collection).doc(id).set(data, { merge: true });
}

async function deleteDoc(collection, id) {
  await db.collection(collection).doc(id).delete();
}

async function addDoc(collection, data) {
  const ref = await db.collection(collection).add(data);
  return ref.id;
}

// ========================
// EVENTS API
// ========================
app.get('/api/events', async (req, res) => {
  try {
    const events = await getCollection('events');
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const active = events
      .filter(e => new Date(e.date) >= today)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    res.json(active);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/admin/events', async (req, res) => {
  if (req.body.password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const events = await getCollection('events');
    events.sort((a, b) => new Date(a.date) - new Date(b.date));
    res.json(events);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/events/add', async (req, res) => {
  if (req.body.password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const { event } = req.body;
    if (event.id) {
      const { id, ...data } = event;
      await setDoc('events', id, data);
      return res.json({ success: true });
    }
    await addDoc('events', event);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/events/delete', async (req, res) => {
  if (req.body.password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });
  try {
    await deleteDoc('events', req.body.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ========================
// NOTICES API
// ========================
app.get('/api/notices', async (req, res) => {
  try { res.json(await getCollection('notices')); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/admin/notices', async (req, res) => {
  if (req.body.password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });
  try { res.json(await getCollection('notices')); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/notices/add', async (req, res) => {
  if (req.body.password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const { notice } = req.body;
    if (notice.id) {
      const { id, ...data } = notice;
      await setDoc('notices', id, data);
      return res.json({ success: true });
    }
    await addDoc('notices', notice);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/notices/delete', async (req, res) => {
  if (req.body.password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });
  try {
    await deleteDoc('notices', req.body.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ========================
// GENERIC CRUD FACTORY
// (scriptures, officials, services)
// ========================
function setupCrud(collectionName) {
  app.get(`/api/${collectionName}`, async (req, res) => {
    try { res.json(await getCollection(collectionName)); }
    catch (err) { res.status(500).json({ error: err.message }); }
  });

  app.post(`/api/admin/${collectionName}`, async (req, res) => {
    if (req.body.password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });
    try { res.json(await getCollection(collectionName)); }
    catch (err) { res.status(500).json({ error: err.message }); }
  });

  app.post(`/api/${collectionName}/add`, async (req, res) => {
    if (req.body.password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const item = req.body.item;
      if (item.id) {
        const { id, ...data } = item;
        await setDoc(collectionName, id, data);
        return res.json({ success: true });
      }
      await addDoc(collectionName, item);
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  app.post(`/api/${collectionName}/delete`, async (req, res) => {
    if (req.body.password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });
    try {
      await deleteDoc(collectionName, req.body.id);
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });
}

setupCrud('scriptures');
setupCrud('officials');
setupCrud('services');

// ========================
// DIOCESE API
// ========================
app.get('/api/diocese', async (req, res) => {
  try {
    const doc = await db.collection('settings').doc('diocese').get();
    res.json(doc.exists ? doc.data() : { bishopName: 'The Rt. Rev. Bishop of Harare' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/admin/diocese', async (req, res) => {
  if (req.body.password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const doc = await db.collection('settings').doc('diocese').get();
    res.json(doc.exists ? doc.data() : { bishopName: 'The Rt. Rev. Bishop of Harare' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/diocese/update', async (req, res) => {
  if (req.body.password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const { bishopName } = req.body;
    await db.collection('settings').doc('diocese').set({ bishopName }, { merge: true });
    res.json({ success: true, data: { bishopName } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ========================
// MOSAIC API
// ========================
app.get('/api/mosaic', async (req, res) => {
  try {
    const doc = await db.collection('settings').doc('mosaic').get();
    res.json(doc.exists ? doc.data().items || [] : []);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/mosaic/update', async (req, res) => {
  if (req.body.password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const { items } = req.body;
    await db.collection('settings').doc('mosaic').set({ items }, { merge: true });
    res.json({ success: true, items });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ========================
// IMAGE UPLOAD (base64)
// ========================
const fs = require('fs');
app.post('/api/upload', (req, res) => {
  const { password, filename, data } = req.body;
  if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });
  if (!filename || !data) return res.status(400).json({ error: 'Missing filename or data' });
  try {
    const base64 = data.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64, 'base64');
    const safeName = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
    fs.writeFileSync(path.join(__dirname, safeName), buffer);
    res.json({ success: true, filename: safeName });
  } catch (err) { res.status(500).json({ error: 'Upload failed on this platform' }); }
});

// ========================
// FALLBACK (SPA routing)
// ========================
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
