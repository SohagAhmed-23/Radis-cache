const express = require('express');
const axios = require('axios');
const path = require('path');
const redisClient = require('./radis'); // triggers the connection
require('dotenv').config();

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.resolve(__dirname, 'public')));

async function getWeatherData() {
  const API_KEY = process.env.WEATHER_API_KEY;
  const cacheKey = 'weather:bangladesh';

  const cached = await redisClient.get(cacheKey);
  if (cached) {
    console.log('💾 Serving weather from Redis cache');
    return JSON.parse(cached);
  }

  const weatherData = await axios.get(
    `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=Bangladesh&aqi=no`
  );

  await redisClient.set(cacheKey, JSON.stringify(weatherData.data), { EX: 3600 });
  console.log('🌐 Fetched weather from API and cached');

  return weatherData.data;
}

app.get('/', async (req, res) => {
  try {
    const data = await getWeatherData();
    res.render("home", { weather: data });
  } catch (error) {
    console.error("Error fetching weather:", error.message);
    res.status(500).json({ error: "Failed to fetch weather data" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌤️ Weather service running on port ${PORT}`);
});
