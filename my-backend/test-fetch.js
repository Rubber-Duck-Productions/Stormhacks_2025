(async function(){
  try{
    const base = 'http://localhost:3000';
    console.log('Fetching /api/location...');
    const locRes = await fetch(base + '/api/location');
    const loc = await locRes.json();
    console.log('LOCATION:', JSON.stringify(loc, null, 2));

    console.log('\nFetching /api/weather?city=London...');
    const wRes = await fetch(base + '/api/weather?city=London');
    const w = await wRes.json();
    console.log('WEATHER:', JSON.stringify(w, null, 2));
  }catch(e){
    console.error('fetch error', e);
    process.exitCode = 1;
  }
})();
