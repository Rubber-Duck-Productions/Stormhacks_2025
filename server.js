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


app.use(express.static(path.join(__dirname, '..')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Lightweight API index
app.get('/api', (req, res) => {
  res.json({
    endpoints: {
      health: '/api/health',
      location: '/api/location?ip=<optional-ip>',
      weather: '/api/weather?city=<city name> OR &lat=<lat>&lon=<lon>'
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
    let { city, lat, lon } = req.query;

    if (!lat || !lon) {
      if (!city) return res.status(400).json({ error: 'Provide city or lat & lon' });
      // geocode using Nominatim
      const geourl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`;
      const geoRes = await fetch(geourl, { headers: { 'User-Agent': 'Stormhacks/1.0 (contact: none)' } });
      if (!geoRes.ok) return res.status(502).json({ error: 'Geocoding failed' });
      const geo = await geoRes.json();
      if (!geo || !geo.length) return res.status(404).json({ error: 'Location not found' });
      lat = geo[0].lat;
      lon = geo[0].lon;
    }

    // fetch weather from Open-Meteo
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}&current_weather=true`;
    const wRes = await fetch(weatherUrl);
    if (!wRes.ok) return res.status(502).json({ error: 'Weather fetch failed' });
    const weather = await wRes.json();

    res.json({ location: { lat, lon, city: city || null }, weather: weather.current_weather || weather });
  } catch (err) {
    console.error('weather error', err);
    res.status(500).json({ error: 'Internal error' });
  }
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
