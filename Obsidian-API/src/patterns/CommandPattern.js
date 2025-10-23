import logger from '../utils/logger.js';
import circuitBreakerService from '../services/circuitBreakerService.js';
import bulkheadPattern from './BulkheadPattern.js';
import loadBalancerPattern from './LoadBalancerPattern.js';
import Service from '../models/Service.js';

/**
 * Command Pattern Implementation
 * Encapsulates requests as objects, allowing parameterization and queuing
 * 
 * Use Case: Chaos engineering actions, resilience pattern operations, undo/redo
 * Based on: https://refactoring.guru/design-patterns/command
 */

/**
 * Base Command Interface
 */
class Command {
  constructor() {
    this.executedAt = null;
    this.result = null;
  }

  async execute() {
    throw new Error('Execute method must be implemented');
  }

  async undo() {
    throw new Error('Undo method must be implemented');
  }

  getResult() {
    return this.result;
  }
}

/**
 * Open Circuit Breaker Command
 */
class OpenCircuitCommand extends Command {
  constructor(serviceName) {
    super();
    this.serviceName = serviceName;
    this.previousState = null;
  }

  async execute() {
    logger.info('Executing OpenCircuitCommand', {
      serviceName: this.serviceName,
    });

    const breaker = circuitBreakerService.getBreaker(this.serviceName);

    if (breaker) {
      this.previousState = breaker.opened;
      
      // Force open the circuit
      breaker.open();

      this.executedAt = new Date();
      this.result = {
        success: true,
        message: `Circuit breaker opened for ${this.serviceName}`,
        previousState: this.previousState,
      };
    } else {
      this.result = {
        success: false,
        message: `Circuit breaker not found for ${this.serviceName}`,
      };
    }

    return this.result;
  }

  async undo() {
    logger.info('Undoing OpenCircuitCommand', {
      serviceName: this.serviceName,
    });

    const breaker = circuitBreakerService.getBreaker(this.serviceName);

    if (breaker && !this.previousState) {
      breaker.close();
      return {
        success: true,
        message: `Circuit breaker restored for ${this.serviceName}`,
      };
    }

    return {
      success: false,
      message: 'Cannot undo - circuit breaker state not saved',
    };
  }
}

/**
 * Close Circuit Breaker Command
 */
class CloseCircuitCommand extends Command {
  constructor(serviceName) {
    super();
    this.serviceName = serviceName;
    this.previousState = null;
  }

  async execute() {
    logger.info('Executing CloseCircuitCommand', {
      serviceName: this.serviceName,
    });

    const breaker = circuitBreakerService.getBreaker(this.serviceName);

    if (breaker) {
      this.previousState = breaker.opened;
      breaker.close();

      this.executedAt = new Date();
      this.result = {
        success: true,
        message: `Circuit breaker closed for ${this.serviceName}`,
      };
    } else {
      this.result = {
        success: false,
        message: `Circuit breaker not found for ${this.serviceName}`,
      };
    }

    return this.result;
  }

  async undo() {
    const breaker = circuitBreakerService.getBreaker(this.serviceName);

    if (breaker && this.previousState) {
      breaker.open();
      return {
        success: true,
        message: `Circuit breaker state restored for ${this.serviceName}`,
      };
    }

    return { success: true, message: 'No undo needed' };
  }
}

/**
 * Scale Service Command
 */
class ScaleServiceCommand extends Command {
  constructor(serviceName, instances) {
    super();
    this.serviceName = serviceName;
    this.instances = instances;
    this.previousInstances = null;
  }

  async execute() {
    logger.info('Executing ScaleServiceCommand', {
      serviceName: this.serviceName,
      instances: this.instances,
    });

    // Get current instances
    const stats = loadBalancerPattern.getStats(this.serviceName);
    this.previousInstances = stats?.totalInstances || 0;

    // Register new instances
    const newInstances = [];
    for (let i = 0; i < this.instances; i++) {
      newInstances.push({
        url: `http://${this.serviceName}-${i}.local:3000`,
        weight: 1,
      });
    }

    loadBalancerPattern.registerService(this.serviceName, newInstances);

    this.executedAt = new Date();
    this.result = {
      success: true,
      message: `Service ${this.serviceName} scaled to ${this.instances} instances`,
      previousInstances: this.previousInstances,
      newInstances: this.instances,
    };

    return this.result;
  }

  async undo() {
    logger.info('Undoing ScaleServiceCommand', {
      serviceName: this.serviceName,
    });

    if (this.previousInstances !== null) {
      const instances = [];
      for (let i = 0; i < this.previousInstances; i++) {
        instances.push({
          url: `http://${this.serviceName}-${i}.local:3000`,
          weight: 1,
        });
      }

      loadBalancerPattern.registerService(this.serviceName, instances);

      return {
        success: true,
        message: `Service scaled back to ${this.previousInstances} instances`,
      };
    }

    return { success: false, message: 'Cannot undo - previous state not saved' };
  }
}

/**
 * Change Load Balancing Strategy Command
 */
class ChangeLoadBalancingStrategyCommand extends Command {
  constructor(strategy) {
    super();
    this.strategy = strategy;
    this.previousStrategy = null;
  }

