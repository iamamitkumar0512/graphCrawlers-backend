import * as cron from "node-cron";
import twitterService from "./twitterService";
import web3ScraperService from "./web3ScraperService";
import { logger } from "../utils/logger";

class CronService {
  private jobs: Map<string, cron.ScheduledTask> = new Map();
  private isInitialized = false;

  // Default usernames to monitor (you can change these)
  private defaultUsernames = [
    "elonmusk",
    "sundarpichai",
    "satyanadella",
    "tim_cook",
    "jeffbezos",
  ];

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize Twitter service
      await twitterService.initialize();

      // Initialize Web3 scraper service
      await web3ScraperService.initialize();

      // Schedule tweet fetching every 30 minutes
      this.scheduleTweetFetching();

      // Schedule web3 content fetching every hour
      this.scheduleWeb3ContentFetching();

      // Schedule cleanup job every 24 hours
      this.scheduleCleanup();

      this.isInitialized = true;
      logger.info("Cron service initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize cron service:", error);
      throw error;
    }
  }

  private scheduleTweetFetching(): void {
    // Run every 30 minutes: '0 */30 * * * *'
    // For testing, run every 5 minutes: '*/5 * * * *'
    const tweetFetchingJob = cron.schedule(
      "*/5 * * * *",
      async () => {
        try {
          logger.info("Starting scheduled tweet fetching...");
          const usernames = this.getUsernamesToMonitor();
          const savedTweets = await twitterService.fetchAndSaveTweets(
            usernames,
            10
          );
          logger.info(
            `Scheduled tweet fetching completed. Saved ${savedTweets.length} new tweets.`
          );
        } catch (error) {
          logger.error("Error in scheduled tweet fetching:", error);
        }
      },
      {
        timezone: "UTC",
      }
    );

    this.jobs.set("tweetFetching", tweetFetchingJob);
    tweetFetchingJob.start();
    logger.info("Tweet fetching job scheduled to run every 5 minutes");
  }

  private scheduleWeb3ContentFetching(): void {
    // Run every hour: '0 * * * *'
    // For testing, run every 10 minutes: '*/10 * * * *'
    const web3ContentFetchingJob = cron.schedule(
      "*/10 * * * *",
      async () => {
        try {
          logger.info("Starting scheduled web3 content fetching...");
          const savedPosts = await web3ScraperService.fetchAndSaveAllPosts(3);
          logger.info(
            `Scheduled web3 content fetching completed. Saved ${savedPosts.length} new posts.`
          );
        } catch (error) {
          logger.error("Error in scheduled web3 content fetching:", error);
        }
      },
      {
        timezone: "UTC",
      }
    );

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

  private getUsernamesToMonitor(): string[] {
    // In a real application, you might want to store this in a database
    // or environment variables
    return this.defaultUsernames;
  }

  // Method to manually trigger tweet fetching
  async triggerTweetFetching(usernames?: string[]): Promise<void> {
    try {
      const targetUsernames = usernames || this.getUsernamesToMonitor();
      logger.info(
        `Manually triggering tweet fetching for: ${targetUsernames.join(", ")}`
      );
      const savedTweets = await twitterService.fetchAndSaveTweets(
        targetUsernames,
        20
      );
      logger.info(
        `Manual tweet fetching completed. Saved ${savedTweets.length} new tweets.`
      );
    } catch (error) {
      logger.error("Error in manual tweet fetching:", error);
      throw error;
    }
  }

  // Method to manually trigger web3 content fetching
  async triggerWeb3ContentFetching(maxPostsPerCompany?: number): Promise<void> {
    try {
      logger.info("Manually triggering web3 content fetching...");
      const savedPosts = await web3ScraperService.fetchAndSaveAllPosts(
        maxPostsPerCompany || 5
      );
      logger.info(
        `Manual web3 content fetching completed. Saved ${savedPosts.length} new posts.`
      );
    } catch (error) {
      logger.error("Error in manual web3 content fetching:", error);
      throw error;
    }
  }

  // Method to add a new username to monitor
  addUsernameToMonitor(username: string): void {
    if (!this.defaultUsernames.includes(username)) {
      this.defaultUsernames.push(username);
      logger.info(`Added ${username} to monitoring list`);
    }
  }

  // Method to remove a username from monitoring
  removeUsernameFromMonitor(username: string): void {
    const index = this.defaultUsernames.indexOf(username);
    if (index > -1) {
      this.defaultUsernames.splice(index, 1);
      logger.info(`Removed ${username} from monitoring list`);
    }
  }

  // Method to get current monitoring list
  getMonitoringList(): string[] {
    return [...this.defaultUsernames];
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
    await twitterService.close();
    await web3ScraperService.close();
    this.isInitialized = false;
    logger.info("Cron service shutdown completed");
  }
}

export default new CronService();
