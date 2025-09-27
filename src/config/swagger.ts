import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
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
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
        description: "Development server",
      },
    ],
    components: {
      schemas: {
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
  apis: ["./src/routes/*.ts", "./src/controllers/*.ts"], // paths to files containing OpenAPI definitions
};

export const swaggerSpec = swaggerJsdoc(options);
export { swaggerUi };
