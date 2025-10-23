import logger from '../utils/logger.js';
import { eventEmitter } from '../services/eventService.js';

/**
 * Saga Pattern Implementation
 * Manages distributed transactions across microservices
 * 
 * Each step can be compensated if a later step fails.
 * Ensures data consistency in distributed systems.
 * 
 * Based on: https://www.geeksforgeeks.org/system-design/microservices-resilience-patterns/
 */
class SagaPattern {
  constructor() {
    this.sagas = new Map();
  }

  /**
   * Create a new saga
   */
  createSaga(sagaId, steps) {
    const saga = {
      id: sagaId,
      steps: steps, // Array of { name, execute, compensate }
      currentStep: 0,
      executedSteps: [],
      status: 'pending', // 'pending', 'executing', 'completed', 'compensating', 'failed'
      startedAt: new Date(),
      completedAt: null,
      error: null,
    };

    this.sagas.set(sagaId, saga);
    logger.info(`Saga created: ${sagaId}`, { stepCount: steps.length });

    return saga;
  }

  /**
   * Execute saga
   */
  async executeSaga(sagaId) {
    const saga = this.sagas.get(sagaId);

    if (!saga) {
      throw new Error(`Saga ${sagaId} not found`);
    }

    saga.status = 'executing';
    logger.info(`Executing saga: ${sagaId}`);

    try {
      // Execute each step sequentially
      for (let i = 0; i < saga.steps.length; i++) {
        const step = saga.steps[i];
        saga.currentStep = i;

        logger.info(`Executing step ${i + 1}/${saga.steps.length}: ${step.name}`, {
          sagaId,
        });

        try {
          // Execute step
          const result = await step.execute();

          // Track executed step for potential compensation
          saga.executedSteps.push({
            step: i,
            name: step.name,
            result,
            executedAt: new Date(),
          });

          eventEmitter.emit('saga:step:completed', {
            sagaId,
            step: step.name,
            stepNumber: i + 1,
          });
        } catch (stepError) {
          logger.error(`Step ${step.name} failed`, {
            sagaId,
            error: stepError.message,
          });

          // Step failed - trigger compensation
          saga.error = stepError.message;
          await this.compensateSaga(sagaId);

          throw new Error(
            `Saga ${sagaId} failed at step ${step.name}: ${stepError.message}`
          );
        }
      }

      // All steps completed successfully
      saga.status = 'completed';
      saga.completedAt = new Date();

      logger.info(`Saga completed successfully: ${sagaId}`, {
        duration: saga.completedAt - saga.startedAt,
      });

      eventEmitter.emit('saga:completed', { sagaId });

      return {
        success: true,
        sagaId,
        executedSteps: saga.executedSteps.length,
      };
    } catch (error) {
      saga.status = 'failed';
      saga.error = error.message;

      logger.error(`Saga failed: ${sagaId}`, {
        error: error.message,
      });

      eventEmitter.emit('saga:failed', {
        sagaId,
        error: error.message,
      });

      throw error;
    }
  }

  /**
   * Compensate saga (rollback executed steps)
   */
  async compensateSaga(sagaId) {
    const saga = this.sagas.get(sagaId);

    if (!saga) {
      throw new Error(`Saga ${sagaId} not found`);
    }

    saga.status = 'compensating';
    logger.info(`Compensating saga: ${sagaId}`, {
      stepsToCompensate: saga.executedSteps.length,
    });

    // Compensate in reverse order (LIFO)
    for (let i = saga.executedSteps.length - 1; i >= 0; i--) {
      const executedStep = saga.executedSteps[i];
      const step = saga.steps[executedStep.step];

      if (step.compensate) {
        logger.info(`Compensating step: ${step.name}`, { sagaId });

        try {
          await step.compensate(executedStep.result);

          eventEmitter.emit('saga:step:compensated', {
            sagaId,
            step: step.name,
          });
        } catch (compensateError) {
          logger.error(`Compensation failed for step: ${step.name}`, {
            sagaId,
            error: compensateError.message,
          });
          // Continue compensating other steps even if one fails
        }
      }
    }

    logger.info(`Saga compensation completed: ${sagaId}`);

    eventEmitter.emit('saga:compensated', { sagaId });
  }

  /**
   * Get saga status
   */
  getSagaStatus(sagaId) {
    const saga = this.sagas.get(sagaId);

    if (!saga) {
      return null;
    }

    return {
      id: saga.id,
      status: saga.status,
      currentStep: saga.currentStep + 1,
      totalSteps: saga.steps.length,
      executedSteps: saga.executedSteps.length,
      startedAt: saga.startedAt,
      completedAt: saga.completedAt,
      error: saga.error,
      duration: saga.completedAt
        ? saga.completedAt - saga.startedAt
        : Date.now() - saga.startedAt,
    };
  }

  /**
   * Get all sagas
   */
  getAllSagas() {
    const sagas = [];

    for (const [id] of this.sagas) {
      sagas.push(this.getSagaStatus(id));
    }

    return sagas;
  }

  /**
   * Clean up completed sagas
   */
  cleanupSaga(sagaId) {
    const deleted = this.sagas.delete(sagaId);

    if (deleted) {
      logger.info(`Saga cleaned up: ${sagaId}`);
    }

    return deleted;
  }
}

// Export singleton instance
const sagaPattern = new SagaPattern();
export default sagaPattern;

