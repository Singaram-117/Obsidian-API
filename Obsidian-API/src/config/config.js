import dotenv from 'dotenv';

dotenv.config();

/**
 * Configuration Singleton Pattern
 * Ensures only one configuration instance exists throughout the application
 */
class Configuration {
  static instance = null;

  constructor() {
    if (Configuration.instance) {
      return Configuration.instance;
    }

    this.config = {
      server: {
        port: process.env.PORT || 5000,
        env: process.env.NODE_ENV || 'development',
      },
      mongodb: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/obsidian',
      },
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || '',
      },
      kafka: {
        brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
        clientId: process.env.KAFKA_CLIENT_ID || 'obsidian-api',
        groupId: process.env.KAFKA_GROUP_ID || 'obsidian-group',
      },
      mockService: {
        url: process.env.MOCK_SERVICE_URL || 'http://localhost:3001',
      },
      circuitBreaker: {
        timeout: parseInt(process.env.CIRCUIT_TIMEOUT) || 3000,
        errorThresholdPercentage: parseInt(process.env.CIRCUIT_ERROR_THRESHOLD) || 50,
        resetTimeout: parseInt(process.env.CIRCUIT_RESET_TIMEOUT) || 30000,
      },
      rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
        service: {
          defaultRequestsPerMinute: parseInt(process.env.SERVICE_RATE_LIMIT_RPM) || 1000,
          endpointRequestsPerMinute: parseInt(process.env.ENDPOINT_RATE_LIMIT_RPM) || 10,
        },
      },
      gateway: {
        timeout: parseInt(process.env.GATEWAY_TIMEOUT) || 30000,
        retries: parseInt(process.env.GATEWAY_RETRIES) || 3,
        retryDelay: parseInt(process.env.GATEWAY_RETRY_DELAY) || 1000,
        cache: {
          defaultTtl: parseInt(process.env.CACHE_DEFAULT_TTL) || 300,
          maxSize: parseInt(process.env.CACHE_MAX_SIZE) || 1000,
        },
        loadBalancer: {
          defaultStrategy: process.env.LOAD_BALANCER_STRATEGY || 'round-robin',
          healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL) || 30000,
        },
      },
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:8080',
      },
      jwt: {
        secret: process.env.JWT_SECRET || 'obsidian-mrop-super-secret-key-change-in-production',
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
      },
      queue: {
        redis: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
          password: process.env.REDIS_PASSWORD || '',
        },
      },
    };

    Configuration.instance = this;
  }

  get(key) {
    const keys = key.split('.');
    let value = this.config;
    
    for (const k of keys) {
      value = value[k];
      if (value === undefined) {
        throw new Error(`Configuration key '${key}' not found`);
      }
    }
    
    return value;
  }

  getAll() {
    return this.config;
  }
}

// Export singleton instance
const config = new Configuration();
export default config;