import { Router, Request, Response } from "express";

const router = Router();

/**
 * @swagger
 * components:
 *   responses:
 *     SuccessResponse:
 *       description: Success response
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: true
 *               data:
 *                 type: object
 *               message:
 *                 type: string
 *     ErrorResponse:
 *       description: Error response
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: false
 *               error:
 *                 type: string
 *               message:
 *                 type: string
 */

/**
 * @swagger
 * /api:
 *   get:
 *     summary: API Information
 *     description: Get API information and available routes
 *     tags: [General]
 *     responses:
 *       200:
 *         description: API information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "API is working"
 *                 version:
 *                   type: string
 *                   example: "v1"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 availableRoutes:
 *                   type: array
 *                   items:
 *                     type: string
 */
router.get("/", (req: Request, res: Response) => {
  res.json({
    message: "API is working",
    version: process.env.API_VERSION || "v1",
    timestamp: new Date().toISOString(),
    availableRoutes: [
      // General user routes
      "GET /api/users",
      "POST /api/users",
      "GET /api/users/:id",
      "PUT /api/users/:id",
      "DELETE /api/users/:id",
      // Graph Protocol routes
      "POST /api/graph/space - Create a space",
      "GET /api/graph/space/:spaceId - Get space by ID",
      "GET /api/graph/spaces - Get my spaces",
      "GET /api/graph/spaces/:editorAddress - Get spaces by editor",
      "GET /api/graph/spaces/:editorAddress/full-data - Get all user data with entities",
      "GET /api/graph/entities/:spaceId - Get entities in space",
      "GET /api/graph/entity/:entityId - Get specific entity",
      "POST /api/graph/entity - Create an entity (optionally publish to IPFS)",
      "POST /api/graph/image - Create an image",
      "POST /api/graph/type - Create a type",
      "POST /api/graph/property - Create a property",
      "POST /api/graph/publish - Publish edit to IPFS",
      "POST /api/graph/publish-complete - Full publish with blockchain tx",
      "POST /api/graph/edit/calldata - Get edit calldata",
      "POST /api/graph/transaction - Execute transaction",
      "POST /api/graph/full-flow - Demo complete flow",
      "GET /api/graph/generate-id - Generate a new ID",
      // New subgraph endpoints
      "POST /api/graph/subgraph - Create a subgraph",
      "GET /api/graph/subgraphs/:ownerAddress - Get subgraphs by owner",
      "GET /api/graph/subgraph/:subgraphId - Get specific subgraph",
      "PUT /api/graph/subgraph/:subgraphId - Update subgraph",
      "DELETE /api/graph/subgraph/:subgraphId - Delete subgraph",
      "POST /api/graph/subgraph/:subgraphId/deploy - Deploy subgraph",
      "GET /api/graph/subgraph/:subgraphId/status - Get subgraph status",
      "POST /api/graph/subgraph/:subgraphId/query - Query subgraph with GraphQL",
      "GET /api/graph/subgraph/:subgraphId/schema - Get subgraph schema",
      "POST /api/graph/fill-data - Fill data with sample project",
    ],
  });
});

export { router as apiRoutes };
