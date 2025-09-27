import { Request, Response } from "express";
import Web3Post, { IWeb3Post } from "../models/Web3Post";
import web3ScraperService from "../services/web3ScraperService";
import cronService from "../services/cronService";
import { logger } from "../utils/logger";

/**
 * @swagger
 * components:
 *   schemas:
 *     Web3Post:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier
 *         postId:
 *           type: string
 *           description: Platform-specific post ID
 *         title:
 *           type: string
 *           description: Post title
 *         content:
 *           type: string
 *           description: Post content
 *         excerpt:
 *           type: string
 *           description: Post excerpt
 *         author:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *             username:
 *               type: string
 *             profileUrl:
 *               type: string
 *             avatarUrl:
 *               type: string
 *         platform:
 *           type: string
 *           enum: [medium, mirror, pyarzgraph]
 *           description: Source platform
 *         url:
 *           type: string
 *           description: Original post URL
 *         publishedAt:
 *           type: string
 *           format: date-time
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         metrics:
 *           type: object
 *           properties:
 *             claps:
 *               type: number
 *             views:
 *               type: number
 *             comments:
 *               type: number
 *             shares:
 *               type: number
 *         company:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *             slug:
 *               type: string
 *             website:
 *               type: string
 *             twitter:
 *               type: string
 *         featuredImage:
 *           type: string
 *         readingTime:
 *           type: number
 *         fetchedAt:
 *           type: string
 *           format: date-time
 */

