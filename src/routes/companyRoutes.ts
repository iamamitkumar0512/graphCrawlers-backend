import { Router } from "express";
import companyController from "../controllers/companyController";
import { asyncHandler } from "../middleware/asyncHandler";

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Companies
 *     description: Company management endpoints
 *   - name: Paragraphs
 *     description: Paragraph data management endpoints
 */

// Company CRUD routes
router.get("/", asyncHandler(companyController.getAllCompanies));
router.get("/:id", asyncHandler(companyController.getCompanyById));
router.post("/", asyncHandler(companyController.createCompany));
router.put("/:id", asyncHandler(companyController.updateCompany));
router.delete("/:id", asyncHandler(companyController.deleteCompany));

// Paragraph routes
router.get(
  "/:companyName/paragraphs",
  asyncHandler(companyController.getCompanyParagraphs)
);
router.patch(
  "/:companyName/paragraphs/:id/process",
  asyncHandler(companyController.markParagraphAsProcessed)
);
router.patch(
  "/:companyName/paragraphs/bulk-process",
  asyncHandler(companyController.bulkMarkParagraphsAsProcessed)
);

// Scraping route
router.post(
  "/:companyName/scrape",
  asyncHandler(companyController.scrapeCompanyContent)
);

export default router;
