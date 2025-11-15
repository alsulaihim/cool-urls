/**
 * Create MyFatoorah Subscription Plans
 *
 * NOTE: MyFatoorah doesn't have a direct API for creating subscription plans like Stripe/PayPal.
 * Plans must be created manually through the MyFatoorah dashboard:
 *
 * 1. Login to MyFatoorah: https://portal.myfatoorah.com/
 * 2. Go to "Recurring Payments" section
 * 3. Create a new plan for each tier
 * 4. Copy the Plan IDs and update lib/pricing.ts
 *
 * This script provides a template of what plans you need to create.
 */

import { PRICING_PLANS } from '../lib/pricing';

console.log('🔧 MyFatoorah Subscription Plans Setup Guide\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('📋 Create these plans in your MyFatoorah dashboard:\n');

const plans = [
  { id: 'starter', ...PRICING_PLANS.starter },
  { id: 'growth', ...PRICING_PLANS.growth },
  { id: 'business', ...PRICING_PLANS.business },
  { id: 'enterprise', ...PRICING_PLANS.enterprise },
  { id: 'scale', ...PRICING_PLANS.scale },
  { id: 'premium', ...PRICING_PLANS.premium },
];

plans.forEach((plan, index) => {
  console.log(`${index + 1}. ${plan.name} Plan`);
  console.log(`   Price: $${plan.price}/month`);
  console.log(`   Billing Cycle: Monthly (30 days)`);
  console.log(`   Currency: USD`);
  console.log(`   Status: Active`);
  console.log(`   Description: ${plan.description}`);
  console.log('');
});

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('📝 After creating plans, update lib/pricing.ts:\n');

plans.forEach(plan => {
  console.log(`  ${plan.id}: {`);
  console.log(`    ...existing fields,`);
  console.log(`    myFatoorahPlanId: 'YOUR_PLAN_ID_HERE',`);
  console.log(`  },\n`);
});

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('🔗 Resources:');
console.log('   - MyFatoorah Portal: https://portal.myfatoorah.com/');
console.log('   - Documentation: https://docs.myfatoorah.com/docs/recurring-payments');
console.log('   - Test Mode: Use test credentials for testing first\n');

console.log('✅ Once plans are created and IDs are updated, enable MyFatoorah in Admin Settings');