class Web3Controller {
  /**
   * @swagger
   * /api/web3/posts:
   *   get:
   *     summary: Get all web3 posts
   *     tags: [Web3 Posts]
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
   *         description: Number of posts per page
   *       - in: query
   *         name: platform
   *         schema:
   *           type: string
   *           enum: [medium, mirror, pyarzgraph]
   *         description: Filter by platform
   *       - in: query
   *         name: company
   *         schema:
   *           type: string
   *         description: Filter by company slug
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Search in title and content
   *     responses:
   *       200:
   *         description: List of web3 posts
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
   *                     posts:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/Web3Post'
   *                     pagination:
   *                       type: object
   *                       properties:
   *                         currentPage:
   *                           type: number
   *                         totalPages:
   *                           type: number
   *                         totalPosts:
   *                           type: number
   *                         hasNext:
   *                           type: boolean
   *                         hasPrev:
   *                           type: boolean
   */
  async getAllPosts(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const platform = req.query.platform as string;
      const company = req.query.company as string;
      const search = req.query.search as string;

      // Build filter object
      const filter: any = {};
      if (platform) filter.platform = platform;
      if (company) filter["company.slug"] = company;
      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: "i" } },
          { content: { $regex: search, $options: "i" } },
          { tags: { $in: [new RegExp(search, "i")] } },
        ];
      }

      const skip = (page - 1) * limit;

      // Get posts and total count
      const [posts, totalPosts] = await Promise.all([
        Web3Post.find(filter)
          .sort({ publishedAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Web3Post.countDocuments(filter),
      ]);

      const totalPages = Math.ceil(totalPosts / limit);

      res.status(200).json({
        success: true,
        data: {
          posts,
          pagination: {
            currentPage: page,
            totalPages,
            totalPosts,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
        },
      });
    } catch (error) {
      logger.error("Error fetching web3 posts:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * @swagger
   * /api/web3/posts/{id}:
   *   get:
   *     summary: Get a specific web3 post
   *     tags: [Web3 Posts]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Post ID
   *     responses:
   *       200:
   *         description: Web3 post details
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   $ref: '#/components/schemas/Web3Post'
   *       404:
   *         description: Post not found
   */
  async getPostById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const post = await Web3Post.findById(id).lean();

      if (!post) {
        res.status(404).json({
          success: false,
          message: "Post not found",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: post,
      });
    } catch (error) {
      logger.error("Error fetching web3 post:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * @swagger
   * /api/web3/companies:
   *   get:
   *     summary: Get all monitored web3 companies
   *     tags: [Web3 Companies]
   *     responses:
   *       200:
   *         description: List of web3 companies
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
   *                     type: object
   *                     properties:
   *                       name:
   *                         type: string
   *                       slug:
   *                         type: string
   *                       website:
   *                         type: string
   *                       twitter:
   *                         type: string
   */
  async getCompanies(req: Request, res: Response): Promise<void> {
    try {
      const companies = await web3ScraperService.getWeb3Companies();

      res.status(200).json({
        success: true,
        data: companies,
      });
    } catch (error) {
      logger.error("Error fetching web3 companies:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * @swagger
   * /api/web3/posts/company/{slug}:
   *   get:
   *     summary: Get posts by company
   *     tags: [Web3 Posts]
   *     parameters:
   *       - in: path
   *         name: slug
   *         required: true
   *         schema:
   *           type: string
   *         description: Company slug
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
   *         description: Number of posts per page
   *       - in: query
   *         name: platform
   *         schema:
   *           type: string
   *           enum: [medium, mirror, pyarzgraph]
   *         description: Filter by platform
   *     responses:
   *       200:
   *         description: Posts by company
   */
  async getPostsByCompany(req: Request, res: Response): Promise<void> {
    try {
      const { slug } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const platform = req.query.platform as string;

      const filter: any = { "company.slug": slug };
      if (platform) filter.platform = platform;

      const skip = (page - 1) * limit;

      const [posts, totalPosts] = await Promise.all([
        Web3Post.find(filter)
          .sort({ publishedAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Web3Post.countDocuments(filter),
      ]);

      const totalPages = Math.ceil(totalPosts / limit);

      res.status(200).json({
        success: true,
        data: {
          posts,
          pagination: {
            currentPage: page,
            totalPages,
            totalPosts,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
        },
      });
    } catch (error) {
      logger.error("Error fetching posts by company:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * @swagger
   * /api/web3/posts/platform/{platform}:
   *   get:
   *     summary: Get posts by platform
   *     tags: [Web3 Posts]
   *     parameters:
   *       - in: path
   *         name: platform
   *         required: true
   *         schema:
   *           type: string
   *           enum: [medium, mirror, pyarzgraph]
   *         description: Platform name
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
   *         description: Number of posts per page
   *     responses:
   *       200:
   *         description: Posts by platform
   */
  async getPostsByPlatform(req: Request, res: Response): Promise<void> {
    try {
      const { platform } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      if (!["medium", "mirror", "pyarzgraph"].includes(platform)) {
        res.status(400).json({
          success: false,
          message:
            "Invalid platform. Must be one of: medium, mirror, pyarzgraph",
        });
        return;
      }

      const skip = (page - 1) * limit;

      const [posts, totalPosts] = await Promise.all([
        Web3Post.find({ platform })
          .sort({ publishedAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Web3Post.countDocuments({ platform }),
      ]);

      const totalPages = Math.ceil(totalPosts / limit);

      res.status(200).json({
        success: true,
        data: {
          posts,
          pagination: {
            currentPage: page,
            totalPages,
            totalPosts,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
        },
      });
    } catch (error) {
      logger.error("Error fetching posts by platform:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * @swagger
   * /api/web3/posts/trending:
   *   get:
   *     summary: Get trending web3 posts
   *     tags: [Web3 Posts]
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 10
   *         description: Number of posts to return
   *       - in: query
   *         name: days
   *         schema:
   *           type: integer
   *           default: 7
   *         description: Number of days to look back
   *     responses:
   *       200:
   *         description: Trending posts
   */
  async getTrendingPosts(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const days = parseInt(req.query.days as string) || 7;

      const dateThreshold = new Date();
      dateThreshold.setDate(dateThreshold.getDate() - days);

      const posts = await Web3Post.find({
        publishedAt: { $gte: dateThreshold },
      })
        .sort({ "metrics.claps": -1, publishedAt: -1 })
        .limit(limit)
        .lean();

      res.status(200).json({
        success: true,
        data: posts,
      });
    } catch (error) {
      logger.error("Error fetching trending posts:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * @swagger
   * /api/web3/fetch:
   *   post:
   *     summary: Manually trigger web3 content fetching
   *     tags: [Web3 Management]
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               maxPostsPerCompany:
   *                 type: integer
   *                 default: 5
   *                 description: Maximum posts to fetch per company
   *     responses:
   *       200:
   *         description: Fetching started successfully
   *       500:
   *         description: Internal server error
   */
  async triggerFetching(req: Request, res: Response): Promise<void> {
    try {
      const { maxPostsPerCompany } = req.body;

      // Trigger fetching in background
      cronService.triggerWeb3ContentFetching(maxPostsPerCompany);

      res.status(200).json({
        success: true,
        message: "Web3 content fetching started",
      });
    } catch (error) {
      logger.error("Error triggering web3 content fetching:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * @swagger
   * /api/web3/stats:
   *   get:
   *     summary: Get web3 content statistics
   *     tags: [Web3 Statistics]
   *     responses:
   *       200:
   *         description: Statistics data
   */
  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const [totalPosts, postsByPlatform, postsByCompany, recentPosts] =
        await Promise.all([
          Web3Post.countDocuments(),
          Web3Post.aggregate([
            { $group: { _id: "$platform", count: { $sum: 1 } } },
          ]),
          Web3Post.aggregate([
            { $group: { _id: "$company.name", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
          ]),
          Web3Post.countDocuments({
            publishedAt: {
              $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          }),
        ]);

      res.status(200).json({
        success: true,
        data: {
          totalPosts,
          postsByPlatform,
          topCompanies: postsByCompany,
          recentPosts,
        },
      });
    } catch (error) {
      logger.error("Error fetching web3 stats:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}

export default new Web3Controller();
