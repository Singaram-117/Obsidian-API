import mongoose from 'mongoose';
import Service from './src/models/Service.js';

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/obsidian';

async function testResponseTimes() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all services
    const services = await Service.find();
    console.log(`Found ${services.length} services:`);

    services.forEach(service => {
      console.log(`\nService: ${service.name}`);
      console.log(`  Total Requests: ${service.metrics?.totalRequests || 0}`);
      console.log(`  Successful: ${service.metrics?.successfulRequests || 0}`);
      console.log(`  Failed: ${service.metrics?.failedRequests || 0}`);
      console.log(`  Average Response Time: ${service.metrics?.averageResponseTime || 0}ms`);
      console.log(`  Last Request: ${service.metrics?.lastRequestTime || 'Never'}`);
    });

    // Test response time calculation
    console.log('\n--- Testing Response Time Calculation ---');
    
    const testService = services[0];
    if (testService) {
      console.log(`Testing with service: ${testService.name}`);
      
      // Simulate some requests with different response times
      const testResponseTimes = [100, 200, 150, 300, 250];
      let currentAvg = testService.metrics?.averageResponseTime || 0;
      let totalRequests = testService.metrics?.totalRequests || 0;
      
      console.log(`Initial average: ${currentAvg}ms, Total requests: ${totalRequests}`);
      
      for (let i = 0; i < testResponseTimes.length; i++) {
        const responseTime = testResponseTimes[i];
        totalRequests += 1;
        const newAvg = ((currentAvg * (totalRequests - 1)) + responseTime) / totalRequests;
        
        console.log(`Request ${i + 1}: ${responseTime}ms -> New avg: ${Math.round(newAvg)}ms`);
        currentAvg = newAvg;
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

testResponseTimes();
