const http = require('http');

/**
 * Traffic Generator for Obsidian MROP Demo
 * Sends high traffic to test rate limiting and load balancing
 */

const CONFIG = {
  // Service URLs
  ordersService: 'http://localhost:4001',
  bookingService: 'http://localhost:4002',
  paymentService: 'http://localhost:4003',

  // Traffic settings
  requestsPerSecond: 50, // Adjust this for more/less traffic
  duration: 60, // Run for 60 seconds
};

// Stats tracking
const stats = {
  orders: { success: 0, failed: 0, total: 0 },
  bookings: { success: 0, failed: 0, total: 0 },
  payments: { success: 0, failed: 0, total: 0 },
};

function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        resolve({ status: res.statusCode, body });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function sendOrdersTraffic() {
  const service = 'orders';
  stats[service].total++;

  try {
    // Mix of GET and POST requests
    const isGet = Math.random() > 0.3;

    if (isGet) {
      await makeRequest(`${CONFIG.ordersService}/api/orders`);
    } else {
      await makeRequest(`${CONFIG.ordersService}/api/orders`, 'POST', {
        customerId: Math.floor(Math.random() * 1000),
        items: [
          { id: Math.floor(Math.random() * 100), quantity: Math.floor(Math.random() * 5) + 1 },
        ],
        totalAmount: Math.floor(Math.random() * 500) + 10,
      });
    }

    stats[service].success++;
  } catch (error) {
    stats[service].failed++;
  }
}

async function sendBookingsTraffic() {
  const service = 'bookings';
  stats[service].total++;

  try {
    const isGet = Math.random() > 0.3;

    if (isGet) {
      await makeRequest(`${CONFIG.bookingService}/api/bookings`);
    } else {
      const startDate = new Date(Date.now() + Math.random() * 86400000 * 30); // Next 30 days
      const endDate = new Date(startDate.getTime() + 86400000 * 3); // 3 days later

      await makeRequest(`${CONFIG.bookingService}/api/bookings`, 'POST', {
        customerId: Math.floor(Math.random() * 1000),
        resourceType: ['hotel', 'flight', 'car'][Math.floor(Math.random() * 3)],
        resourceId: `RES${Math.floor(Math.random() * 100)}`,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
    }

    stats[service].success++;
  } catch (error) {
    stats[service].failed++;
  }
}

async function sendPaymentsTraffic() {
  const service = 'payments';
  stats[service].total++;

  try {
    const isGet = Math.random() > 0.4;

    if (isGet) {
      await makeRequest(`${CONFIG.paymentService}/api/payments`);
    } else {
      await makeRequest(`${CONFIG.paymentService}/api/payments/process`, 'POST', {
        orderId: Math.floor(Math.random() * 1000),
        amount: Math.floor(Math.random() * 500) + 10,
        method: ['credit_card', 'debit_card', 'paypal'][Math.floor(Math.random() * 3)],
        cardNumber: '**** **** **** ' + Math.floor(Math.random() * 9000 + 1000),
      });
    }

    stats[service].success++;
  } catch (error) {
    stats[service].failed++;
  }
}

function printStats() {
  console.clear();
  console.log('🚀 OBSIDIAN MROP - Traffic Generator');
  console.log('=' .repeat(60));
  console.log(`Target: ${CONFIG.requestsPerSecond} req/s per service`);
  console.log('=' .repeat(60));
  console.log('');

  Object.entries(stats).forEach(([service, data]) => {
    const successRate =
      data.total > 0 ? ((data.success / data.total) * 100).toFixed(1) : 0;

    console.log(`📊 ${service.toUpperCase()}`);
    console.log(`   Total:   ${data.total}`);
    console.log(`   Success: ${data.success} (${successRate}%)`);
    console.log(`   Failed:  ${data.failed}`);
    console.log('');
  });

  const totalRequests = Object.values(stats).reduce((sum, s) => sum + s.total, 0);
  const totalSuccess = Object.values(stats).reduce((sum, s) => sum + s.success, 0);
  const totalFailed = Object.values(stats).reduce((sum, s) => sum + s.failed, 0);

  console.log('=' .repeat(60));
  console.log(`TOTAL: ${totalRequests} requests | ${totalSuccess} success | ${totalFailed} failed`);
  console.log('=' .repeat(60));
}

async function generateTraffic() {
  console.log('🚀 Starting traffic generation...');
  console.log(`Sending ${CONFIG.requestsPerSecond} requests/second to each service`);
  console.log(`Duration: ${CONFIG.duration} seconds\n`);

  const intervalMs = 1000 / CONFIG.requestsPerSecond;
  let elapsed = 0;

  const statsInterval = setInterval(printStats, 1000);

  const startTime = Date.now();

  while (elapsed < CONFIG.duration * 1000) {
    // Send traffic to all services concurrently
    sendOrdersTraffic();
    sendBookingsTraffic();
    sendPaymentsTraffic();

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
    elapsed = Date.now() - startTime;
  }

  clearInterval(statsInterval);
  printStats();

  console.log('\n✅ Traffic generation completed!');
  console.log('Check Obsidian MROP dashboard for results.');
}

// Run the traffic generator
generateTraffic().catch(console.error);

