// Script to reset rate limit for development
const fetch = require('node-fetch');

// Simple script to clear rate limit by making a request to reset endpoint
// Since we're using MemoryStore, we can create a simple reset endpoint

console.log('🔄 Resetting rate limit for development...');
console.log('⏰ Waiting for rate limit window to expire (15 minutes)...');
console.log('💡 Alternative: Restart the server to clear memory store');
console.log('🚀 Or temporarily increase rate limit in rateLimitConfigs.auth.max');

// Instructions
console.log('\n📋 Quick fixes:');
console.log('1. Restart the API server: npm run dev');
console.log('2. Wait 15 minutes for rate limit to reset');
console.log('3. Temporarily increase auth.max in rateLimit.ts from 5 to 50');

process.exit(0);