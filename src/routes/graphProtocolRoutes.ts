/**
 * Graph Protocol Routes Module
 *
 * This module defines all HTTP routes related to Graph Protocol integration.
 * It provides endpoints for managing spaces, entities, types, properties,
 * and publishing data to IPFS and blockchain networks.
 */

import { Router, Request, Response } from "express";
import { GraphProtocolService } from "../services/graphProtocol";

// Create Express router instance
const router = Router();

// Initialize Graph Protocol service
const graphService = new GraphProtocolService();

/**
 * Swagger API Documentation Tags for Graph Protocol
 *
 * @swagger
 * tags:
 *   - name: GraphProtocol - Spaces
 *     description: Graph Protocol space management endpoints
 *   - name: GraphProtocol - Entities
 *     description: Graph Protocol entity management endpoints
 *   - name: GraphProtocol - Images
 *     description: Graph Protocol image management endpoints
 *   - name: GraphProtocol - Types
 *     description: Graph Protocol type management endpoints
 *   - name: GraphProtocol - Properties
 *     description: Graph Protocol property management endpoints
 *   - name: GraphProtocol - Publishing
 *     description: Graph Protocol publishing endpoints
 *   - name: GraphProtocol - Transactions
 *     description: Graph Protocol transaction endpoints
 *   - name: GraphProtocol - Demo
 *     description: Graph Protocol demo endpoints
 *   - name: GraphProtocol - Utilities
 *     description: Graph Protocol utility endpoints
 */

/**
 * @swagger
 * /api/graph/space:
 *   post:
 *     summary: Create a new Space
 *     description: Create a new GraphProtocol space where entities can be published
 *     tags: [GraphProtocol - Spaces]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SpaceCreate'
 *           examples:
 *             example1:
 *               summary: Create a testnet space
 *               value:
 *                 editorAddress: "0x5616aD5f4623A99deb01c75325c9Ff64ECE96034"
 *                 name: "My Graph Space"
 *                 network: "TESTNET"
 *     responses:
 *       201:
 *         description: Space created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/responses/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         network:
 *                           type: string
 *       400:
 *         $ref: '#/components/responses/ErrorResponse'
 *       500:
 *         $ref: '#/components/responses/ErrorResponse'
 */
/**
 * POST /api/graph/space
 * Create a new Graph Protocol space
 */
