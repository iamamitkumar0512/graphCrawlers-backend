/**
 * Swagger Configuration Module
 * 
 * This module configures Swagger/OpenAPI documentation for the API.
 * It defines API schemas, endpoints, and provides interactive documentation.
 */

import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

/**
 * Swagger Configuration Options
 * 
 * Defines the OpenAPI specification for the API documentation.
 * Includes API metadata, server configuration, and schema definitions.
 */
const options: swaggerJsdoc.Options = {
  definition: {
    // OpenAPI version
    openapi: "3.0.0",
    // API metadata
    info: {
      title: "Hackthon Backend API",
      version: "1.0.0",
      description:
        "A backend API for Twitter data collection and analysis built with Node.js, TypeScript, Express, and MongoDB",
      contact: {
        name: "API Support",
        email: "support@hackthon.com",
      },
    },
    // Server configuration
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
        description: "Development server",
      },
    ],
    // API components including schemas and responses
    components: {
      // Data schemas used throughout the API
      schemas: {
        // Tweet data structure schema
        Tweet: {
          type: "object",
          required: ["tweetId", "text", "author", "createdAt"],
          properties: {
            _id: {
              type: "string",
              description: "Tweet database ID",
              example: "507f1f77bcf86cd799439011",
            },
            tweetId: {
              type: "string",
              description: "Unique tweet identifier",
              example: "tweet_1234567890_0",
            },
            text: {
              type: "string",
              description: "Tweet content",
              example: "This is a sample tweet with #hashtag and @mention",
            },
            author: {
              type: "object",
              properties: {
                username: {
                  type: "string",
                  description: "Author username",
                  example: "elonmusk",
                },
                displayName: {
                  type: "string",
                  description: "Author display name",
                  example: "Elon Musk",
                },
                profileImageUrl: {
                  type: "string",
                  description: "Author profile image URL",
                  example: "https://pbs.twimg.com/profile_images/...",
                },
              },
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Tweet creation timestamp",
            },
            metrics: {
              type: "object",
              properties: {
                retweetCount: {
                  type: "number",
                  description: "Number of retweets",
                  example: 1000,
                },
                likeCount: {
                  type: "number",
                  description: "Number of likes",
                  example: 5000,
                },
                replyCount: {
                  type: "number",
                  description: "Number of replies",
                  example: 200,
                },
                quoteCount: {
                  type: "number",
                  description: "Number of quote tweets",
                  example: 50,
                },
              },
            },
            hashtags: {
              type: "array",
              items: {
                type: "string",
              },
              description: "Hashtags in the tweet",
              example: ["#technology", "#AI"],
            },
            mentions: {
              type: "array",
              items: {
                type: "string",
              },
              description: "Mentions in the tweet",
              example: ["@twitter", "@elonmusk"],
            },
            urls: {
              type: "array",
              items: {
                type: "string",
              },
              description: "URLs in the tweet",
              example: ["https://example.com"],
            },
            isRetweet: {
              type: "boolean",
              description: "Whether this is a retweet",
              example: false,
            },
            fetchedAt: {
              type: "string",
              format: "date-time",
              description: "When this tweet was fetched",
            },
          },
        },
        // Graph Protocol Schemas
        SpaceCreate: {
          type: "object",
          required: ["editorAddress", "name"],
          properties: {
            editorAddress: {
              type: "string",
              description: "Ethereum address of the space editor",
              example: "0x5616aD5f4623A99deb01c75325c9Ff64ECE96034",
            },
            name: {
              type: "string",
              description: "Name of the space",
              example: "My Graph Space",
            },
            network: {
              type: "string",
              enum: ["TESTNET", "MAINNET"],
              default: "TESTNET",
              description: "Network to use for the space",
              example: "TESTNET",
            },
          },
        },
        EntityCreate: {
          type: "object",
          required: ["name"],
          properties: {
            name: {
              type: "string",
              description: "Name of the entity",
              example: "Product Entity",
            },
            description: {
              type: "string",
              description: "Description of the entity",
              example: "A product in our catalog",
            },
            types: {
              type: "array",
              items: {
                type: "string",
              },
              description: "Array of type IDs associated with this entity",
              example: ["product-type-id"],
            },
            cover: {
              type: "string",
              description: "Cover image ID for the entity",
              example: "image-123",
            },
            values: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  property: {
                    type: "string",
                    description: "Property name or ID",
                    example: "price",
                  },
                  value: {
                    type: "any",
                    description: "Value for the property",
                    example: "99.99",
                  },
                },
              },
              description: "Array of property values",
            },
            author: {
              type: "string",
              description:
                "Ethereum address of the author (optional, for publishing)",
              example: "0x5616aD5f4623A99deb01c75325c9Ff64ECE96034",
            },
            editName: {
              type: "string",
              description: "Name for the edit (optional, for publishing)",
              example: "Creating Product Entity",
            },
            spaceId: {
              type: "string",
              description:
                "Space ID for publishing (optional, for blockchain transaction)",
              example: "space-123-abc-def456",
            },
            network: {
              type: "string",
              enum: ["TESTNET", "MAINNET"],
              default: "TESTNET",
              description:
                "Network to use (optional, for blockchain transaction)",
              example: "TESTNET",
            },
          },
        },
        ImageCreate: {
          type: "object",
          required: ["url"],
          properties: {
            url: {
              type: "string",
              description: "URL of the image to create",
              example: "https://example.com/image.jpg",
            },
          },
        },
        TypeCreate: {
          type: "object",
          required: ["name"],
          properties: {
            name: {
              type: "string",
              description: "Name of the type",
              example: "Product Type",
            },
            cover: {
              type: "string",
              description: "Cover image ID for the type",
              example: "image-123",
            },
            properties: {
              type: "array",
              items: {
                type: "string",
              },
              description: "Array of property IDs associated with this type",
              example: ["property-1", "property-2"],
            },
          },
        },
        PropertyCreate: {
          type: "object",
          required: ["name", "type"],
          properties: {
            name: {
              type: "string",
              description: "Name of the property",
              example: "Price",
            },
            type: {
              type: "string",
              enum: [
                "STRING",
                "NUMBER",
                "BOOLEAN",
                "TIME",
                "POINT",
                "RELATION",
              ],
              description: "Data type of the property",
              example: "NUMBER",
            },
          },
        },
        PublishEdit: {
          type: "object",
          required: ["ops", "author"],
          properties: {
            ops: {
              type: "array",
              description: "Array of operations to publish",
              example: [],
            },
            author: {
              type: "string",
              description: "Ethereum address of the author",
              example: "0x5616aD5f4623A99deb01c75325c9Ff64ECE96034",
            },
            editName: {
              type: "string",
              description: "Name for the edit",
              example: "Creating Entity",
            },
          },
        },
        PublishComplete: {
          type: "object",
          required: ["spaceId", "ops", "author"],
          properties: {
            spaceId: {
              type: "string",
              description: "Space ID where to publish",
              example: "space-123",
            },
            ops: {
              type: "array",
              description: "Array of operations to publish",
              example: [],
            },
            author: {
              type: "string",
              description: "Ethereum address of the author",
              example: "0x5616aD5f4623A99deb01c75325c9Ff64ECE96034",
            },
            editName: {
              type: "string",
              description: "Name for the edit",
              example: "Product Creation",
            },
            network: {
              type: "string",
              enum: ["TESTNET", "MAINNET"],
              default: "TESTNET",
              description: "Network to use",
              example: "TESTNET",
            },
          },
        },
        User: {
          type: "object",
          required: ["name", "email"],
          properties: {
            id: {
              type: "number",
              description: "User ID",
              example: 1,
            },
            name: {
              type: "string",
              description: "User name",
              example: "John Doe",
            },
            email: {
              type: "string",
              format: "email",
              description: "User email",
              example: "john@example.com",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "User creation timestamp",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "User last update timestamp",
            },
          },
        },
        Error: {
          type: "object",
          properties: {
            message: {
              type: "string",
              description: "Error message",
            },
            status: {
              type: "number",
              description: "HTTP status code",
            },
          },
        },
      },
      responses: {
        NotFound: {
          description: "Resource not found",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
            },
          },
        },
        ServerError: {
          description: "Internal server error",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
            },
          },
        },
      },
    },
  },
  apis: [
    "./src/routes/*.ts",
    "./src/controllers/*.ts",
    "./src/routes/userRoutes.ts",
    "./src/routes/graphProtocolRoutes.ts",
  ], // paths to files containing OpenAPI definitions
};

export const swaggerSpec = swaggerJsdoc(options);
export { swaggerUi };
