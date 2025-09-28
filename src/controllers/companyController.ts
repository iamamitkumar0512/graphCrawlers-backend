/**
 * Company Controller
 *
 * This controller handles all HTTP requests related to company management and
 * content scraping operations. It provides CRUD operations for companies and
 * manages the relationship between companies and their scraped content.
 */

import { Request, Response } from "express";
import Company, { ICompany } from "../models/Company";
import Paragraph, { IParagraph } from "../models/Paragraph";
import web3ScraperService from "../services/web3ScraperService";
import { logger } from "../utils/logger";

/**
 * @swagger
 * components:
 *   schemas:
 *     Company:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier
 *         companyName:
 *           type: string
 *           description: Company name
 *         publicSpaceId:
 *           type: string
 *           description: Public space ID
 *         mediumLink:
 *           type: string
 *           description: Medium profile link
 *         paragraphLink:
 *           type: string
 *           description: Paragraph profile link
 *         mirrorLink:
 *           type: string
 *           description: Mirror profile link
 *         isActive:
 *           type: boolean
 *           description: Whether company is active
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     Paragraph:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier
 *         companyName:
 *           type: string
 *           description: Company name
 *         platform:
 *           type: string
 *           enum: [medium, paragraph, mirror]
 *           description: Platform name
 *         postData:
 *           type: object
 *           properties:
 *             postId:
 *               type: string
 *             title:
 *               type: string
 *             content:
 *               type: string
 *             excerpt:
 *               type: string
 *             author:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                 username:
 *                   type: string
 *                 profileUrl:
 *                   type: string
 *                 avatarUrl:
 *                   type: string
 *             url:
 *               type: string
 *             publishedAt:
 *               type: string
 *               format: date-time
 *             tags:
 *               type: array
 *               items:
 *                 type: string
 *             metrics:
 *               type: object
 *               properties:
 *                 claps:
 *                   type: number
 *                 views:
 *                   type: number
 *                 comments:
 *                   type: number
 *                 shares:
 *                   type: number
 *             featuredImage:
 *               type: string
 *             readingTime:
 *               type: number
 *         processed:
 *           type: boolean
 *           description: Whether post has been processed
 *         fetchedAt:
 *           type: string
 *           format: date-time
 *         processedAt:
 *           type: string
 *           format: date-time
 */

/**
 * Company Controller Class
 *
 * Contains all methods for handling company-related HTTP requests including
 * CRUD operations, content scraping, and paragraph management.
 */