router.post("/space", async (req: Request, res: Response) => {
  try {
    // Extract required parameters from request body
    const { editorAddress, name, network = "TESTNET" } = req.body;

    // Validate required fields
    if (!editorAddress || !name) {
      return res.status(400).json({
        success: false,
        error: "editorAddress and name are required",
      });
    }

    // Create space using Graph Protocol service
    const space = await graphService.createSpace(editorAddress, name, network);

    return res.status(201).json({
      success: true,
      data: space,
      message: "Space created successfully",
    });
  } catch (error) {
    console.error("Error creating space:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to create space",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * @swagger
 * /api/graph/entity:
 *   post:
 *     summary: Create an Entity
 *     description: Create a new entity that can be stored in a GraphProtocol space. Optionally publish operations to IPFS.
 *     tags: [GraphProtocol - Entities]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EntityCreate'
 *           examples:
 *             example1:
 *               summary: Create a product entity
 *               value:
 *                 name: "Product Entity"
 *                 description: "A product in our catalog"
 *                 types: ["product-type-id"]
 *                 cover: "image-123"
 *                 values: [{"property": "price", "value": "99.99"}]
 *             example2:
 *               summary: Create and publish to IPFS only
 *               value:
 *                 name: "Product Entity"
 *                 description: "A product in our catalog"
 *                 author: "0x5616aD5f4623A99deb01c75325c9Ff64ECE96034"
 *                 editName: "Creating Product Entity"
 *             example3:
 *               summary: Create and execute complete publication flow (IPFS + blockchain)
 *               value:
 *                 name: "Product Entity"
 *                 description: "A product in our catalog"
 *                 author: "0x5616aD5f4623A99deb01c75325c9Ff64ECE96034"
 *                 editName: "Creating Product Entity"
 *                 spaceId: "space-123-abc-def456"
 *                 network: "TESTNET"
 *     responses:
 *       201:
 *         description: Entity created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/responses/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         ops:
 *                           type: array
 *                         publishResult:
 *                           type: object
 *                           nullable: true
 *                           properties:
 *                             cid:
 *                               type: string
 *                               description: Content Identifier from IPFS publication (only present if author provided)
 *                             transactionHash:
 *                               type: string
 *                               description: Blockchain transaction hash (only present if spaceId provided with author)
 *                             toAddress:
 *                               type: string
 *                               description: Contract address for transaction (only present if spaceId provided)
 *                             calldata:
 *                               type: string
 *                               description: Transaction calldata (only present if spaceId provided)
 *       400:
 *         $ref: '#/components/responses/ErrorResponse'
 *       500:
 *         $ref: '#/components/responses/ErrorResponse'
 */
router.post("/entity", async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      types,
      cover,
      values,
      author,
      editName,
      spaceId,
      network,
    } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: "name is required",
      });
    }

    const entity = await graphService.createEntity(
      {
        name,
        description,
        types,
        cover,
        values,
      },
      author,
      editName,
      spaceId,
      network
    );

    return res.status(201).json({
      success: true,
      data: entity,
      message: "Entity created successfully",
    });
  } catch (error) {
    console.error("Error creating entity:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to create entity",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * @swagger
 * /api/graph/image:
 *   post:
 *     summary: Create an Image
 *     description: Upload and create an image that can be used as entity covers
 *     tags: [GraphProtocol - Images]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ImageCreate'
 *     responses:
 *       201:
 *         description: Image created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/responses/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         ops:
 *                           type: array
 *       400:
 *         $ref: '#/components/responses/ErrorResponse'
 *       500:
 *         $ref: '#/components/responses/ErrorResponse'
 */
router.post("/image", async (req: Request, res: Response) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: "url is required",
      });
    }

    const image = await graphService.createImage({ url });

    return res.status(201).json({
      success: true,
      data: image,
      message: "Image created successfully",
    });
  } catch (error) {
    console.error("Error creating image:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to create image",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * @swagger
 * /api/graph/type:
 *   post:
 *     summary: Create a Type
 *     description: Create a new type definition for entities
 *     tags: [GraphProtocol - Types]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TypeCreate'
 *     responses:
 *       201:
 *         description: Type created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/responses/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         ops:
 *                           type: array
 *       400:
 *         $ref: '#/components/responses/ErrorResponse'
 *       500:
 *         $ref: '#/components/responses/ErrorResponse'
 */
router.post("/type", async (req: Request, res: Response) => {
  try {
    const { name, cover, properties } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: "name is required",
      });
    }

    const type = await graphService.createType({
      name,
      cover,
      properties,
    });

    return res.status(201).json({
      success: true,
      data: type,
      message: "Type created successfully",
    });
  } catch (error) {
    console.error("Error creating type:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to create type",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * @swagger
 * /api/graph/property:
 *   post:
 *     summary: Create a Property
 *     description: Create a new property definition with a specific data type
 *     tags: [GraphProtocol - Properties]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PropertyCreate'
 *     responses:
 *       201:
 *         description: Property created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/responses/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         ops:
 *                           type: array
 *       400:
 *         $ref: '#/components/responses/ErrorResponse'
 *       500:
 *         $ref: '#/components/responses/ErrorResponse'
 */
router.post("/property", async (req: Request, res: Response) => {
  try {
    const { name, type } = req.body;

    if (!name || !type) {
      return res.status(400).json({
        success: false,
        error: "name and type are required",
      });
    }

    const validTypes = [
      "STRING",
      "NUMBER",
      "BOOLEAN",
      "TIME",
      "POINT",
      "RELATION",
    ];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error:
          "type must be one of: STRING, NUMBER, BOOLEAN, TIME, POINT, RELATION",
      });
    }

    const property = await graphService.createProperty({
      name,
      dataType: type,
    });

    return res.status(201).json({
      success: true,
      data: property,
      message: "Property created successfully",
    });
  } catch (error) {
    console.error("Error creating property:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to create property",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * @swagger
 * /api/graph/publish:
 *   post:
 *     summary: Publish Edit to IPFS
 *     description: Publish operations to IPFS without executing blockchain transaction
 *     tags: [GraphProtocol - Publishing]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PublishEdit'
 *     responses:
 *       201:
 *         description: Edit published to IPFS successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/responses/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         cid:
 *                           type: string
 *       400:
 *         $ref: '#/components/responses/ErrorResponse'
 *       500:
 *         $ref: '#/components/responses/ErrorResponse'
 */
router.post("/publish", async (req: Request, res: Response) => {
  try {
    const { ops, author, editName } = req.body;

    if (!ops || !author) {
      return res.status(400).json({
        success: false,
        error: "ops and author are required",
      });
    }

    const cid = await graphService.publishEdit(ops, author, editName);

    return res.status(201).json({
      success: true,
      data: { cid },
      message: "Edit published to IPFS successfully",
    });
  } catch (error) {
    console.error("Error publishing edit:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to publish edit",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * @swagger
 * /api/graph/publish-complete:
 *   post:
 *     summary: Complete Publication Flow
 *     description: Publish data to IPFS and execute blockchain transaction in one operation
 *     tags: [GraphProtocol - Publishing]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PublishComplete'
 *           examples:
 *             example1:
 *               summary: Complete publication
 *               value:
 *                 spaceId: "space-123"
 *                 ops: []
 *                 author: "0x5616aD5f4623A99deb01c75325c9Ff64ECE96034"
 *                 editName: "Product Creation"
 *                 network: "TESTNET"
 *     responses:
 *       200:
 *         description: Data published successfully to IPFS and blockchain
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/responses/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         cid:
 *                           type: string
 *                         transactionHash:
 *                           type: string
 *                         toAddress:
 *                           type: string
 *       400:
 *         $ref: '#/components/responses/ErrorResponse'
 *       500:
 *         $ref: '#/components/responses/ErrorResponse'
 */
router.post("/publish-complete", async (req: Request, res: Response) => {
  try {
    const { spaceId, ops, author, editName, network = "TESTNET" } = req.body;

    if (!spaceId || !ops || !author) {
      return res.status(400).json({
        success: false,
        error: "spaceId, ops, and author are required",
      });
    }

    const result = await graphService.publishData(
      spaceId,
      ops,
      author,
      editName,
      network
    );

    return res.status(200).json({
      success: true,
      data: result,
      message: "Data published successfully to IPFS and blockchain",
    });
  } catch (error) {
    console.error("Error publishing complete data:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to publish complete data",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * @swagger
 * /api/graph/edit/calldata:
 *   post:
 *     summary: Get Edit Calldata
 *     description: Generate transaction calldata for a space and CID
 *     tags: [GraphProtocol - Transactions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [spaceId, cid]
 *             properties:
 *               spaceId:
 *                 type: string
 *                 description: Space ID
 *                 example: "space-123"
 *               cid:
 *                 type: string
 *                 description: Content Identifier from IPFS
 *                 example: "QmHash..."
 *               network:
 *                 type: string
 *                 enum: [TESTNET, MAINNET]
 *                 default: TESTNET
 *                 description: Network to use
 *     responses:
 *       200:
 *         description: Edit calldata generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/responses/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         to:
 *                           type: string
 *                           description: Contract address
 *                         data:
 *                           type: string
 *                           description: Transaction calldata
 *       400:
 *         $ref: '#/components/responses/ErrorResponse'
 *       500:
 *         $ref: '#/components/responses/ErrorResponse'
 */
router.post("/edit/calldata", async (req: Request, res: Response) => {
  try {
    const { spaceId, cid, network = "TESTNET" } = req.body;

    if (!spaceId || !cid) {
      return res.status(400).json({
        success: false,
        error: "spaceId and cid are required",
      });
    }

    const calldata = await graphService.createEdit(spaceId, cid, network);

    return res.status(200).json({
      success: true,
      data: calldata,
      message: "Edit calldata generated successfully",
    });
  } catch (error) {
    console.error("Error getting edit calldata:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to get edit calldata",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * @swagger
 * /api/graph/transaction:
 *   post:
 *     summary: Execute Transaction
 *     description: Execute a blockchain transaction with provided calldata
 *     tags: [GraphProtocol - Transactions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [to, data]
 *             properties:
 *               to:
 *                 type: string
 *                 description: Contract address to send transaction to
 *                 example: "0x1234567890abcdef..."
 *               data:
 *                 type: string
 *                 description: Transaction calldata
 *                 example: "0xabcdef..."
 *     responses:
 *       200:
 *         description: Transaction executed successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/responses/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         transactionHash:
 *                           type: string
 *                           description: Blockchain transaction hash
 *       400:
 *         $ref: '#/components/responses/ErrorResponse'
 *       500:
 *         $ref: '#/components/responses/ErrorResponse'
 */
router.post("/transaction", async (req: Request, res: Response) => {
  try {
    const { to, data } = req.body;

    if (!to || !data) {
      return res.status(400).json({
        success: false,
        error: "to and data are required",
      });
    }

    const txResult = await graphService.sendTransaction(to, data);

    return res.status(200).json({
      success: true,
      data: { transactionHash: txResult },
      message: "Transaction executed successfully",
    });
  } catch (error) {
    console.error("Error executing transaction:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to execute transaction",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * @swagger
 * /api/graph/full-flow:
 *   post:
 *     summary: Demo Complete GraphProtocol Flow
 *     description: Run the complete GraphProtocol flow as a demonstration (creates space, entity, publishes to IPFS and blockchain)
 *     tags: [GraphProtocol - Demo]
 *     requestBody:
 *       description: Optional - no request body needed for demo
 *       required: false
 *     responses:
 *       200:
 *         description: Complete Graph Protocol flow executed successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/responses/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         space:
 *                           type: object
 *                         entityId:
 *                           type: string
 *                         cid:
 *                           type: string
 *                         txResult:
 *                           type: string
 *       500:
 *         $ref: '#/components/responses/ErrorResponse'
 */
router.post("/full-flow", async (req: Request, res: Response) => {
  try {
    const result = await graphService.executeFullFlow();

    return res.status(200).json({
      success: true,
      data: result,
      message: "Complete Graph Protocol flow executed successfully",
    });
  } catch (error) {
    console.error("Error running full flow:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to run complete flow",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * @swagger
 * /api/graph/generate-id:
 *   get:
 *     summary: Generate a new unique ID
 *     description: Generate a new UUID-style identifier for GraphProtocol operations
 *     tags: [GraphProtocol - Utilities]
 *     responses:
 *       200:
 *         description: ID generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/responses/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           description: Generated unique identifier
 *                           example: "a1b2c3d4-e5f6-4789-a012-3456789def0a"
 *       500:
 *         $ref: '#/components/responses/ErrorResponse'
 */
router.get("/generate-id", (req: Request, res: Response) => {
  try {
    const newId = graphService.generateId();

    return res.status(200).json({
      success: true,
      data: { id: newId },
      message: "ID generated successfully",
    });
  } catch (error) {
    console.error("Error generating ID:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to generate ID",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * @swagger
 * /api/graph/entity/complete:
 *   post:
 *     summary: Create a complete entity with properties, types, and values
 *     description: Creates an entity with associated properties, types, and values, then publishes the edit and sends transaction
 *     tags: [GraphProtocol - Entities]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, author, spaceId]
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the entity
 *                 example: "Jane Doe"
 *               description:
 *                 type: string
 *                 description: Description of the entity
 *                 example: "A person who likes restaurants"
 *               cover:
 *                 type: string
 *                 description: Cover image ID
 *                 example: "image-123"
 *               types:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of type IDs
 *                 example: ["person-type-id"]
 *               properties:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: "Age"
 *                     dataType:
 *                       type: string
 *                       enum: [STRING, NUMBER, BOOLEAN, TIME, POINT, RELATION]
 *                       example: "NUMBER"
 *                 description: Array of properties to create
 *               values:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     property:
 *                       type: string
 *                       description: Property name or ID
 *                       example: "Age"
 *                     value:
 *                       type: any
 *                       description: Value for the property
 *                       example: "42"
 *                 description: Array of property values
 *               author:
 *                 type: string
 *                 description: Ethereum address of the author
 *                 example: "0x5616aD5f4623A99deb01c75325c9Ff64ECE96034"
 *               editName:
 *                 type: string
 *                 description: Name for the edit
 *                 example: "Create Person Entity"
 *               spaceId:
 *                 type: string
 *                 description: Space ID where to publish
 *                 example: "space-123"
 *               network:
 *                 type: string
 *                 enum: [TESTNET, MAINNET]
 *                 default: TESTNET
 *                 description: Network to use
 *     responses:
 *       201:
 *         description: Entity created and published successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/responses/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         entityId:
 *                           type: string
 *                           description: ID of the created entity
 *                         propertyIds:
 *                           type: object
 *                           description: Mapping of property names to IDs
 *                         cid:
 *                           type: string
 *                           description: Content Identifier from IPFS
 *                         transactionHash:
 *                           type: string
 *                           description: Transaction hash from blockchain
 *                         toAddress:
 *                           type: string
 *                           description: Contract address for the transaction
 *                         calldata:
 *                           type: string
 *                           description: Transaction calldata
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/ErrorResponse'
 */
router.post("/entity/complete", async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      cover,
      types,
      properties,
      values,
      author,
      editName,
      spaceId,
      network = "TESTNET",
    } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: "Name is required",
        message: "Entity name must be provided",
      });
    }

    if (!author) {
      return res.status(400).json({
        success: false,
        error: "Author is required",
        message: "Author address must be provided",
      });
    }

    if (!spaceId) {
      return res.status(400).json({
        success: false,
        error: "Space ID is required",
        message: "Space ID must be provided for publishing",
      });
    }

    // Create the complete entity with properties and values
    const { entityId, propertyIds, ops } =
      await graphService.createCompleteEntity({
        name,
        description,
        cover,
        types,
        properties,
        values,
        spaceId,
        author,
        editName,
        network,
      });

    // Publish the operations to IPFS and blockchain
    const publishResult = await graphService.publishData(
      spaceId,
      ops,
      author,
      editName,
      network
    );

    return res.status(201).json({
      success: true,
      data: {
        entityId,
        propertyIds,
        cid: publishResult.cid,
        transactionHash: publishResult.transactionHash,
        toAddress: publishResult.toAddress,
        calldata: publishResult.calldata,
      },
      message: "Entity created and published successfully",
    });
  } catch (error) {
    console.error("Error creating complete entity:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to create complete entity",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
