import { init } from '@instantdb/admin';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const APP_ID = process.env.NEXT_PUBLIC_INSTANT_APP_ID!;
const ADMIN_TOKEN = process.env.INSTANT_ADMIN_TOKEN!;

if (!APP_ID || !ADMIN_TOKEN) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const db = init({ appId: APP_ID, adminToken: ADMIN_TOKEN });

async function countSubscriptions() {
  try {
    console.log('Fetching subscriptions from database...\n');

    const data = await db.query({
      subscriptions: {},
    });

    const subscriptions = data?.subscriptions || [];

    console.log(`Total Subscriptions: ${subscriptions.length}\n`);

    // Count by status
    const statusCounts: Record<string, number> = {};
    const providerCounts: Record<string, number> = {};
    const planCounts: Record<string, number> = {};

    subscriptions.forEach((sub: any) => {
      // Count by status
      statusCounts[sub.status] = (statusCounts[sub.status] || 0) + 1;

      // Count by provider
      providerCounts[sub.provider] = (providerCounts[sub.provider] || 0) + 1;

      // Count by plan
      planCounts[sub.planId] = (planCounts[sub.planId] || 0) + 1;
    });

    console.log('Breakdown by Status:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });

    console.log('\nBreakdown by Provider:');
    Object.entries(providerCounts).forEach(([provider, count]) => {
      console.log(`  ${provider}: ${count}`);
    });

    console.log('\nBreakdown by Plan:');
    Object.entries(planCounts).forEach(([plan, count]) => {
      console.log(`  ${plan}: ${count}`);
    });

    console.log('\nDetailed Subscription List:');
    console.log('─'.repeat(80));

    subscriptions.forEach((sub: any, index: number) => {
      const periodEnd = new Date(sub.currentPeriodEnd).toLocaleDateString();
      console.log(`${index + 1}. User ID: ${sub.userId}`);
      console.log(`   Plan: ${sub.planId} | Provider: ${sub.provider}`);
      console.log(`   Status: ${sub.status} | Period End: ${periodEnd}`);
      console.log(`   Clicks: ${sub.clicksUsed}/${sub.clicksLimit}`);
      if (sub.cancelledAt) {
        console.log(`   Cancelled: ${new Date(sub.cancelledAt).toLocaleDateString()}`);
      }
      console.log('');
    });

  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    process.exit(1);
  }
}

countSubscriptions();