class CompanyController {
  /**
   * Get all companies with pagination and filtering
   *
   * @swagger
   * /api/companies:
   *   get:
   *     summary: Get all companies
   *     tags: [Companies]
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
   *         description: Number of companies per page
   *       - in: query
   *         name: active
   *         schema:
   *           type: boolean
   *         description: Filter by active status
   *     responses:
   *       200:
   *         description: List of companies
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
   *                     companies:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/Company'
   *                     pagination:
   *                       type: object
   *                       properties:
   *                         currentPage:
   *                           type: number
   *                         totalPages:
   *                           type: number
   *                         totalCompanies:
   *                           type: number
   *                         hasNext:
   *                           type: boolean
   *                         hasPrev:
   *                           type: boolean
   */
  async getAllCompanies(req: Request, res: Response): Promise<void> {
    try {
      // Parse query parameters with defaults
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const active = req.query.active as string;

      // Build filter object based on query parameters
      const filter: any = {};
      if (active !== undefined) {
        filter.isActive = active === "true";
      }

      // Calculate skip value for pagination
      const skip = (page - 1) * limit;

      // Fetch companies and total count in parallel for better performance
      const [companies, totalCompanies] = await Promise.all([
        Company.find(filter)
          .sort({ createdAt: -1 }) // Sort by newest first
          .skip(skip)
          .limit(limit)
          .lean(), // Use lean() for better performance
        Company.countDocuments(filter),
      ]);

      // Calculate pagination metadata
      const totalPages = Math.ceil(totalCompanies / limit);

      res.status(200).json({
        success: true,
        data: {
          companies,
          pagination: {
            currentPage: page,
            totalPages,
            totalCompanies,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
        },
      });
    } catch (error) {
      logger.error("Error fetching companies:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Get a specific company by ID
   *
   * @swagger
   * /api/companies/{id}:
   *   get:
   *     summary: Get a specific company
   *     tags: [Companies]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Company ID
   *     responses:
   *       200:
   *         description: Company details
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   $ref: '#/components/schemas/Company'
   *       404:
   *         description: Company not found
   */
  async getCompanyById(req: Request, res: Response): Promise<void> {
    try {
      // Extract company ID from URL parameters
      const { id } = req.params;

      // Find company by ID
      const company = await Company.findById(id).lean();

      // Return 404 if company not found
      if (!company) {
        res.status(404).json({
          success: false,
          message: "Company not found",
        });
        return;
      }

      // Return company data
      res.status(200).json({
        success: true,
        data: company,
      });
    } catch (error) {
      logger.error("Error fetching company:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Create a new company
   *
   * @swagger
   * /api/companies:
   *   post:
   *     summary: Create a new company
   *     tags: [Companies]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - companyName
   *             properties:
   *               companyName:
   *                 type: string
   *                 description: Company name
   *               publicSpaceId:
   *                 type: string
   *                 description: Public space ID
   *               mediumLink:
   *                 type: string
   *                 description: Medium profile link
   *               paragraphLink:
   *                 type: string
   *                 description: Paragraph profile link
   *               mirrorLink:
   *                 type: string
   *                 description: Mirror profile link
   *               isActive:
   *                 type: boolean
   *                 default: true
   *     responses:
   *       201:
   *         description: Company created successfully
   *       400:
   *         description: Validation error
   *       409:
   *         description: Company already exists
   */
  async createCompany(req: Request, res: Response): Promise<void> {
    try {
      // Extract company data from request body
      const {
        companyName,
        publicSpaceId,
        mediumLink,
        paragraphLink,
        mirrorLink,
        isActive = true,
      } = req.body;

      // Check if company with the same name already exists
      const existingCompany = await Company.findOne({ companyName });
      if (existingCompany) {
        res.status(409).json({
          success: false,
          message: "Company with this name already exists",
        });
        return;
      }

      // Create new company instance
      const company = new Company({
        companyName,
        publicSpaceId,
        mediumLink,
        paragraphLink,
        mirrorLink,
        isActive,
      });

      // Save company to database
      const savedCompany = await company.save();

      res.status(201).json({
        success: true,
        message: "Company created successfully",
        data: savedCompany,
      });
    } catch (error) {
      logger.error("Error creating company:", error);
      // Handle validation errors specifically
      if (error instanceof Error && error.message.includes("validation")) {
        res.status(400).json({
          success: false,
          message: "Validation error",
          error: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Internal server error",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  }

  /**
   * @swagger
   * /api/companies/{id}:
   *   put:
   *     summary: Update a company
   *     tags: [Companies]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Company ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               companyName:
   *                 type: string
   *               publicSpaceId:
   *                 type: string
   *               mediumLink:
   *                 type: string
   *               paragraphLink:
   *                 type: string
   *               mirrorLink:
   *                 type: string
   *               isActive:
   *                 type: boolean
   *     responses:
   *       200:
   *         description: Company updated successfully
   *       404:
   *         description: Company not found
   *       400:
   *         description: Validation error
   */
  async updateCompany(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Check if company exists
      const existingCompany = await Company.findById(id);
      if (!existingCompany) {
        res.status(404).json({
          success: false,
          message: "Company not found",
        });
        return;
      }

      // If companyName is being updated, check for duplicates
      if (
        updateData.companyName &&
        updateData.companyName !== existingCompany.companyName
      ) {
        const duplicateCompany = await Company.findOne({
          companyName: updateData.companyName,
          _id: { $ne: id },
        });
        if (duplicateCompany) {
          res.status(409).json({
            success: false,
            message: "Company with this name already exists",
          });
          return;
        }
      }

      const updatedCompany = await Company.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      }).lean();

      res.status(200).json({
        success: true,
        message: "Company updated successfully",
        data: updatedCompany,
      });
    } catch (error) {
      logger.error("Error updating company:", error);
      if (error instanceof Error && error.message.includes("validation")) {
        res.status(400).json({
          success: false,
          message: "Validation error",
          error: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Internal server error",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  }

  /**
   * @swagger
   * /api/companies/{id}:
   *   delete:
   *     summary: Delete a company
   *     tags: [Companies]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Company ID
   *     responses:
   *       200:
   *         description: Company deleted successfully
   *       404:
   *         description: Company not found
   */
  async deleteCompany(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const company = await Company.findByIdAndDelete(id);
      if (!company) {
        res.status(404).json({
          success: false,
          message: "Company not found",
        });
        return;
      }

      // Also delete associated paragraph data
      await Paragraph.deleteMany({ companyName: company.companyName });

      res.status(200).json({
        success: true,
        message: "Company and associated data deleted successfully",
      });
    } catch (error) {
      logger.error("Error deleting company:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * @swagger
   * /api/companies/{companyName}/paragraphs:
   *   get:
   *     summary: Get paragraphs for a specific company
   *     tags: [Paragraphs]
   *     parameters:
   *       - in: path
   *         name: companyName
   *         required: true
   *         schema:
   *           type: string
   *         description: Company name
   *       - in: query
   *         name: platform
   *         schema:
   *           type: string
   *           enum: [medium, paragraph, mirror]
   *         description: Filter by platform
   *       - in: query
   *         name: processed
   *         schema:
   *           type: boolean
   *         description: Filter by processed status
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
   *         description: Number of paragraphs per page
   *     responses:
   *       200:
   *         description: List of paragraphs
   */
  async getCompanyParagraphs(req: Request, res: Response): Promise<void> {
    try {
      const { companyName } = req.params;
      const platform = req.query.platform as string;
      const processed = req.query.processed as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      // Build filter object
      const filter: any = { companyName };
      if (platform) filter.platform = platform;
      if (processed !== undefined) filter.processed = processed === "true";

      const skip = (page - 1) * limit;

      // Get paragraphs and total count
      const [paragraphs, totalParagraphs] = await Promise.all([
        Paragraph.find(filter)
          .sort({ "postData.publishedAt": -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Paragraph.countDocuments(filter),
      ]);

      const totalPages = Math.ceil(totalParagraphs / limit);

      res.status(200).json({
        success: true,
        data: {
          paragraphs,
          pagination: {
            currentPage: page,
            totalPages,
            totalParagraphs,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
        },
      });
    } catch (error) {
      logger.error("Error fetching company paragraphs:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * @swagger
   * /api/companies/{companyName}/paragraphs/{id}/process:
   *   patch:
   *     summary: Mark a paragraph as processed
   *     tags: [Paragraphs]
   *     parameters:
   *       - in: path
   *         name: companyName
   *         required: true
   *         schema:
   *           type: string
   *         description: Company name
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Paragraph ID
   *     responses:
   *       200:
   *         description: Paragraph marked as processed
   *       404:
   *         description: Paragraph not found
   */
  async markParagraphAsProcessed(req: Request, res: Response): Promise<void> {
    try {
      const { companyName, id } = req.params;

      const paragraph = await Paragraph.findOneAndUpdate(
        { _id: id, companyName },
        { processed: true, processedAt: new Date() },
        { new: true }
      ).lean();

      if (!paragraph) {
        res.status(404).json({
          success: false,
          message: "Paragraph not found",
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Paragraph marked as processed",
        data: paragraph,
      });
    } catch (error) {
      logger.error("Error marking paragraph as processed:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * @swagger
   * /api/companies/{companyName}/paragraphs/bulk-process:
   *   patch:
   *     summary: Mark multiple paragraphs as processed
   *     tags: [Paragraphs]
   *     parameters:
   *       - in: path
   *         name: companyName
   *         required: true
   *         schema:
   *           type: string
   *         description: Company name
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               paragraphIds:
   *                 type: array
   *                 items:
   *                   type: string
   *                 description: Array of paragraph IDs to mark as processed
   *     responses:
   *       200:
   *         description: Paragraphs marked as processed
   */
  async bulkMarkParagraphsAsProcessed(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { companyName } = req.params;
      const { paragraphIds } = req.body;

      if (!Array.isArray(paragraphIds) || paragraphIds.length === 0) {
        res.status(400).json({
          success: false,
          message: "paragraphIds must be a non-empty array",
        });
        return;
      }

      const result = await Paragraph.updateMany(
        { _id: { $in: paragraphIds }, companyName },
        { processed: true, processedAt: new Date() }
      );

      res.status(200).json({
        success: true,
        message: `${result.modifiedCount} paragraphs marked as processed`,
        data: {
          modifiedCount: result.modifiedCount,
        },
      });
    } catch (error) {
      logger.error("Error bulk marking paragraphs as processed:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Scrape content for a specific company from a specified platform
   *
   * This method triggers content scraping for a company from platforms like
   * Medium, Paragraph, or Mirror. It validates the company exists and calls
   * the web3ScraperService to perform the actual scraping.
   *
   * @swagger
   * /api/companies/{companyName}/scrape:
   *   post:
   *     summary: Scrape content for a specific company and platform
   *     tags: [Companies]
   *     parameters:
   *       - in: path
   *         name: companyName
   *         required: true
   *         schema:
   *           type: string
   *         description: Company name
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - platform
   *             properties:
   *               platform:
   *                 type: string
   *                 enum: [medium, paragraph, mirror]
   *                 description: Platform to scrape from
   *               maxPosts:
   *                 type: integer
   *                 default: 10
   *                 description: Maximum number of posts to scrape
   *     responses:
   *       200:
   *         description: Scraping completed successfully
   *       400:
   *         description: Invalid platform or missing company
   *       404:
   *         description: Company not found
   */
  async scrapeCompanyContent(req: Request, res: Response): Promise<void> {
    try {
      // Extract parameters from request
      const { companyName } = req.params;
      const { platform, maxPosts = 10 } = req.body;

      // Validate platform parameter
      if (!platform || !["medium", "paragraph", "mirror"].includes(platform)) {
        res.status(400).json({
          success: false,
          message: "Platform must be one of: medium, paragraph, mirror",
        });
        return;
      }

      // Verify company exists and is active
      const company = await Company.findOne({
        companyName,
        isActive: true,
      });

      if (!company) {
        res.status(404).json({
          success: false,
          message: "Company not found or inactive",
        });
        return;
      }

      // Trigger content scraping using web3ScraperService
      const scrapedParagraphs =
        await web3ScraperService.scrapeCompanyByPlatform(
          companyName,
          platform,
          maxPosts
        );

      // Return scraping results
      res.status(200).json({
        success: true,
        message: `Successfully scraped ${scrapedParagraphs.length} ${platform} posts for ${companyName}`,
        data: {
          companyName,
          platform,
          scrapedCount: scrapedParagraphs.length,
          paragraphs: scrapedParagraphs,
        },
      });
    } catch (error) {
      logger.error("Error scraping company content:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}

export default new CompanyController();
