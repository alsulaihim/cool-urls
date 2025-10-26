import { init } from '@instantdb/admin';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const db = init({
  appId: process.env.NEXT_PUBLIC_INSTANT_APP_ID!,
  adminToken: process.env.INSTANT_ADMIN_TOKEN!,
});

// Major cities around the world with their coordinates
const globalCities = [
  { city: 'New York', country: 'United States', region: 'New York', lat: 40.7128, lon: -74.0060 },
  { city: 'London', country: 'United Kingdom', region: 'England', lat: 51.5074, lon: -0.1278 },
  { city: 'Tokyo', country: 'Japan', region: 'Kanto', lat: 35.6762, lon: 139.6503 },
  { city: 'Paris', country: 'France', region: 'Île-de-France', lat: 48.8566, lon: 2.3522 },
  { city: 'Sydney', country: 'Australia', region: 'New South Wales', lat: -33.8688, lon: 151.2093 },
  { city: 'Dubai', country: 'United Arab Emirates', region: 'Dubai', lat: 25.2048, lon: 55.2708 },
  { city: 'Singapore', country: 'Singapore', region: 'Singapore', lat: 1.3521, lon: 103.8198 },
  { city: 'São Paulo', country: 'Brazil', region: 'São Paulo', lat: -23.5505, lon: -46.6333 },
  { city: 'Mumbai', country: 'India', region: 'Maharashtra', lat: 19.0760, lon: 72.8777 },
  { city: 'Berlin', country: 'Germany', region: 'Berlin', lat: 52.5200, lon: 13.4050 },
  { city: 'Toronto', country: 'Canada', region: 'Ontario', lat: 43.6532, lon: -79.3832 },
  { city: 'Mexico City', country: 'Mexico', region: 'CDMX', lat: 19.4326, lon: -99.1332 },
  { city: 'Cairo', country: 'Egypt', region: 'Cairo', lat: 30.0444, lon: 31.2357 },
  { city: 'Moscow', country: 'Russia', region: 'Moscow', lat: 55.7558, lon: 37.6173 },
  { city: 'Beijing', country: 'China', region: 'Beijing', lat: 39.9042, lon: 116.4074 },
  { city: 'Los Angeles', country: 'United States', region: 'California', lat: 34.0522, lon: -118.2437 },
  { city: 'Istanbul', country: 'Turkey', region: 'Istanbul', lat: 41.0082, lon: 28.9784 },
  { city: 'Bangkok', country: 'Thailand', region: 'Bangkok', lat: 13.7563, lon: 100.5018 },
  { city: 'Seoul', country: 'South Korea', region: 'Seoul', lat: 37.5665, lon: 126.9780 },
  { city: 'Amsterdam', country: 'Netherlands', region: 'North Holland', lat: 52.3676, lon: 4.9041 },
  { city: 'Hong Kong', country: 'Hong Kong', region: 'Hong Kong', lat: 22.3193, lon: 114.1694 },
  { city: 'Madrid', country: 'Spain', region: 'Madrid', lat: 40.4168, lon: -3.7038 },
  { city: 'Rome', country: 'Italy', region: 'Lazio', lat: 41.9028, lon: 12.4964 },
  { city: 'Chicago', country: 'United States', region: 'Illinois', lat: 41.8781, lon: -87.6298 },
  { city: 'Buenos Aires', country: 'Argentina', region: 'Buenos Aires', lat: -34.6037, lon: -58.3816 },
];

const devices = ['desktop', 'mobile', 'tablet'];
const browsers = [
  { name: 'Chrome', version: '120.0.0.0' },
  { name: 'Safari', version: '17.2' },
  { name: 'Firefox', version: '121.0' },
  { name: 'Edge', version: '120.0.0.0' },
  { name: 'Opera', version: '106.0.0.0' },
];
const operatingSystems = [
  { name: 'Windows', version: '10' },
  { name: 'macOS', version: '14.2' },
  { name: 'iOS', version: '17.2' },
  { name: 'Android', version: '14' },
  { name: 'Linux', version: 'Ubuntu 22.04' },
];

function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function generateRandomTimestamp(daysAgo: number): number {
  const now = Date.now();
  const maxAge = daysAgo * 24 * 60 * 60 * 1000;
  return now - Math.floor(Math.random() * maxAge);
}

async function generateSampleLink() {
  console.log('🚀 Generating sample link with 1000 clicks...');

  // Create the sample URL
  const urlId = uuidv4();
  const shortCode = 'demo-' + Math.random().toString(36).substring(2, 8);

  console.log('📍 Creating URL:', shortCode);

  // Generate 1000 clicks
  const clicks = [];
  for (let i = 0; i < 1000; i++) {
    const city = getRandomItem(globalCities);
    const browser = getRandomItem(browsers);
    const os = getRandomItem(operatingSystems);
    const device = getRandomItem(devices);

    clicks.push({
      id: uuidv4(),
      timestamp: generateRandomTimestamp(30), // Spread over last 30 days
      country: city.country,
      city: city.city,
      region: city.region,
      latitude: city.lat + (Math.random() - 0.5) * 0.1, // Add small variance
      longitude: city.lon + (Math.random() - 0.5) * 0.1,
      deviceType: device,
      os: os.name,
      osVersion: os.version,
      browser: browser.name,
      browserVersion: browser.version,
      referrer: Math.random() > 0.5 ? 'https://twitter.com' : 'https://facebook.com',
      userAgent: `Mozilla/5.0 (compatible; SampleBot/1.0)`,
      ipHash: Math.random().toString(36).substring(2, 18),
    });

    if ((i + 1) % 100 === 0) {
      console.log(`  Generated ${i + 1}/1000 clicks...`);
    }
  }

  console.log('💾 Saving to database...');

  try {
    // Get the current user (you need to be signed in)
    const userId = 'a86e99b6-5928-495d-b1f3-2ea695ac20a7'; // Replace with your actual user ID

    await db.transact([
      db.tx.urls[urlId].update({
        originalUrl: 'https://example.com/sample-popular-content',
        shortCode: shortCode,
        prefix: 'demo',
        createdAt: Date.now() - (30 * 24 * 60 * 60 * 1000), // Created 30 days ago
        clicks: 1000,
        userId: userId,
        analyticsData: JSON.stringify(clicks),
      }),
    ]);

    console.log('✅ Sample link created successfully!');
    console.log(`📊 Short code: ${shortCode}`);
    console.log(`🌍 Clicks from ${globalCities.length} different cities`);
    console.log(`📱 Device breakdown: ${devices.join(', ')}`);
    console.log(`🌐 Browsers: ${browsers.map(b => b.name).join(', ')}`);
    console.log('\n🎉 Done! Check your dashboard to see the analytics.');
  } catch (error) {
    console.error('❌ Error creating sample link:', error);
  }
}

generateSampleLink();
