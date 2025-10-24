const http = require('http');

/**
 * Health Check Integration for Microservices
 * Integrates with Obsidian's health check service for perfect simulation
 */

class MicroserviceHealthChecker {
  constructor() {
    this.obsidianApiUrl = 'http://localhost:5000';
    this.services = [
      { name: 'orders', url: 'http://localhost:4001', healthEndpoint: '/health' },
      { name: 'booking', url: 'http://localhost:4002', healthEndpoint: '/health' },
      { name: 'payments', url: 'http://localhost:4003', healthEndpoint: '/health' }
    ];
    this.registeredServices = new Set();
  }

  async makeRequest(url, method = 'GET', data = null) {
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
        let responseData = '';
        res.on('data', chunk => responseData += chunk);
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            data: JSON.parse(responseData || '{}'),
            success: res.statusCode >= 200 && res.statusCode < 300,
            responseTime: Date.now() - startTime
          });
        });
      });

      req.on('error', (err) => {
        reject(err);
      });

      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (data) {
        req.write(JSON.stringify(data));
      }
      req.end();
    });
  }

  async registerServiceWithObsidian(service) {
    try {
      const serviceData = {
        name: service.name,
        url: service.url,
        description: `Demo ${service.name} service`,
        status: 'healthy',
        healthCheck: {
          endpoint: service.healthEndpoint,
          interval: 5000, // 5 seconds
        },
        metrics: {
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0,
          averageResponseTime: 0
        }
      };

      const result = await this.makeRequest(
        `${this.obsidianApiUrl}/api/services`,
        'POST',
        serviceData
      );

      if (result.success) {
        console.log(`✅ Registered ${service.name} with Obsidian`);
        this.registeredServices.add(service.name);
        return true;
      } else {
        console.log(`❌ Failed to register ${service.name}: ${result.status}`);
        return false;
      }
    } catch (error) {
      console.log(`❌ Error registering ${service.name}: ${error.message}`);
      return false;
    }
  }

  async checkServiceHealth(service) {
    try {
      const result = await this.makeRequest(`${service.url}${service.healthEndpoint}`);
      return {
        name: service.name,
        healthy: result.success,
        status: result.data.status || 'unknown',
        responseTime: result.responseTime,
        data: result.data
      };
    } catch (error) {
      return {
        name: service.name,
        healthy: false,
        status: 'down',
        responseTime: 0,
        error: error.message
      };
    }
  }

  async updateServiceStatus(serviceName, status, metrics = {}) {
    try {
      const updateData = {
        status: status,
        metrics: metrics,
        lastHealthCheck: new Date().toISOString()
      };

      const result = await this.makeRequest(
        `${this.obsidianApiUrl}/api/services/${serviceName}`,
        'PUT',
        updateData
      );

      if (result.success) {
        console.log(`📊 Updated ${serviceName} status: ${status}`);
        return true;
      } else {
        console.log(`❌ Failed to update ${serviceName}: ${result.status}`);
        return false;
      }
    } catch (error) {
      console.log(`❌ Error updating ${serviceName}: ${error.message}`);
      return false;
    }
  }

  async simulateServiceFailure(serviceName, failureType) {
    try {
      const service = this.services.find(s => s.name === serviceName);
      if (!service) {
        console.log(`❌ Service ${serviceName} not found`);
        return false;
      }

      // Set service to failure mode
      const result = await this.makeRequest(
        `${service.url}/${serviceName}/${failureType}`,
        'POST'
      );

      if (result.success) {
        console.log(`🔥 ${serviceName} set to ${failureType} mode`);
        
        // Update status in Obsidian
        await this.updateServiceStatus(serviceName, 'degraded', {
          failureMode: failureType,
          lastFailure: new Date().toISOString()
        });
        
        return true;
      } else {
        console.log(`❌ Failed to set ${serviceName} to ${failureType}: ${result.status}`);
        return false;
      }
    } catch (error) {
      console.log(`❌ Error setting ${serviceName} to ${failureType}: ${error.message}`);
      return false;
    }
  }

  async recoverService(serviceName) {
    try {
      const service = this.services.find(s => s.name === serviceName);
      if (!service) {
        console.log(`❌ Service ${serviceName} not found`);
        return false;
      }

      const result = await this.makeRequest(
        `${service.url}/${serviceName}/recover`,
        'POST'
      );

      if (result.success) {
        console.log(`🔄 ${serviceName} recovered`);
        
        // Update status in Obsidian
        await this.updateServiceStatus(serviceName, 'healthy', {
          recovered: true,
          lastRecovery: new Date().toISOString()
        });
        
        return true;
      } else {
        console.log(`❌ Failed to recover ${serviceName}: ${result.status}`);
        return false;
      }
    } catch (error) {
      console.log(`❌ Error recovering ${serviceName}: ${error.message}`);
      return false;
    }
  }

  async setupFunctionalFaultyScenario() {
    console.log('🎯 Setting up Functional vs Faulty Scenario with Obsidian Integration');
    console.log('================================================================');
    
    // Step 1: Register all services with Obsidian
    console.log('\n📝 Registering services with Obsidian...');
    for (const service of this.services) {
      await this.registerServiceWithObsidian(service);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Step 2: Set up functional services
    console.log('\n✅ Setting up FUNCTIONAL services...');
    await this.recoverService('orders');
    await this.recoverService('payments');

    // Step 3: Set up faulty service
    console.log('\n❌ Setting up FAULTY service...');
    await this.simulateServiceFailure('booking', 'fail');

    // Step 4: Verify setup
    console.log('\n🔍 Verifying setup...');
    await this.verifyScenario();

    console.log('\n🎉 Functional vs Faulty scenario ready!');
    console.log('Open Obsidian Dashboard: http://localhost:8080');
  }

  async verifyScenario() {
    console.log('\n📊 Service Status Verification:');
    console.log('-------------------------------');
    
    for (const service of this.services) {
      const health = await this.checkServiceHealth(service);
      const status = health.healthy ? '✅ HEALTHY' : '❌ UNHEALTHY';
      const responseTime = health.responseTime ? `${health.responseTime}ms` : 'N/A';
      
      console.log(`${status} ${service.name.toUpperCase()}`);
      console.log(`   Response Time: ${responseTime}`);
      console.log(`   Status: ${health.status}`);
      if (health.error) {
        console.log(`   Error: ${health.error}`);
      }
      console.log();
    }
  }

  async runContinuousMonitoring() {
    console.log('🔄 Starting continuous monitoring...');
    console.log('Press Ctrl+C to stop');
    
    const monitor = setInterval(async () => {
      console.log('\n📊 Health Check Results:');
      console.log('========================');
      
      for (const service of this.services) {
        const health = await this.checkServiceHealth(service);
        const status = health.healthy ? '✅' : '❌';
        const responseTime = health.responseTime ? `${health.responseTime}ms` : 'N/A';
        
        console.log(`${status} ${service.name}: ${health.status} (${responseTime})`);
        
        // Update Obsidian with current status
        await this.updateServiceStatus(service.name, health.healthy ? 'healthy' : 'degraded', {
          responseTime: health.responseTime,
          lastCheck: new Date().toISOString()
        });
      }
    }, 10000); // Check every 10 seconds

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Stopping monitoring...');
      clearInterval(monitor);
      process.exit(0);
    });
  }

  async runInteractiveDemo() {
    console.log('🎮 Interactive Functional vs Faulty Demo');
    console.log('========================================');
    console.log();
    console.log('Available commands:');
    console.log('1. fail <service> - Simulate service failure');
    console.log('2. slow <service> - Simulate slow responses');
    console.log('3. overload <service> - Simulate service overload');
    console.log('4. recover <service> - Recover service');
    console.log('5. status - Check all services');
    console.log('6. monitor - Start continuous monitoring');
    console.log('7. quit - Exit');
    console.log();

    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const question = (query) => new Promise(resolve => rl.question(query, resolve));

    while (true) {
      const input = await question('obsidian> ');
      const [command, serviceName] = input.trim().split(' ');

      switch (command.toLowerCase()) {
        case 'fail':
          if (serviceName) {
            await this.simulateServiceFailure(serviceName, 'fail');
          } else {
            console.log('Usage: fail <service>');
          }
          break;

        case 'slow':
          if (serviceName) {
            await this.simulateServiceFailure(serviceName, 'slow');
          } else {
            console.log('Usage: slow <service>');
          }
          break;

        case 'overload':
          if (serviceName) {
            await this.simulateServiceFailure(serviceName, 'overload');
          } else {
            console.log('Usage: overload <service>');
          }
          break;

        case 'recover':
          if (serviceName) {
            await this.recoverService(serviceName);
          } else {
            console.log('Usage: recover <service>');
          }
          break;

        case 'status':
          await this.verifyScenario();
          break;

        case 'monitor':
          await this.runContinuousMonitoring();
          break;

        case 'quit':
        case 'exit':
          console.log('👋 Goodbye!');
          rl.close();
          process.exit(0);

        default:
          console.log('Unknown command. Type "quit" to exit.');
      }
    }
  }
}

// Export for use in other scripts
module.exports = MicroserviceHealthChecker;

// Run if called directly
if (require.main === module) {
  const checker = new MicroserviceHealthChecker();
  
  const args = process.argv.slice(2);
  
  if (args.includes('--interactive') || args.includes('-i')) {
    checker.runInteractiveDemo();
  } else if (args.includes('--monitor') || args.includes('-m')) {
    checker.runContinuousMonitoring();
  } else {
    checker.setupFunctionalFaultyScenario();
  }
}
