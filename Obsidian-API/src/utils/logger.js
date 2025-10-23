import winston from 'winston';
import MongoDB from 'winston-mongodb';
import config from '../config/config.js';

/**
 * Centralized Logging using Winston with MongoDB Transport
 * Implements Observer Pattern - logs are automatically sent to multiple transports
 */
const logger = winston.createLogger({
  level: config.get('server.env') === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.metadata(),
    winston.format.json()
  ),
  defaultMeta: { service: 'obsidian-api' },
  transports: [
    // Console Transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
          let log = `${timestamp} [${service}] ${level}: ${message}`;
          
          if (Object.keys(meta).length > 0) {
            // Handle circular references and non-serializable objects
            const seen = new WeakSet();
            const metaString = JSON.stringify(meta, (key, value) => {
              if (typeof value === 'object' && value !== null) {
                if (seen.has(value)) {
                  return '[Circular]';
                }
                seen.add(value);
              }
              // Skip non-serializable properties
              if (value instanceof Error) {
                return {
                  message: value.message,
                  stack: value.stack,
                  name: value.name
                };
              }
              return value;
            }, 2);
            log += `\n${metaString}`;
          }
          
          return log;
        })
      ),
    }),
    
    // File Transport for errors
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // File Transport for all logs
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Add MongoDB Transport
try {
  logger.add(
    new MongoDB.MongoDB({
      db: config.get('mongodb.uri'),
      collection: 'logs',
      level: 'info',
      options: {
        useUnifiedTopology: true,
      },
      storeHost: true,
      capped: true,
      cappedSize: 10485760, // 10MB
    })
  );
} catch (error) {
  console.error('Failed to initialize MongoDB logger transport:', error.message);
}

/**
 * Log wrapper with additional context
 */
export const logEvent = (level, message, metadata = {}) => {
  logger.log(level, message, {
    ...metadata,
    timestamp: new Date().toISOString(),
  });
};

export default logger;

