import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue, JobOptions } from 'bull';

/**
 * Queue Service
 *
 * Centralized service for adding jobs to background queues.
 * Provides type-safe job enqueuing with sensible defaults.
 *
 * @example
 * // In AuthService:
 * await this.queueService.addEmailJob('send-verification', {
 *   to: user.email,
 *   subject: 'Verify your email',
 *   template: 'email-verification',
 *   data: { name: user.firstName, link: verificationLink },
 * });
 */
@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @InjectQueue('email') private emailQueue: Queue,
    @InjectQueue('notification') private notificationQueue: Queue,
    @InjectQueue('report') private reportQueue: Queue,
    @InjectQueue('cleanup') private cleanupQueue: Queue,
  ) {}

  // ==================== Email Jobs ====================

  /**
   * Add email job to queue
   */
  async addEmailJob(jobName: string, data: EmailJobData, options: JobOptions = {}): Promise<void> {
    try {
      await this.emailQueue.add(jobName, data, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: true,
        removeOnFail: false,
        ...options,
      });
      this.logger.log(`Email job added: ${jobName}`);
    } catch (error) {
      this.logger.error(`Failed to add email job: ${jobName}`, error);
      throw error;
    }
  }

  // ==================== Notification Jobs ====================

  /**
   * Add notification job to queue
   */
  async addNotificationJob(
    jobName: string,
    data: NotificationJobData,
    options: JobOptions = {},
  ): Promise<void> {
    try {
      await this.notificationQueue.add(jobName, data, {
        attempts: 2,
        backoff: {
          type: 'fixed',
          delay: 10000,
        },
        ...options,
      });
      this.logger.log(`Notification job added: ${jobName}`);
    } catch (error) {
      this.logger.error(`Failed to add notification job: ${jobName}`, error);
      throw error;
    }
  }

  // ==================== Report Jobs ====================

  /**
   * Add report generation job to queue
   */
  async addReportJob(
    jobName: string,
    data: ReportJobData,
    options: JobOptions = {},
  ): Promise<void> {
    try {
      await this.reportQueue.add(jobName, data, {
        attempts: 2,
        timeout: 300000, // 5 minutes
        removeOnComplete: true,
        ...options,
      });
      this.logger.log(`Report job added: ${jobName}`);
    } catch (error) {
      this.logger.error(`Failed to add report job: ${jobName}`, error);
      throw error;
    }
  }

  // ==================== Cleanup Jobs ====================

  /**
   * Add cleanup job to queue
   */
  async addCleanupJob(
    jobName: string,
    data: CleanupJobData,
    options: JobOptions = {},
  ): Promise<void> {
    try {
      await this.cleanupQueue.add(jobName, data, {
        attempts: 1,
        removeOnComplete: true,
        ...options,
      });
      this.logger.log(`Cleanup job added: ${jobName}`);
    } catch (error) {
      this.logger.error(`Failed to add cleanup job: ${jobName}`, error);
      throw error;
    }
  }

  // ==================== Queue Stats ====================

  /**
   * Get statistics for a specific queue
   */
  async getQueueStats(queueName: QueueName): Promise<QueueStats> {
    const queue = this.getQueue(queueName);

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);

    return {
      queue: queueName,
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed,
    };
  }

  /**
   * Get stats for all queues
   */
  async getAllQueueStats(): Promise<QueueStats[]> {
    const queues: QueueName[] = ['email', 'notification', 'report', 'cleanup'];
    return Promise.all(queues.map((q) => this.getQueueStats(q)));
  }

  // ==================== Private Helpers ====================

  private getQueue(queueName: QueueName): Queue {
    switch (queueName) {
      case 'email':
        return this.emailQueue;
      case 'notification':
        return this.notificationQueue;
      case 'report':
        return this.reportQueue;
      case 'cleanup':
        return this.cleanupQueue;
      default:
        throw new Error(`Unknown queue: ${queueName}`);
    }
  }
}

// ==================== Type Definitions ====================

export interface EmailJobData {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}

export interface NotificationJobData {
  userId: string;
  title: string;
  message: string;
  type: 'push' | 'sms' | 'in-app';
  data?: Record<string, any>;
}

export interface ReportJobData {
  userId: string;
  reportType: string;
  filters: Record<string, any>;
  format: 'pdf' | 'excel' | 'csv';
}

export interface CleanupJobData {
  type: 'expired-tokens' | 'old-logs' | 'temp-files';
  timestamp: Date;
  olderThanDays?: number;
}

export type QueueName = 'email' | 'notification' | 'report' | 'cleanup';

export interface QueueStats {
  queue: QueueName;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  total: number;
}
