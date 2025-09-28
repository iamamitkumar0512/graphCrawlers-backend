/**
 * Company Routes Module
 *
 * This module defines all HTTP routes related to company management and
 * content scraping operations. It includes CRUD operations for companies
 * and paragraph management endpoints.
 */

import { Router } from "express";
import companyController from "../controllers/companyController";
import { asyncHandler } from "../middleware/asyncHandler";

// Create Express router instance
const router = Router();

/**
 * Swagger API Documentation Tags
 *
 * @swagger
 * tags:
 *   - name: Companies
 *     description: Company management endpoints
 *   - name: Paragraphs
 *     description: Paragraph data management endpoints
 */

// ==================== COMPANY CRUD ROUTES ====================

/**
 * GET /api/companies
 * Get all companies with pagination and filtering
 */
router.get("/", asyncHandler(companyController.getAllCompanies));

/**
 * GET /api/companies/:id
 * Get a specific company by ID
 */
router.get("/:id", asyncHandler(companyController.getCompanyById));

/**
 * POST /api/companies
 * Create a new company
 */
router.post("/", asyncHandler(companyController.createCompany));

/**
 * PUT /api/companies/:id
 * Update an existing company
 */
router.put("/:id", asyncHandler(companyController.updateCompany));

/**
 * DELETE /api/companies/:id
 * Delete a company and its associated data
 */
router.delete("/:id", asyncHandler(companyController.deleteCompany));

// ==================== PARAGRAPH MANAGEMENT ROUTES ====================

/**
 * GET /api/companies/:companyName/paragraphs
 * Get all paragraphs for a specific company with filtering options
 */
router.get(
  "/:companyName/paragraphs",
  asyncHandler(companyController.getCompanyParagraphs)
);

/**
 * PATCH /api/companies/:companyName/paragraphs/:id/process
 * Mark a single paragraph as processed
 */
router.patch(
  "/:companyName/paragraphs/:id/process",
  asyncHandler(companyController.markParagraphAsProcessed)
);

/**
 * PATCH /api/companies/:companyName/paragraphs/bulk-process
 * Mark multiple paragraphs as processed in bulk
 */
router.patch(
  "/:companyName/paragraphs/bulk-process",
  asyncHandler(companyController.bulkMarkParagraphsAsProcessed)
);

// ==================== CONTENT SCRAPING ROUTES ====================

/**
 * POST /api/companies/:companyName/scrape
 * Trigger content scraping for a company from specified platforms
 */
router.post(
  "/:companyName/scrape",
  asyncHandler(companyController.scrapeCompanyContent)
);

// Export the configured router
export default router;
