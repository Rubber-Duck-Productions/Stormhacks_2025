import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());


// Serve built frontend if present (production). Use repo root as fallback for development.
const distPath = path.join(__dirname, '..', 'dist');
const publicPath = fs.existsSync(distPath) ? distPath : path.join(__dirname, '..');
// Serve static files and ensure common module/script files get the correct Content-Type
app.use(express.static(publicPath, {
  setHeaders: (res, filePath) => {
    try {
      const ext = path.extname(filePath).toLowerCase();
      if (ext === '.js' || ext === '.mjs') {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      } else if (ext === '.wasm') {
        res.setHeader('Content-Type', 'application/wasm');
      }
    } catch (e) {
      // fail silently; don't block serving files
    }
  }
}));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Lightweight API index
app.get('/api', (req, res) => {
  res.json({
    endpoints: {
      health: '/api/health',
      location: '/api/location?ip=<optional-ip>',
      weather: '/api/weather (defaults to request IP location) — or /api/weather?city=<city> or ?lat=<lat>&lon=<lon>'
    },
    notes: 'Location uses ip-api.com, weather uses Open-Meteo (no API key). Provide city or lat+lon for /api/weather.'
  });
});

// Helper to extract client IP (respects common proxies)
function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const sock = req.socket || req.connection;
  let ip = sock?.remoteAddress || req.ip || req.connection?.remoteAddress;
  if (!ip) return null;
  // strip IPv6 prefix if present
  if (ip.startsWith('::ffff:')) ip = ip.replace('::ffff:', '');
  return ip;
}

// Simple in-memory cache to reduce external calls (TTL in ms)
const cache = new Map();
function cached(key, ttl, loader) {
  const now = Date.now();
  const entry = cache.get(key);
  if (entry && entry.expire > now) return entry.value;
  const value = loader();
  // if loader returns a promise, store after resolution
  if (value && typeof value.then === 'function') {
    return value.then(res => {
      cache.set(key, { value: res, expire: Date.now() + ttl });
      return res;
    });
  }
  cache.set(key, { value, expire: Date.now() + ttl });
  return value;
}


app.get('/api/location', async (req, res) => {
  try {
    const ip = req.query.ip || getClientIp(req) || '';
    const url = ip ? `http://ip-api.com/json/${encodeURIComponent(ip)}` : `http://ip-api.com/json`;
    const r = await fetch(url);
    if (!r.ok) {
      return res.status(502).json({ error: 'Failed to fetch location' });
    }
    const body = await r.json();
    // return a concise subset
    const result = {
      ip: body.query || ip || null,
      status: body.status,
      country: body.country,
      region: body.regionName || body.region,
      city: body.city,
      lat: body.lat,
      lon: body.lon,
      isp: body.isp
    };
    res.json(result);
  } catch (err) {
    console.error('location error', err);
    res.status(500).json({ error: 'Internal error' });
  }
});


