import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

async function testApiOutputs() {
  try {
    console.log('🧪 Testing Obsidian API Outputs...\n');

    // Test 1: Get all services
    console.log('1️⃣ Testing GET /api/services');
    try {
      const servicesResponse = await axios.get(`${API_URL}/services`);
      console.log('✅ Services API Response:');
      console.log(`   Status: ${servicesResponse.status}`);
      console.log(`   Success: ${servicesResponse.data.success}`);
      console.log(`   Count: ${servicesResponse.data.count}`);
      console.log(`   Data Type: ${Array.isArray(servicesResponse.data.data) ? 'Array' : typeof servicesResponse.data.data}`);
      console.log(`   Sample Service:`, servicesResponse.data.data[0] ? {
        name: servicesResponse.data.data[0].name,
        url: servicesResponse.data.data[0].url,
        status: servicesResponse.data.data[0].status,
        metrics: servicesResponse.data.data[0].metrics
      } : 'No services found');
    } catch (error) {
      console.log('❌ Services API Error:', error.response?.data || error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 2: Get events
    console.log('2️⃣ Testing GET /api/events');
    try {
      const eventsResponse = await axios.get(`${API_URL}/events`);
      console.log('✅ Events API Response:');
      console.log(`   Status: ${eventsResponse.status}`);
      console.log(`   Success: ${eventsResponse.data.success}`);
      console.log(`   Count: ${eventsResponse.data.count}`);
      console.log(`   Data Type: ${Array.isArray(eventsResponse.data.data) ? 'Array' : typeof eventsResponse.data.data}`);
      console.log(`   Sample Event:`, eventsResponse.data.data[0] ? {
        type: eventsResponse.data.data[0].type,
        severity: eventsResponse.data.data[0].severity,
        serviceName: eventsResponse.data.data[0].serviceName,
        timestamp: eventsResponse.data.data[0].timestamp
      } : 'No events found');
    } catch (error) {
      console.log('❌ Events API Error:', error.response?.data || error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 3: Get metrics
    console.log('3️⃣ Testing GET /api/metrics');
    try {
      const metricsResponse = await axios.get(`${API_URL}/metrics`);
      console.log('✅ Metrics API Response:');
      console.log(`   Status: ${metricsResponse.status}`);
      console.log(`   Success: ${metricsResponse.data.success}`);
      console.log(`   Count: ${metricsResponse.data.count}`);
      console.log(`   Data Type: ${Array.isArray(metricsResponse.data.data) ? 'Array' : typeof metricsResponse.data.data}`);
      console.log(`   Sample Metric:`, metricsResponse.data.data[0] ? {
        serviceName: metricsResponse.data.data[0].serviceName,
        metricType: metricsResponse.data.data[0].metricType,
        value: metricsResponse.data.data[0].value,
        timestamp: metricsResponse.data.data[0].timestamp
      } : 'No metrics found');
    } catch (error) {
      console.log('❌ Metrics API Error:', error.response?.data || error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 4: Get queue stats
    console.log('4️⃣ Testing GET /api/queue/stats');
    try {
      const queueResponse = await axios.get(`${API_URL}/queue/stats`);
      console.log('✅ Queue API Response:');
      console.log(`   Status: ${queueResponse.status}`);
      console.log(`   Success: ${queueResponse.data.success}`);
      console.log(`   Data:`, queueResponse.data.data);
    } catch (error) {
      console.log('❌ Queue API Error:', error.response?.data || error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 5: Get health
    console.log('5️⃣ Testing GET /health');
    try {
      const healthResponse = await axios.get(`${API_URL.replace('/api', '')}/health`);
      console.log('✅ Health API Response:');
      console.log(`   Status: ${healthResponse.status}`);
      console.log(`   Health Status: ${healthResponse.data.status}`);
      console.log(`   Services:`, healthResponse.data.services);
    } catch (error) {
      console.log('❌ Health API Error:', error.response?.data || error.message);
    }

    console.log('\n🎉 API Testing Complete!');

  } catch (error) {
    console.error('❌ Test Error:', error.message);
  }
}

testApiOutputs();
