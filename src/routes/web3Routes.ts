import { Router } from "express";
import web3Controller from "../controllers/web3Controller";
import { asyncHandler } from "../middleware/asyncHandler";

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Web3 Posts
 *     description: Web3 content management endpoints
 *   - name: Web3 Companies
 *     description: Web3 companies management endpoints
 *   - name: Web3 Management
 *     description: Web3 content fetching and management endpoints
 *   - name: Web3 Statistics
 *     description: Web3 content statistics endpoints
 */

// Web3 Posts routes
router.get("/posts", asyncHandler(web3Controller.getAllPosts));
router.get("/posts/trending", asyncHandler(web3Controller.getTrendingPosts));
router.get("/posts/:id", asyncHandler(web3Controller.getPostById));
router.get(
  "/posts/company/:slug",
  asyncHandler(web3Controller.getPostsByCompany)
);
router.get(
  "/posts/platform/:platform",
  asyncHandler(web3Controller.getPostsByPlatform)
);

// Web3 Companies routes
router.get("/companies", asyncHandler(web3Controller.getCompanies));

// Web3 Management routes
router.post("/fetch", asyncHandler(web3Controller.triggerFetching));

// Web3 Statistics routes
router.get("/stats", asyncHandler(web3Controller.getStats));

export default router;
