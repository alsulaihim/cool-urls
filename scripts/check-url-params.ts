import { init } from '@instantdb/admin';

// Initialize InstantDB with admin token
const db = init({
  appId: process.env.NEXT_PUBLIC_INSTANT_APP_ID!,
  adminToken: process.env.INSTANT_APP_ADMIN_TOKEN!,
});

async function checkUrlParams() {
  console.log('Checking URL parameters in database...\n');

  // Query all URLs
  const result = await db.query({
    urls: {},
  });

  // Find netflix-go link
  const netflixLink = result.urls.find((url: any) => url.shortCode === 'netflix-go');

  if (!netflixLink) {
    console.log('netflix-go link not found!');
    return;
  }

  console.log('Found netflix-go link:');
  console.log('Short Code:', netflixLink.shortCode);
  console.log('Destination:', netflixLink.url);
  console.log('Click Count:', netflixLink.clickCount);
  console.log('\n--- Analytics Data ---');

  // Parse analytics data
  let analyticsArray = [];
  try {
    if (netflixLink.analyticsData) {
      if (typeof netflixLink.analyticsData === 'string') {
        analyticsArray = JSON.parse(netflixLink.analyticsData);
      } else {
        analyticsArray = netflixLink.analyticsData;
      }
    }
  } catch (error) {
    console.log('Error parsing analytics:', error);
  }

  console.log('Total clicks in analytics:', analyticsArray.length);

  // Check for clicks with urlParams
  const clicksWithParams = analyticsArray.filter((click: any) => click.urlParams);
  console.log('Clicks with URL parameters:', clicksWithParams.length);

  if (clicksWithParams.length > 0) {
    console.log('\n--- Clicks with Parameters ---');
    clicksWithParams.forEach((click: any, index: number) => {
      console.log(`\nClick #${index + 1}:`);
      console.log('  Timestamp:', new Date(click.timestamp).toISOString());
      console.log('  URL Parameters:', JSON.stringify(click.urlParams, null, 2));
      console.log('  Device:', click.deviceType);
      console.log('  Browser:', click.browser);
      console.log('  Country:', click.country);
    });
  } else {
    console.log('\n⚠️  No clicks with URL parameters found!');
    console.log('\nShowing last 3 clicks to verify structure:');
    const recentClicks = analyticsArray.slice(-3);
    recentClicks.forEach((click: any, index: number) => {
      console.log(`\nClick #${analyticsArray.length - 2 + index}:`);
      console.log('  Timestamp:', new Date(click.timestamp).toISOString());
      console.log('  Has urlParams field?', 'urlParams' in click);
      console.log('  urlParams value:', click.urlParams);
      console.log('  Device:', click.deviceType);
      console.log('  Browser:', click.browser);
    });
  }
}

checkUrlParams().catch(console.error);
