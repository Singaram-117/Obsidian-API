const http = require('http');

/**
 * Simple Test Script for Demo Services
 * Tests if services are running and responding
 */

const services = [
  { name: 'Orders', url: 'http://localhost:4001', port: 4001 },
  { name: 'Booking', url: 'http://localhost:4002', port: 4002 },
  { name: 'Payments', url: 'http://localhost:4003', port: 4003 }
];

function testService(service) {
  return new Promise((resolve) => {
    const req = http.get(`${service.url}/health`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          name: service.name,
          status: 'UP',
          response: data.trim(),
          port: service.port
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        name: service.name,
        status: 'DOWN',
        error: err.message,
        port: service.port
      });
    });

    req.setTimeout(3000, () => {
      req.destroy();
      resolve({
        name: service.name,
        status: 'TIMEOUT',
        error: 'Connection timeout',
        port: service.port
      });
    });
  });
}

async function runTests() {
  console.log('🔍 Testing Demo Services...\n');
  
  const results = await Promise.all(services.map(testService));
  
  console.log('📊 SERVICE STATUS:');
  console.log('==================');
  
  results.forEach(result => {
    const status = result.status === 'UP' ? '✅' : '❌';
    console.log(`${status} ${result.name} (Port ${result.port}): ${result.status}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    if (result.response) {
      console.log(`   Response: ${result.response}`);
    }
  });
  
  const upCount = results.filter(r => r.status === 'UP').length;
  console.log(`\n📈 Summary: ${upCount}/${results.length} services running`);
  
  if (upCount === 0) {
    console.log('\n🚀 To start services, run:');
    console.log('   cd Demo-Services');
    console.log('   .\\START_ALL.bat');
  }
}

runTests().catch(console.error);
