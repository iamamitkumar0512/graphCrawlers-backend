/**
 * Cron Service Module
 *
 * This service manages scheduled tasks for the application including
 * automated content scraping and cleanup operations. It provides
 * centralized scheduling functionality using node-cron.
 */

import * as cron from "node-cron";
import web3ScraperService from "./web3ScraperService";
import { logger } from "../utils/logger";

/**
 * Cron Service Class
 *
 * Manages scheduled background tasks including:
 * - Web3 content scraping from various platforms
 * - System cleanup operations
 * - Job lifecycle management
 */
class CronService {
  // Map to store active cron jobs
  private jobs: Map<string, cron.ScheduledTask> = new Map();
  // Flag to track initialization state
  private isInitialized = false;

  /**
   * Initialize the cron service and schedule all background tasks
   *
   * This method sets up the Web3 scraper service and schedules
   * recurring tasks for content fetching and system cleanup.
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize Web3 scraper service first
      await web3ScraperService.initialize();

      // Schedule web3 content fetching task
      this.scheduleWeb3ContentFetching();

      // Schedule system cleanup task
      this.scheduleCleanup();

      this.isInitialized = true;
      logger.info("Cron service initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize cron service:", error);
      throw error;
    }
  }

  /**
   * Schedule automated Web3 content fetching task
   *
   * This method sets up a recurring job to automatically scrape
   * content from Web3 platforms for all active companies.
   */
  private scheduleWeb3ContentFetching(): void {
    // Schedule pattern: every 10 minutes for testing
    // Production: '0 * * * *' (every hour)
    const web3ContentFetchingJob = cron.schedule(
      "*/10 * * * *",
      async () => {
        try {
          logger.info("Starting scheduled web3 content fetching...");
          // Fetch content from all active companies with limit of 3 posts per company
          const savedParagraphs =
            await web3ScraperService.fetchAndSaveAllParagraphs(3);
          logger.info(
            `Scheduled web3 content fetching completed. Saved ${savedParagraphs.length} new paragraphs.`
          );
        } catch (error) {
          logger.error("Error in scheduled web3 content fetching:", error);
        }
      },
      {
        timezone: "UTC", // Run in UTC timezone
      }
    );

    // Store job reference and start it
    this.jobs.set("web3ContentFetching", web3ContentFetchingJob);
    web3ContentFetchingJob.start();
    logger.info("Web3 content fetching job scheduled to run every 10 minutes");
  }

  private scheduleCleanup(): void {
    // Run every day at 2 AM: '0 2 * * *'
    const cleanupJob = cron.schedule(
      "0 2 * * *",
      async () => {
        try {
          logger.info("Starting scheduled cleanup...");
          // You can add cleanup logic here, like removing old tweets
          // For now, just log that cleanup would happen
          logger.info("Cleanup completed (placeholder)");
        } catch (error) {
          logger.error("Error in scheduled cleanup:", error);
        }
      },
      {
        timezone: "UTC",
      }
    );

    this.jobs.set("cleanup", cleanupJob);
    cleanupJob.start();
    logger.info("Cleanup job scheduled to run daily at 2 AM UTC");
  }

  // Method to manually trigger web3 content fetching
  async triggerWeb3ContentFetching(maxPostsPerCompany?: number): Promise<void> {
    try {
      logger.info("Manually triggering web3 content fetching...");
      const savedParagraphs =
        await web3ScraperService.fetchAndSaveAllParagraphs(
          maxPostsPerCompany || 5
        );
      logger.info(
        `Manual web3 content fetching completed. Saved ${savedParagraphs.length} new paragraphs.`
      );
    } catch (error) {
      logger.error("Error in manual web3 content fetching:", error);
      throw error;
    }
  }

  // Method to stop all cron jobs
  stopAllJobs(): void {
    this.jobs.forEach((job, name) => {
      job.stop();
      logger.info(`Stopped cron job: ${name}`);
    });
    this.jobs.clear();
  }

  // Method to restart all cron jobs
  async restartAllJobs(): Promise<void> {
    this.stopAllJobs();
    await this.initialize();
  }

  // Method to get job status
  getJobStatus(): { [key: string]: boolean } {
    const status: { [key: string]: boolean } = {};
    this.jobs.forEach((job, name) => {
      status[name] = job.getStatus() === "scheduled";
    });
    return status;
  }

  async shutdown(): Promise<void> {
    this.stopAllJobs();
    await web3ScraperService.close();
    this.isInitialized = false;
    logger.info("Cron service shutdown completed");
  }
}

export default new CronService();
