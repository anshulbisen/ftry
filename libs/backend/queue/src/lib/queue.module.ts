import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { RedisModule, RedisService } from '@ftry/backend/redis';
import { QueueService } from './services/queue.service';
import { EmailProcessor } from './processors/email.processor';
import { NotificationProcessor } from './processors/notification.processor';
import { ReportProcessor } from './processors/report.processor';
import { CleanupProcessor } from './processors/cleanup.processor';

/**
 * Queue Module
 *
 * Provides background job processing with Bull/Redis.
 *
 * Features:
 * - Asynchronous job processing
 * - Automatic retries with exponential backoff
 * - Job prioritization
 * - Progress tracking
 * - Dead letter queue for failed jobs
 *
 * Available Queues:
 * - email: Email sending (verification, password reset, welcome, etc.)
 * - notification: Push notifications and SMS
 * - report: Heavy report generation
 * - cleanup: Scheduled maintenance tasks
 */
@Module({
  imports: [
    RedisModule, // Import shared Redis module
    BullModule.forRootAsync({
      imports: [RedisModule],
      inject: [RedisService],
      useFactory: (redisService: RedisService) => ({
        // Use Bull-compatible connection (maxRetriesPerRequest: null required)
        createClient: () => redisService.createBullConnection(),
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000, // 5s, 10s, 20s
          },
          removeOnComplete: true,
          removeOnFail: false, // Keep failed jobs for debugging
        },
      }),
    }),
    BullModule.registerQueue(
      { name: 'email' },
      { name: 'notification' },
      { name: 'report' },
      { name: 'cleanup' },
    ),
  ],
  providers: [
    QueueService,
    EmailProcessor,
    NotificationProcessor,
    ReportProcessor,
    CleanupProcessor,
  ],
  exports: [QueueService, BullModule],
})
export class QueueModule {}
