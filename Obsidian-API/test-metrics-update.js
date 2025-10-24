import mongoose from 'mongoose';
import Service from './src/models/Service.js';

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/obsidian';

async function testMetricsUpdate() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find a service to test with
    const service = await Service.findOne();
    if (!service) {
      console.log('No services found. Please register a service first.');
      return;
    }

    console.log(`Testing metrics update for service: ${service.name}`);
    console.log('Current metrics:', service.metrics);

    // Simulate some requests
    for (let i = 0; i < 5; i++) {
      const isSuccess = Math.random() > 0.3; // 70% success rate
      const responseTime = Math.random() * 1000 + 100; // 100-1100ms

      const metricsUpdate = {
        $inc: { 'metrics.totalRequests': 1 },
        $set: {
          'metrics.lastRequestTime': new Date(),
        }
      };

      if (isSuccess) {
        metricsUpdate.$inc['metrics.successfulRequests'] = 1;
      } else {
        metricsUpdate.$inc['metrics.failedRequests'] = 1;
      }

      // Update average response time
      const currentAvg = service.metrics?.averageResponseTime || 0;
      const totalRequests = (service.metrics?.totalRequests || 0) + 1;
      const newAvg = ((currentAvg * (totalRequests - 1)) + responseTime) / totalRequests;
      metricsUpdate.$set['metrics.averageResponseTime'] = Math.round(newAvg);

      await Service.findOneAndUpdate(
        { name: service.name },
        metricsUpdate
      );

      console.log(`Request ${i + 1}: ${isSuccess ? 'SUCCESS' : 'FAILED'}, Response time: ${Math.round(responseTime)}ms`);
    }

    // Get updated service
    const updatedService = await Service.findOne({ name: service.name });
    console.log('\nUpdated metrics:', updatedService.metrics);

    // Calculate success rate
    const successRate = updatedService.metrics.totalRequests > 0 
      ? ((updatedService.metrics.successfulRequests / updatedService.metrics.totalRequests) * 100).toFixed(1)
      : 0;

    console.log(`\nSuccess Rate: ${successRate}%`);
    console.log(`Average Response Time: ${updatedService.metrics.averageResponseTime}ms`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

testMetricsUpdate();
