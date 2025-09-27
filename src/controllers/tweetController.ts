import { Request, Response, NextFunction } from "express";
import Tweet, { ITweet } from "../models/Tweet";
import { asyncHandler } from "../middleware/asyncHandler";
import cronService from "../services/cronService";
import { logger } from "../utils/logger";

/**
 * @swagger
 * /api/tweets:
 *   get:
 *     summary: Get all tweets
 *     tags: [Tweets]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of tweets per page
 *       - in: query
 *         name: username
 *         schema:
 *           type: string
 *         description: Filter by username
 *       - in: query
 *         name: hashtag
 *         schema:
 *           type: string
 *         description: Filter by hashtag
 *     responses:
 *       200:
 *         description: List of tweets
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: number
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Tweet'
 */
export const getTweets = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter: any = {};

    if (req.query.username) {
      filter["author.username"] = req.query.username;
    }

    if (req.query.hashtag) {
      filter.hashtags = { $in: [req.query.hashtag] };
    }

    const tweets = await Tweet.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Tweet.countDocuments(filter);

    return res.status(200).json({
      success: true,
      count: tweets.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: tweets,
    });
  }
);

/**
 * @swagger
 * /api/tweets/{id}:
 *   get:
 *     summary: Get tweet by ID
 *     tags: [Tweets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tweet ID
 *     responses:
 *       200:
 *         description: Tweet found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Tweet'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
export const getTweet = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const tweet = await Tweet.findById(req.params.id);

    if (!tweet) {
      return res.status(404).json({
        success: false,
        error: "Tweet not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: tweet,
    });
  }
);

/**
 * @swagger
 * /api/tweets/stats:
 *   get:
 *     summary: Get tweet statistics
 *     tags: [Tweets]
 *     responses:
 *       200:
 *         description: Tweet statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalTweets:
 *                       type: number
 *                     totalUsers:
 *                       type: number
 *                     topHashtags:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           hashtag:
 *                             type: string
 *                           count:
 *                             type: number
 *                     topUsers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           username:
 *                             type: string
 *                           tweetCount:
 *                             type: number
 */
export const getTweetStats = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const totalTweets = await Tweet.countDocuments();

    const totalUsers = await Tweet.distinct("author.username").then(
      (usernames) => usernames.length
    );

    // Get top hashtags
    const hashtagStats = await Tweet.aggregate([
      { $unwind: "$hashtags" },
      { $group: { _id: "$hashtags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $project: { hashtag: "$_id", count: 1, _id: 0 } },
    ]);

    // Get top users by tweet count
    const userStats = await Tweet.aggregate([
      { $group: { _id: "$author.username", tweetCount: { $sum: 1 } } },
      { $sort: { tweetCount: -1 } },
      { $limit: 10 },
      { $project: { username: "$_id", tweetCount: 1, _id: 0 } },
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalTweets,
        totalUsers,
        topHashtags: hashtagStats,
        topUsers: userStats,
      },
    });
  }
);

/**
 * @swagger
 * /api/tweets/fetch:
 *   post:
 *     summary: Manually trigger tweet fetching
 *     tags: [Tweets]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               usernames:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of usernames to fetch tweets from
 *     responses:
 *       200:
 *         description: Tweet fetching triggered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */
export const fetchTweets = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { usernames } = req.body;

    try {
      await cronService.triggerTweetFetching(usernames);

      return res.status(200).json({
        success: true,
        message: "Tweet fetching completed successfully",
      });
    } catch (error) {
      logger.error("Error in manual tweet fetching:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch tweets",
      });
    }
  }
);

/**
 * @swagger
 * /api/tweets/monitoring:
 *   get:
 *     summary: Get current monitoring list
 *     tags: [Tweets]
 *     responses:
 *       200:
 *         description: Current monitoring list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: string
 */
export const getMonitoringList = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const monitoringList = cronService.getMonitoringList();

    return res.status(200).json({
      success: true,
      data: monitoringList,
    });
  }
);

/**
 * @swagger
 * /api/tweets/monitoring:
 *   post:
 *     summary: Add username to monitoring list
 *     tags: [Tweets]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *             properties:
 *               username:
 *                 type: string
 *                 description: Username to add to monitoring
 *     responses:
 *       200:
 *         description: Username added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */
export const addToMonitoring = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({
        success: false,
        error: "Username is required",
      });
    }

    cronService.addUsernameToMonitor(username);

    return res.status(200).json({
      success: true,
      message: `Added ${username} to monitoring list`,
    });
  }
);

/**
 * @swagger
 * /api/tweets/monitoring/{username}:
 *   delete:
 *     summary: Remove username from monitoring list
 *     tags: [Tweets]
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *         description: Username to remove from monitoring
 *     responses:
 *       200:
 *         description: Username removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */
export const removeFromMonitoring = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { username } = req.params;

    cronService.removeUsernameFromMonitor(username);

    return res.status(200).json({
      success: true,
      message: `Removed ${username} from monitoring list`,
    });
  }
);

/**
 * @swagger
 * /api/tweets/cron/status:
 *   get:
 *     summary: Get cron job status
 *     tags: [Tweets]
 *     responses:
 *       200:
 *         description: Cron job status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   additionalProperties:
 *                     type: boolean
 */
export const getCronStatus = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const status = cronService.getJobStatus();

    return res.status(200).json({
      success: true,
      data: status,
    });
  }
);

/**
 * @swagger
 * /api/tweets/cron/stop:
 *   post:
 *     tags: [Tweets]
 *     summary: Stop all cron jobs
 *     description: Stops all scheduled cron jobs including tweet fetching and web3 content fetching
 *     responses:
 *       200:
 *         description: Cron jobs stopped successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */
export const stopCronJobs = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    cronService.stopAllJobs();

    return res.status(200).json({
      success: true,
      message: "All cron jobs stopped successfully",
    });
  }
);

/**
 * @swagger
 * /api/tweets/cron/start:
 *   post:
 *     tags: [Tweets]
 *     summary: Start all cron jobs
 *     description: Starts all scheduled cron jobs including tweet fetching and web3 content fetching
 *     responses:
 *       200:
 *         description: Cron jobs started successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */
export const startCronJobs = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    await cronService.restartAllJobs();

    return res.status(200).json({
      success: true,
      message: "All cron jobs started successfully",
    });
  }
);
