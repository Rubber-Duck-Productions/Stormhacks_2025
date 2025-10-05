# my-backend (quick test)

Start the backend and test the weather & location endpoints.

Requirements

- Node 18+ (this project used Node 22 during development)

Start server (PowerShell):

```powershell
cd C:\Users\yadav\Desktop\GitHub\Stormhacks_2025\my-backend
node server.js
```

Quick tests (PowerShell):

```powershell
# health
Invoke-RestMethod -UseBasicParsing 'http://localhost:3000/api/health' | ConvertTo-Json -Depth 5

# location (ip-based)
Invoke-RestMethod -UseBasicParsing 'http://localhost:3000/api/location' | ConvertTo-Json -Depth 5

# weather by city
Invoke-RestMethod -UseBasicParsing 'http://localhost:3000/api/weather?city=London' | ConvertTo-Json -Depth 5

# weather by coords
Invoke-RestMethod -UseBasicParsing 'http://localhost:3000/api/weather?lat=51.5&lon=-0.12' | ConvertTo-Json -Depth 5
```

Or open the UI at `http://localhost:3000/weather-test.html` in your browser.

Notes

- /api/weather supports: `city`, `lat`+`lon`, `ip`, or `useIp=true` to auto-resolve by the request IP.
- Uses Open-Meteo (no API key) and Nominatim for geocoding.

Environment
------------
Create a `.env` file in this folder (copy from `.env.example`) to set `PORT` or other variables. `.env` is ignored by git.

