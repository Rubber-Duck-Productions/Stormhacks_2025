import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());

// Serve frontend static files if present
app.use(express.static(path.join(__dirname, '..')));

// Simple API route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Fallback to index.html for client-side routing
app.get(/.*/, (req, res) => {
  const indexPath = path.join(__dirname, '..', 'main.html');
  res.sendFile(indexPath, err => {
    if (err) {
      res.status(500).send('Server error');
    }
  });
});

const PORT = process.env.PORT || process.env.NODE_PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.info('SIGTERM signal received. Closing http server.');
  process.exit(0);
});
