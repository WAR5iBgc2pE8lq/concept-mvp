import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import { nanoid } from 'nanoid';

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_KEY = process.env.ADMIN_KEY || 'changeme';
const PERSIST = process.env.PERSIST || 'file'; // 'memory' or 'file'

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

let leads = [];
const leadsFile = 'leads.json';

// Load from disk if exists
if (PERSIST === 'file' && fs.existsSync(leadsFile)) {
  try { leads = JSON.parse(fs.readFileSync(leadsFile, 'utf8')); } catch {}
}

function save() {
  if (PERSIST === 'file') {
    fs.writeFileSync(leadsFile, JSON.stringify(leads, null, 2));
  }
}

// Health
app.get('/api/health', (req, res) => res.json({ ok: true }));

// Create lead/feedback
app.post('/api/leads', (req, res) => {
  const { name = '', email = '', message = '' } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Email required' });
  const lead = { id: nanoid(10), name, email, message, createdAt: new Date().toISOString() };
  leads.unshift(lead);
  save();
  res.status(201).json(lead);
});

// List leads (admin)
app.get('/api/leads', (req, res) => {
  const key = req.query.key;
  if (key !== ADMIN_KEY) return res.status(401).json({ error: 'Unauthorized' });
  res.json(leads);
});

// Delete a lead (admin)
app.delete('/api/leads/:id', (req, res) => {
  const key = req.query.key;
  if (key !== ADMIN_KEY) return res.status(401).json({ error: 'Unauthorized' });
  const { id } = req.params;
  const before = leads.length;
  leads = leads.filter(l => l.id !== id);
  save();
  res.json({ deleted: before - leads.length });
});

app.listen(PORT, () => console.log(`MVP running on http://localhost:${PORT}`));