app.get('/api/weather', async (req, res) => {
  try {
    let { city, lat, lon, ip } = req.query;

    // Priority: explicit lat+lon -> city (geocode) -> ip (provided) -> request IP
    if (!lat || !lon) {
      if (city) {
        // geocode
        const geoKey = `geo:${city.toLowerCase()}`;
        const geo = await cached(geoKey, 60_000, async () => {
          const geourl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`;
          const geoRes = await fetch(geourl, { headers: { 'User-Agent': 'Stormhacks/1.0 (contact: none)' } });
          if (!geoRes.ok) throw new Error('Geocoding failed');
          const body = await geoRes.json();
          if (!body || !body.length) return null;
          return { lat: body[0].lat, lon: body[0].lon, display_name: body[0].display_name };
        });
        if (!geo) return res.status(404).json({ error: 'Location not found (geocoding)' });
        lat = geo.lat;
        lon = geo.lon;
        city = city || geo.display_name;
      } else {
    
        const clientIp = ip || getClientIp(req) || '';
        const ipUrl = clientIp ? `http://ip-api.com/json/${encodeURIComponent(clientIp)}` : `http://ip-api.com/json`;
        const ipData = await cached(`ip:${clientIp}`, 60_000, async () => {
          const r = await fetch(ipUrl);
          if (!r.ok) throw new Error('ip-api failed');
          return r.json();
        });
        if (!ipData || ipData.status !== 'success') return res.status(502).json({ error: 'IP location lookup failed' });
        lat = ipData.lat;
        lon = ipData.lon;
        city = ipData.city || ipData.regionName || ipData.country;
      }
    }


    lat = Number(lat);
    lon = Number(lon);
    if (!isFinite(lat) || !isFinite(lon)) return res.status(400).json({ error: 'Invalid coordinates' });

  
    const weatherKey = `weather:${lat.toFixed(3)}:${lon.toFixed(3)}`;
    const weatherData = await cached(weatherKey, 30_000, async () => {
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}&current_weather=true&timezone=auto&temperature_unit=celsius&windspeed_unit=kmh`;
      const wRes = await fetch(weatherUrl);
      if (!wRes.ok) throw new Error('Weather fetch failed');
      return wRes.json();
    });

    const cw = weatherData.current_weather || weatherData;
    const simplified = cw ? {
      temperature: cw.temperature,
      windspeed: cw.windspeed,
      winddirection: cw.winddirection,
      weathercode: cw.weathercode,
      time: cw.time
    } : null;

    res.json({
      location: { lat, lon, name: city || null },
      weather: simplified,
      raw: weatherData
    });
  } catch (err) {
    console.error('weather error', err);
    if (err.message && err.message.includes('Geocoding failed')) return res.status(502).json({ error: 'Geocoding provider error' });
    if (err.message && err.message.includes('ip-api failed')) return res.status(502).json({ error: 'IP location provider error' });
    res.status(500).json({ error: 'Internal error' });
  }
});

app.post('/api/tts', async (req, res) => {
  try {
    const { text, voice } = req.body || {};
    if (!text || typeof text !== 'string' || !text.trim()) return res.status(400).json({ error: 'Provide `text` in request body' });

    const key = process.env.ELEVENLABS_API_KEY || process.env.ELEVEN_API_KEY;
    if (!key) return res.status(503).json({ error: 'ELEVENLABS_API_KEY not configured on server' });

    const voiceId = voice || process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`;

    const body = {
      text: text,
      
      voice_settings: {
        stability: 0.6,
        similarity_boost: 0.75
      }
    };

    const ttsRes = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
        'xi-api-key': key
      },
      body: JSON.stringify(body)
    });

    if (!ttsRes.ok) {
      const txt = await ttsRes.text();
      console.error('ElevenLabs TTS failed', ttsRes.status, txt);
      return res.status(502).json({ error: 'TTS provider error', status: ttsRes.status, details: txt });
    }

  
    const arr = await ttsRes.arrayBuffer();
    const buffer = Buffer.from(arr);
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (err) {
    console.error('tts error', err);
    res.status(500).json({ error: 'Internal error' });
  }
});


app.post('/api/chat', async (req, res) => {
  try {
    const { message, voice } = req.body || {};
    if (!message || typeof message !== 'string') return res.status(400).json({ error: 'Provide a `message` string in the body' });

   
    let chatbotText = null;
    try {
      const key = process.env.GEMINI_API_KEY || process.env.API_KEY;
      if (key) {
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey: key });
        const prompt = `You are Zenith, a caring and empathetic AI therapist. The user said: "${message}". Provide a concise, supportive response.`;
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        chatbotText = response?.text?.trim();
      }
    } catch (err) {
      console.error('genai error', err);
    }

   
    if (!chatbotText) chatbotText = `I heard: ${message}. I'm here to listen.`;

    
    const elevenKey = process.env.ELEVENLABS_API_KEY || process.env.ELEVEN_API_KEY;
    console.log('/api/chat: elevenKey present?', !!elevenKey);
    if (!elevenKey) {
      return res.json({ text: chatbotText, audio: null, warning: 'ELEVENLABS_API_KEY not configured' });
    }
    const voiceId = voice || process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';
    const ttsUrl = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`;
    const ttsBody = { text: chatbotText, voice_settings: { stability: 0.6, similarity_boost: 0.75 } };
    const ttsRes = await fetch(ttsUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'audio/mpeg', 'xi-api-key': elevenKey }, body: JSON.stringify(ttsBody) });
    if (!ttsRes.ok) {
      const txt = await ttsRes.text();
      console.error('ElevenLabs TTS failed', ttsRes.status, txt && txt.slice ? txt.slice(0,200) : txt);
      return res.status(502).json({ error: 'TTS provider error', details: txt, text: chatbotText });
    }
    const arr = await ttsRes.arrayBuffer();
    const buffer = Buffer.from(arr);
    const base64 = buffer.toString('base64');
    const dataUrl = `data:audio/mpeg;base64,${base64}`;

    res.json({ text: chatbotText, audio: dataUrl });
  } catch (err) {
    console.error('chat error', err);
    res.status(500).json({ error: 'Internal error' });
  }
});


app.get(/.*/, (req, res) => {
  try {
    
    if (req.path && req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }


    const accept = (req.headers['accept'] || '').toLowerCase();
    if (accept.includes('application/json')) {
      return res.status(404).json({ error: 'Not found' });
    }

    const indexPath = path.join(__dirname, '..', 'main.html');
    res.sendFile(indexPath, err => {
      if (err) {
        res.status(500).send('Server error');
      }
    });
  } catch (e) {
    console.error('fallback error', e);
    res.status(500).json({ error: 'Server error' });
  }
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
