const http = require('http');

/**
 * Functional vs Faulty Microservice Demo
 * Demonstrates resilience patterns with one working and one failing service
 */

const services = [
  { 
    name: 'Orders', 
    url: 'http://localhost:4001', 
    status: 'functional',
    description: 'Fully operational orders service'
  },
  { 
    name: 'Booking', 
    url: 'http://localhost:4002', 
    status: 'faulty',
    description: 'Failing booking service with intermittent issues'
  },
  { 
    name: 'Payments', 
    url: 'http://localhost:4003', 
    status: 'functional',
    description: 'Stable payment processing service'
  }
];

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: JSON.parse(data || '{}'),
          success: res.statusCode >= 200 && res.statusCode < 300,
          responseTime: Date.now() - startTime
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function setupFunctionalFaultyScenario() {
  console.log(`${colors.cyan}${colors.bright}🎯 FUNCTIONAL vs FAULTY MICROSERVICE DEMO${colors.reset}`);
  console.log(`${colors.cyan}============================================================${colors.reset}`);
  console.log();

  // Step 1: Set up functional services
  console.log(`${colors.green}✅ Setting up FUNCTIONAL services...${colors.reset}`);
  console.log('------------------------------------------------------------');
  
  try {
    // Make Orders service functional
    await makeRequest('http://localhost:4001/orders/recover', 'POST');
    console.log(`${colors.green}✅ Orders Service: FUNCTIONAL${colors.reset}`);
    
    // Make Payments service functional  
    await makeRequest('http://localhost:4003/payments/recover', 'POST');
    console.log(`${colors.green}✅ Payments Service: FUNCTIONAL${colors.reset}`);
    
  } catch (error) {
    console.log(`${colors.yellow}⚠️  Services not ready yet, will retry...${colors.reset}`);
  }

  // Step 2: Set up faulty service
  console.log(`\n${colors.red}❌ Setting up FAULTY service...${colors.reset}`);
  console.log('------------------------------------------------------------');
  
  try {
    // Make Booking service faulty
    await makeRequest('http://localhost:4002/bookings/fail', 'POST');
    console.log(`${colors.red}❌ Booking Service: FAULTY${colors.reset}`);
    
  } catch (error) {
    console.log(`${colors.yellow}⚠️  Booking service not ready yet, will retry...${colors.reset}`);
  }

  console.log();
  await new Promise(resolve => setTimeout(resolve, 2000));
}

async function testServiceHealth() {
  console.log(`${colors.blue}📊 Testing Service Health${colors.reset}`);
  console.log('------------------------------------------------------------');
  
  const results = [];
  
  for (const service of services) {
    try {
      const result = await makeRequest(`${service.url}/health`, 'GET');
      const status = result.success ? 'HEALTHY' : 'UNHEALTHY';
      const color = result.success ? colors.green : colors.red;
      const icon = result.success ? '✅' : '❌';
      
      console.log(`${icon} ${color}${service.name}: ${status}${colors.reset}`);
      console.log(`   Status: ${service.status.toUpperCase()}`);
      console.log(`   Description: ${service.description}`);
      
      if (result.data.responseTime) {
        console.log(`   Response Time: ${result.data.responseTime}ms`);
      }
      if (result.data.requestCount) {
        console.log(`   Request Count: ${result.data.requestCount}`);
      }
      
      results.push({
        service: service.name,
        status: result.success ? 'healthy' : 'unhealthy',
        responseTime: result.data.responseTime || 0,
        isFunctional: service.status === 'functional'
      });
      
    } catch (error) {
      console.log(`${colors.red}❌ ${service.name}: CONNECTION FAILED${colors.reset}`);
      console.log(`   Error: ${error.message}`);
      results.push({
        service: service.name,
        status: 'connection_failed',
        responseTime: 0,
        isFunctional: service.status === 'functional'
      });
    }
    
    console.log();
  }
  
  return results;
}

