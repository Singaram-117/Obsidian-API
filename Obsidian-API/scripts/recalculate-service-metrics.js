import { connectDB, disconnectDB } from '../src/db/database.js';
import Service from '../src/models/Service.js';
import logger from '../src/utils/logger.js';

/**
 * Recalculates service metrics so that totalRequests equals successful + failed.
 * Run via: node Obsidian-API/scripts/recalculate-service-metrics.js
 */
const recalcMetrics = async () => {
  await connectDB();

  try {
    const services = await Service.find();
    let updatedCount = 0;

    for (const service of services) {
      const success = service.metrics?.successfulRequests || 0;
      const failure = service.metrics?.failedRequests || 0;
      const desiredTotal = success + failure;

      const currentTotal = service.metrics?.totalRequests || 0;

      if (desiredTotal !== currentTotal) {
        await Service.updateOne(
          { _id: service._id },
          {
            $set: {
              'metrics.totalRequests': desiredTotal,
            },
          }
        );

        logger.info('Recalculated service total requests', {
          service: service.name,
          previousTotal: currentTotal,
          correctedTotal: desiredTotal,
        });

        updatedCount += 1;
      }
    }

    logger.info('Service metrics recalculation completed', {
      totalServices: services.length,
      updatedServices: updatedCount,
    });
  } catch (error) {
    logger.error('Failed to recalculate service metrics', {
      error: error.message,
    });
  } finally {
    await disconnectDB();
  }
};

recalcMetrics().catch((error) => {
  logger.error('Recalculation script failed', { error: error.message });
  process.exit(1);
});