  async execute() {
    logger.info('Executing ChangeLoadBalancingStrategyCommand', {
      strategy: this.strategy,
    });

    this.previousStrategy = loadBalancerPattern.strategy;
    loadBalancerPattern.setStrategy(this.strategy);

    this.executedAt = new Date();
    this.result = {
      success: true,
      message: `Load balancing strategy changed to ${this.strategy}`,
      previousStrategy: this.previousStrategy,
    };

    return this.result;
  }

  async undo() {
    if (this.previousStrategy) {
      loadBalancerPattern.setStrategy(this.previousStrategy);
      return {
        success: true,
        message: `Strategy restored to ${this.previousStrategy}`,
      };
    }

    return { success: false, message: 'Cannot undo - previous strategy not saved' };
  }
}

/**
 * Create Bulkhead Command
 */
class CreateBulkheadCommand extends Command {
  constructor(serviceName, config) {
    super();
    this.serviceName = serviceName;
    this.config = config;
  }

  async execute() {
    logger.info('Executing CreateBulkheadCommand', {
      serviceName: this.serviceName,
      config: this.config,
    });

    bulkheadPattern.createBulkhead(this.serviceName, this.config);

    this.executedAt = new Date();
    this.result = {
      success: true,
      message: `Bulkhead created for ${this.serviceName}`,
      config: this.config,
    };

    return this.result;
  }

  async undo() {
    // Remove bulkhead
    bulkheadPattern.bulkheads.delete(this.serviceName);

    return {
      success: true,
      message: `Bulkhead removed for ${this.serviceName}`,
    };
  }
}

/**
 * Update Service Status Command
 */
class UpdateServiceStatusCommand extends Command {
  constructor(serviceName, status) {
    super();
    this.serviceName = serviceName;
    this.status = status;
    this.previousStatus = null;
  }

  async execute() {
    logger.info('Executing UpdateServiceStatusCommand', {
      serviceName: this.serviceName,
      status: this.status,
    });

    const service = await Service.findOne({ name: this.serviceName });

    if (service) {
      this.previousStatus = service.status;
      service.status = this.status;
      await service.save();

      this.executedAt = new Date();
      this.result = {
        success: true,
        message: `Service ${this.serviceName} status updated to ${this.status}`,
        previousStatus: this.previousStatus,
      };
    } else {
      this.result = {
        success: false,
        message: `Service ${this.serviceName} not found`,
      };
    }

    return this.result;
  }

  async undo() {
    if (this.previousStatus) {
      const service = await Service.findOne({ name: this.serviceName });

      if (service) {
        service.status = this.previousStatus;
        await service.save();

        return {
          success: true,
          message: `Service status restored to ${this.previousStatus}`,
        };
      }
    }

    return { success: false, message: 'Cannot undo - previous status not saved' };
  }
}

/**
 * Command Invoker
 * Manages command execution and history
 */
class CommandInvoker {
  constructor() {
    this.history = [];
    this.currentIndex = -1;
  }

  async execute(command) {
    logger.info('Invoker executing command', {
      commandType: command.constructor.name,
    });

    const result = await command.execute();

    // Add to history
    this.history = this.history.slice(0, this.currentIndex + 1);
    this.history.push(command);
    this.currentIndex++;

    logger.info('Command executed', {
      commandType: command.constructor.name,
      success: result.success,
    });

    return result;
  }

  async undo() {
    if (this.currentIndex < 0) {
      return {
        success: false,
        message: 'Nothing to undo',
      };
    }

    const command = this.history[this.currentIndex];
    logger.info('Invoker undoing command', {
      commandType: command.constructor.name,
    });

    const result = await command.undo();
    this.currentIndex--;

    return result;
  }

  async redo() {
    if (this.currentIndex >= this.history.length - 1) {
      return {
        success: false,
        message: 'Nothing to redo',
      };
    }

    this.currentIndex++;
    const command = this.history[this.currentIndex];

    logger.info('Invoker redoing command', {
      commandType: command.constructor.name,
    });

    return await command.execute();
  }

  getHistory() {
    return this.history.map((cmd, index) => ({
      index,
      commandType: cmd.constructor.name,
      executedAt: cmd.executedAt,
      result: cmd.result,
      isCurrent: index === this.currentIndex,
    }));
  }

  canUndo() {
    return this.currentIndex >= 0;
  }

  canRedo() {
    return this.currentIndex < this.history.length - 1;
  }
}

/**
 * Example Usage:
 * 
 * const invoker = new CommandInvoker();
 * 
 * // Execute commands
 * await invoker.execute(new OpenCircuitCommand('payment-service'));
 * await invoker.execute(new ScaleServiceCommand('api-service', 5));
 * await invoker.execute(new ChangeLoadBalancingStrategyCommand('least-connections'));
 * 
 * // Undo last command
 * await invoker.undo();
 * 
 * // Redo
 * await invoker.redo();
 * 
 * // View history
 * const history = invoker.getHistory();
 */

export {
  Command,
  OpenCircuitCommand,
  CloseCircuitCommand,
  ScaleServiceCommand,
  ChangeLoadBalancingStrategyCommand,
  CreateBulkheadCommand,
  UpdateServiceStatusCommand,
  CommandInvoker,
};