async function demonstrateResiliencePatterns() {
  console.log(`${colors.magenta}🛡️  DEMONSTRATING RESILIENCE PATTERNS${colors.reset}`);
  console.log('------------------------------------------------------------');
  
  // Test functional services
  console.log(`${colors.green}📈 Testing FUNCTIONAL Services:${colors.reset}`);
  
  try {
    const ordersResult = await makeRequest('http://localhost:4001/api/orders', 'GET');
    if (ordersResult.success) {
      console.log(`${colors.green}✅ Orders API: Working perfectly${colors.reset}`);
      console.log(`   Response Time: ${ordersResult.responseTime}ms`);
      console.log(`   Data: ${ordersResult.data.total || 0} orders`);
    }
  } catch (error) {
    console.log(`${colors.red}❌ Orders API: Failed - ${error.message}${colors.reset}`);
  }
  
  try {
    const paymentsResult = await makeRequest('http://localhost:4003/api/payments', 'GET');
    if (paymentsResult.success) {
      console.log(`${colors.green}✅ Payments API: Working perfectly${colors.reset}`);
      console.log(`   Response Time: ${paymentsResult.responseTime}ms`);
      console.log(`   Data: ${paymentsResult.data.total || 0} payments`);
    }
  } catch (error) {
    console.log(`${colors.red}❌ Payments API: Failed - ${error.message}${colors.reset}`);
  }
  
  console.log();
  
  // Test faulty service
  console.log(`${colors.red}📉 Testing FAULTY Service:${colors.reset}`);
  
  try {
    const bookingResult = await makeRequest('http://localhost:4002/api/bookings', 'GET');
    if (bookingResult.success) {
      console.log(`${colors.yellow}⚠️  Booking API: Unexpectedly working${colors.reset}`);
      console.log(`   Response Time: ${bookingResult.responseTime}ms`);
    } else {
      console.log(`${colors.red}❌ Booking API: Failed as expected${colors.reset}`);
      console.log(`   Status: ${bookingResult.status}`);
      console.log(`   Error: ${bookingResult.data.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.log(`${colors.red}❌ Booking API: Connection failed - ${error.message}${colors.reset}`);
  }
  
  console.log();
}

async function simulateTrafficLoad() {
  console.log(`${colors.blue}🚀 Simulating Traffic Load${colors.reset}`);
  console.log('------------------------------------------------------------');
  
  const requests = 20;
  const results = {
    orders: { success: 0, failed: 0, totalTime: 0 },
    booking: { success: 0, failed: 0, totalTime: 0 },
    payments: { success: 0, failed: 0, totalTime: 0 }
  };
  
  console.log(`Sending ${requests} requests to each service...`);
  
  // Test Orders (Functional)
  console.log(`\n${colors.green}📊 Testing Orders Service (Functional):${colors.reset}`);
  for (let i = 0; i < requests; i++) {
    try {
      const result = await makeRequest('http://localhost:4001/api/orders', 'GET');
      
      if (result.success) {
        results.orders.success++;
        results.orders.totalTime += result.responseTime;
        console.log(`${colors.green}✅ Request ${i + 1}: Success (${result.responseTime}ms)${colors.reset}`);
      } else {
        results.orders.failed++;
        console.log(`${colors.red}❌ Request ${i + 1}: Failed (${result.status})${colors.reset}`);
      }
    } catch (error) {
      results.orders.failed++;
      console.log(`${colors.red}❌ Request ${i + 1}: Error - ${error.message}${colors.reset}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Test Booking (Faulty)
  console.log(`\n${colors.red}📊 Testing Booking Service (Faulty):${colors.reset}`);
  for (let i = 0; i < requests; i++) {
    try {
      const result = await makeRequest('http://localhost:4002/api/bookings', 'GET');
      
      if (result.success) {
        results.booking.success++;
        results.booking.totalTime += result.responseTime;
        console.log(`${colors.yellow}⚠️  Request ${i + 1}: Unexpected success (${result.responseTime}ms)${colors.reset}`);
      } else {
        results.booking.failed++;
        console.log(`${colors.red}❌ Request ${i + 1}: Failed as expected (${result.status})${colors.reset}`);
      }
    } catch (error) {
      results.booking.failed++;
      console.log(`${colors.red}❌ Request ${i + 1}: Error - ${error.message}${colors.reset}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Test Payments (Functional)
  console.log(`\n${colors.green}📊 Testing Payments Service (Functional):${colors.reset}`);
  for (let i = 0; i < requests; i++) {
    try {
      const result = await makeRequest('http://localhost:4003/api/payments', 'GET');
      
      if (result.success) {
        results.payments.success++;
        results.payments.totalTime += result.responseTime;
        console.log(`${colors.green}✅ Request ${i + 1}: Success (${result.responseTime}ms)${colors.reset}`);
      } else {
        results.payments.failed++;
        console.log(`${colors.red}❌ Request ${i + 1}: Failed (${result.status})${colors.reset}`);
      }
    } catch (error) {
      results.payments.failed++;
      console.log(`${colors.red}❌ Request ${i + 1}: Error - ${error.message}${colors.reset}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Summary
  console.log(`\n${colors.cyan}📈 TRAFFIC LOAD TEST RESULTS:${colors.reset}`);
  console.log('============================================================');
  
  for (const [service, stats] of Object.entries(results)) {
    const total = stats.success + stats.failed;
    const successRate = total > 0 ? ((stats.success / total) * 100).toFixed(1) : 0;
    const avgTime = stats.success > 0 ? (stats.totalTime / stats.success).toFixed(0) : 0;
    
    const color = successRate > 80 ? colors.green : successRate > 50 ? colors.yellow : colors.red;
    const icon = successRate > 80 ? '✅' : successRate > 50 ? '⚠️' : '❌';
    
    console.log(`${icon} ${color}${service.toUpperCase()}: ${successRate}% success rate${colors.reset}`);
    console.log(`   Success: ${stats.success}/${total} requests`);
    console.log(`   Average Response Time: ${avgTime}ms`);
    console.log();
  }
}

async function demonstrateCircuitBreaker() {
  console.log(`${colors.magenta}⚡ DEMONSTRATING CIRCUIT BREAKER PATTERN${colors.reset}`);
  console.log('------------------------------------------------------------');
  
  console.log(`${colors.blue}🔄 Circuit Breaker should open for faulty service...${colors.reset}`);
  console.log(`${colors.green}✅ Circuit Breaker should stay closed for functional services...${colors.reset}`);
  
  console.log(`\n${colors.yellow}📊 Expected Behavior:${colors.reset}`);
  console.log('• Orders Service: Circuit closed (healthy)');
  console.log('• Booking Service: Circuit open (failing)');
  console.log('• Payments Service: Circuit closed (healthy)');
  
  console.log(`\n${colors.cyan}💡 Check Obsidian Dashboard to see circuit breaker states!${colors.reset}`);
  console.log('Dashboard URL: http://localhost:8080');
}

async function runCompleteDemo() {
  console.log(`${colors.cyan}${colors.bright}🎯 FUNCTIONAL vs FAULTY MICROSERVICE DEMO${colors.reset}`);
  console.log(`${colors.cyan}============================================================${colors.reset}`);
  console.log();
  
  // Step 1: Setup scenario
  await setupFunctionalFaultyScenario();
  
  // Step 2: Test health
  await testServiceHealth();
  
  // Step 3: Demonstrate resilience
  await demonstrateResiliencePatterns();
  
  // Step 4: Simulate traffic
  await simulateTrafficLoad();
  
  // Step 5: Explain circuit breaker
  await demonstrateCircuitBreaker();
  
  console.log(`${colors.cyan}============================================================${colors.reset}`);
  console.log(`${colors.green}✅ DEMO COMPLETE!${colors.reset}`);
  console.log(`${colors.cyan}============================================================${colors.reset}`);
  console.log();
  console.log(`${colors.bright}Next Steps:${colors.reset}`);
  console.log('1. Open Obsidian Dashboard: http://localhost:8080');
  console.log('2. Watch circuit breakers in action');
  console.log('3. Observe real-time metrics');
  console.log('4. Check alerts and recommendations');
  console.log();
}

// Run demo if called directly
if (require.main === module) {
  runCompleteDemo().catch(console.error);
}

module.exports = {
  setupFunctionalFaultyScenario,
  testServiceHealth,
  demonstrateResiliencePatterns,
  simulateTrafficLoad,
  demonstrateCircuitBreaker,
  runCompleteDemo
};
