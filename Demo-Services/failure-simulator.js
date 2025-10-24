const http = require('http');

/**
 * Comprehensive Failure Simulator for Obsidian MROP Demo
 * Demonstrates all resilience patterns with realistic failure scenarios
 */

const services = [
  { name: 'Orders', url: 'http://localhost:4001', endpoints: ['/orders/fail', '/orders/slow', '/orders/overload', '/orders/recover'] },
  { name: 'Booking', url: 'http://localhost:4002', endpoints: ['/bookings/fail', '/bookings/slow', '/bookings/overload', '/bookings/recover'] },
  { name: 'Payments', url: 'http://localhost:4003', endpoints: ['/payments/fail', '/payments/slow', '/payments/overload', '/payments/recover'] }
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

function makeRequest(url, method = 'POST') {
  return new Promise((resolve, reject) => {
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
          success: res.statusCode >= 200 && res.statusCode < 300
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

async function simulateFailure(service, failureType) {
  try {
    const endpoint = service.endpoints.find(ep => ep.includes(failureType));
    const url = `${service.url}${endpoint}`;
    
    console.log(`${colors.yellow}🔄 Simulating ${failureType} for ${service.name}...${colors.reset}`);
    
    const result = await makeRequest(url);
    
    if (result.success) {
      console.log(`${colors.green}✅ ${service.name} ${failureType} simulation successful${colors.reset}`);
      console.log(`   Response: ${result.data.message || 'Success'}`);
    } else {
      console.log(`${colors.red}❌ ${service.name} ${failureType} simulation failed${colors.reset}`);
      console.log(`   Status: ${result.status}`);
    }
    
    return result;
  } catch (error) {
    console.log(`${colors.red}❌ ${service.name} ${failureType} simulation error: ${error.message}${colors.reset}`);
    return { success: false, error: error.message };
  }
}

async function testServiceHealth(service) {
  try {
    const result = await makeRequest(`${service.url}/health`, 'GET');
    const status = result.success ? 'HEALTHY' : 'UNHEALTHY';
    const color = result.success ? colors.green : colors.red;
    
    console.log(`${color}📊 ${service.name} Status: ${status}${colors.reset}`);
    if (result.data.responseTime) {
      console.log(`   Response Time: ${result.data.responseTime}ms`);
    }
    if (result.data.requestCount) {
      console.log(`   Request Count: ${result.data.requestCount}`);
    }
    
    return result;
  } catch (error) {
    console.log(`${colors.red}❌ ${service.name} Health Check Failed: ${error.message}${colors.reset}`);
    return { success: false, error: error.message };
  }
}

async function runFailureSimulation() {
  console.log(`${colors.cyan}${colors.bright}🚀 OBSIDIAN MROP - FAILURE SIMULATION DEMO${colors.reset}`);
  console.log(`${colors.cyan}============================================================${colors.reset}`);
  console.log();

  // Step 1: Check initial health
  console.log(`${colors.blue}📋 STEP 1: Initial Health Check${colors.reset}`);
  console.log('------------------------------------------------------------');
  
  for (const service of services) {
    await testServiceHealth(service);
  }
  
  console.log();
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Step 2: Simulate failures
  console.log(`${colors.blue}📋 STEP 2: Simulating Failures${colors.reset}`);
  console.log('------------------------------------------------------------');
  
  // Simulate different failure types
  const failureTypes = ['fail', 'slow', 'overload'];
  
  for (const failureType of failureTypes) {
    console.log(`\n${colors.magenta}🔥 Simulating ${failureType.toUpperCase()} across all services...${colors.reset}`);
    
    for (const service of services) {
      await simulateFailure(service, failureType);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Test health after each failure type
    console.log(`\n${colors.yellow}📊 Health Check After ${failureType.toUpperCase()}:${colors.reset}`);
    for (const service of services) {
      await testServiceHealth(service);
    }
    
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  // Step 3: Recovery simulation
  console.log(`\n${colors.blue}📋 STEP 3: Recovery Simulation${colors.reset}`);
  console.log('------------------------------------------------------------');
  
  console.log(`${colors.green}🔄 Recovering all services...${colors.reset}`);
  
  for (const service of services) {
    await simulateFailure(service, 'recover');
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Final health check
  console.log(`\n${colors.yellow}📊 Final Health Check:${colors.reset}`);
  for (const service of services) {
    await testServiceHealth(service);
  }

  console.log(`\n${colors.cyan}============================================================${colors.reset}`);
  console.log(`${colors.green}✅ FAILURE SIMULATION COMPLETE!${colors.reset}`);
  console.log(`${colors.cyan}============================================================${colors.reset}`);
  console.log();
  console.log(`${colors.bright}Next Steps:${colors.reset}`);
  console.log('1. Open Obsidian Dashboard: http://localhost:8080');
  console.log('2. Watch circuit breakers open/close in real-time');
  console.log('3. Observe rate limiting and load balancing');
  console.log('4. Check alerts and recommendations');
  console.log();
}

// Interactive mode
async function interactiveMode() {
  console.log(`${colors.cyan}${colors.bright}🎮 INTERACTIVE FAILURE SIMULATOR${colors.reset}`);
  console.log(`${colors.cyan}============================================================${colors.reset}`);
  console.log();
  console.log('Available Commands:');
  console.log('1. fail <service> - Simulate failures');
  console.log('2. slow <service> - Simulate slow responses');
  console.log('3. overload <service> - Simulate overload');
  console.log('4. recover <service> - Recover service');
  console.log('5. health - Check all services');
  console.log('6. auto - Run automatic simulation');
  console.log('7. quit - Exit');
  console.log();

  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (query) => new Promise(resolve => rl.question(query, resolve));

  while (true) {
    const input = await question(`${colors.blue}obsidian> ${colors.reset}`);
    const [command, serviceName] = input.trim().split(' ');

    switch (command.toLowerCase()) {
      case 'fail':
        const failService = services.find(s => s.name.toLowerCase() === serviceName?.toLowerCase());
        if (failService) {
          await simulateFailure(failService, 'fail');
        } else {
          console.log(`${colors.red}Service not found. Available: ${services.map(s => s.name).join(', ')}${colors.reset}`);
        }
        break;

      case 'slow':
        const slowService = services.find(s => s.name.toLowerCase() === serviceName?.toLowerCase());
        if (slowService) {
          await simulateFailure(slowService, 'slow');
        } else {
          console.log(`${colors.red}Service not found. Available: ${services.map(s => s.name).join(', ')}${colors.reset}`);
        }
        break;

      case 'overload':
        const overloadService = services.find(s => s.name.toLowerCase() === serviceName?.toLowerCase());
        if (overloadService) {
          await simulateFailure(overloadService, 'overload');
        } else {
          console.log(`${colors.red}Service not found. Available: ${services.map(s => s.name).join(', ')}${colors.reset}`);
        }
        break;

      case 'recover':
        const recoverService = services.find(s => s.name.toLowerCase() === serviceName?.toLowerCase());
        if (recoverService) {
          await simulateFailure(recoverService, 'recover');
        } else {
          console.log(`${colors.red}Service not found. Available: ${services.map(s => s.name).join(', ')}${colors.reset}`);
        }
        break;

      case 'health':
        console.log(`${colors.yellow}📊 Health Check:${colors.reset}`);
        for (const service of services) {
          await testServiceHealth(service);
        }
        break;

      case 'auto':
        await runFailureSimulation();
        break;

      case 'quit':
      case 'exit':
        console.log(`${colors.green}👋 Goodbye!${colors.reset}`);
        rl.close();
        process.exit(0);

      default:
        console.log(`${colors.red}Unknown command. Type 'quit' to exit.${colors.reset}`);
    }
  }
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--interactive') || args.includes('-i')) {
    interactiveMode();
  } else {
    runFailureSimulation();
  }
}

module.exports = {
  simulateFailure,
  testServiceHealth,
  runFailureSimulation,
  services
};
