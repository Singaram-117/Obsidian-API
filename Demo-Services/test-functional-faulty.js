const http = require('http');

/**
 * Simple test script to verify functional-faulty demo works
 */

function makeRequest(url, method = 'GET') {
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

async function testServices() {
  console.log('🧪 Testing Functional vs Faulty Demo...\n');
  
  const services = [
    { name: 'Orders', url: 'http://localhost:4001', expected: 'functional' },
    { name: 'Booking', url: 'http://localhost:4002', expected: 'faulty' },
    { name: 'Payments', url: 'http://localhost:4003', expected: 'functional' }
  ];
  
  for (const service of services) {
    try {
      console.log(`Testing ${service.name} service...`);
      
      // Test health endpoint
      const healthResult = await makeRequest(`${service.url}/health`);
      console.log(`  Health: ${healthResult.success ? '✅' : '❌'} (${healthResult.status})`);
      
      // Test API endpoint
      const apiResult = await makeRequest(`${service.url}/api/${service.name.toLowerCase()}s`);
      console.log(`  API: ${apiResult.success ? '✅' : '❌'} (${apiResult.status})`);
      
      // Check if behavior matches expectation
      const isWorking = healthResult.success && apiResult.success;
      const expectedWorking = service.expected === 'functional';
      
      if (isWorking === expectedWorking) {
        console.log(`  Result: ✅ ${service.name} behaving as expected (${service.expected})`);
      } else {
        console.log(`  Result: ⚠️  ${service.name} not behaving as expected (${service.expected})`);
      }
      
    } catch (error) {
      console.log(`  Error: ❌ ${service.name} - ${error.message}`);
    }
    
    console.log();
  }
  
  console.log('🎯 Test complete!');
}

// Run test if called directly
if (require.main === module) {
  testServices().catch(console.error);
}

module.exports = { testServices };
