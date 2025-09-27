import puppeteer, { Browser, Page } from "puppeteer";
import axios from "axios";
import * as cheerio from "cheerio";
import Web3Post, { IWeb3Post } from "../models/Web3Post";
import Company, { ICompany } from "../models/Company";
import Paragraph, { IParagraph } from "../models/Paragraph";
import { logger } from "../utils/logger";
import { cleanUrl } from "../utils/urlCleaner";

export interface Web3Company {
  name: string;
  slug: string;
  website?: string;
  twitter?: string;
  medium?: string;
  mirror?: string;
  pyarzgraph?: string;
}

export interface ScrapedWeb3Post {
  postId: string;
  title: string;
  content: string;
  excerpt?: string;
  author: {
    name: string;
    username?: string;
    profileUrl?: string;
    avatarUrl?: string;
  };
  platform: "medium" | "mirror" | "pyarzgraph";
  url: string;
  publishedAt: Date;
  tags?: string[];
  metrics: {
    claps?: number;
    views?: number;
    comments?: number;
    shares?: number;
  };
  company: Web3Company;
  featuredImage?: string;
  readingTime?: number;
}

class Web3ScraperService {
  private browser: Browser | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--disable-gpu",
          "--disable-web-security",
          "--disable-features=VizDisplayCompositor",
        ],
      });
      this.isInitialized = true;
      logger.info("Web3 scraper service initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize Web3 scraper service:", error);
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.isInitialized = false;
      logger.info("Web3 scraper service closed");
    }
  }

  async fetchMediumPosts(
    company: Web3Company,
    maxPosts: number = 10
  ): Promise<ScrapedWeb3Post[]> {
    if (!company.medium) return [];

    try {
      const mediumUrl = `https://medium.com/@${company.medium}`;
      const response = await axios.get(mediumUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });

      const $ = cheerio.load(response.data);
      const posts: ScrapedWeb3Post[] = [];

      // Medium uses dynamic content loading, so we'll use a different approach
      // For now, we'll implement a basic scraper that works with static content
      $("article")
        .slice(0, maxPosts)
        .each((index, element) => {
          try {
            const $article = $(element);
            const title = $article.find("h1, h2, h3").first().text().trim();
            const link = $article.find("a").first().attr("href");
            const author =
              $article.find('[data-testid="authorName"]').text().trim() ||
              company.name;

            if (title && link) {
              const fullUrl = link.startsWith("http")
                ? link
                : `https://medium.com${link}`;
              const cleanedUrl = cleanUrl(fullUrl);
              const postId = this.generatePostId(cleanedUrl);

              posts.push({
                postId,
                title,
                content: $article.find("p").text().trim(),
                excerpt: $article
                  .find("p")
                  .first()
                  .text()
                  .trim()
                  .substring(0, 300),
                author: {
                  name: author,
                  username: company.medium,
                  profileUrl: `https://medium.com/@${company.medium}`,
                },
                platform: "medium",
                url: cleanedUrl,
                publishedAt: new Date(),
                tags: this.extractTags($article.text()),
                metrics: {
                  claps: this.extractNumber(
                    $article.find('[data-testid="clapCount"]').text()
                  ),
                  views: 0,
                  comments: 0,
                  shares: 0,
                },
                company,
                featuredImage: $article.find("img").first().attr("src"),
                readingTime: this.estimateReadingTime(
                  $article.find("p").text()
                ),
              });
            }
          } catch (error) {
            logger.error(
              `Error parsing Medium post for ${company.name}:`,
              error
            );
          }
        });

      logger.info(`Fetched ${posts.length} Medium posts for ${company.name}`);
      return posts;
    } catch (error) {
      logger.error(`Error fetching Medium posts for ${company.name}:`, error);
      return [];
    }
  }

  async fetchMirrorPosts(
    company: Web3Company,
    maxPosts: number = 10
  ): Promise<ScrapedWeb3Post[]> {
    if (!company.mirror) return [];

    try {
      const mirrorUrl = `https://mirror.xyz/${company.mirror}`;
      const response = await axios.get(mirrorUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });

      const $ = cheerio.load(response.data);
      const posts: ScrapedWeb3Post[] = [];

      $('[data-testid="post-card"], .post-card, article')
        .slice(0, maxPosts)
        .each((index, element) => {
          try {
            const $post = $(element);
            const title = $post
              .find('h1, h2, h3, [data-testid="post-title"]')
              .first()
              .text()
              .trim();
            const link = $post.find("a").first().attr("href");
            const author =
              $post
                .find('[data-testid="author-name"], .author-name')
                .text()
                .trim() || company.name;

            if (title && link) {
              const fullUrl = link.startsWith("http")
                ? link
                : `https://mirror.xyz${link}`;
              const cleanedUrl = cleanUrl(fullUrl);
              const postId = this.generatePostId(cleanedUrl);

              posts.push({
                postId,
                title,
                content: $post.find("p").text().trim(),
                excerpt: $post
                  .find("p")
                  .first()
                  .text()
                  .trim()
                  .substring(0, 300),
                author: {
                  name: author,
                  username: company.mirror,
                  profileUrl: `https://mirror.xyz/${company.mirror}`,
                },
                platform: "mirror",
                url: cleanedUrl,
                publishedAt: new Date(),
                tags: this.extractTags($post.text()),
                metrics: {
                  claps: 0,
                  views: 0,
                  comments: 0,
                  shares: 0,
                },
                company,
                featuredImage: $post.find("img").first().attr("src"),
                readingTime: this.estimateReadingTime($post.find("p").text()),
              });
            }
          } catch (error) {
            logger.error(
              `Error parsing Mirror post for ${company.name}:`,
              error
            );
          }
        });

      logger.info(`Fetched ${posts.length} Mirror posts for ${company.name}`);
      return posts;
    } catch (error) {
      logger.error(`Error fetching Mirror posts for ${company.name}:`, error);
      return [];
    }
  }

  async fetchPyarzgraphPosts(
    company: Web3Company,
    maxPosts: number = 10
  ): Promise<ScrapedWeb3Post[]> {
    if (!company.pyarzgraph) return [];

    try {
      const pyarzgraphUrl = `https://pyarzgraph.xyz/${company.pyarzgraph}`;
      const response = await axios.get(pyarzgraphUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });

      const $ = cheerio.load(response.data);
      const posts: ScrapedWeb3Post[] = [];

      $('article, .post, [data-testid="post"]')
        .slice(0, maxPosts)
        .each((index, element) => {
          try {
            const $post = $(element);
            const title = $post.find("h1, h2, h3").first().text().trim();
            const link = $post.find("a").first().attr("href");
            const author =
              $post.find('.author, [data-testid="author"]').text().trim() ||
              company.name;

            if (title && link) {
              const fullUrl = link.startsWith("http")
                ? link
                : `https://pyarzgraph.xyz${link}`;
              const cleanedUrl = cleanUrl(fullUrl);
              const postId = this.generatePostId(cleanedUrl);

              posts.push({
                postId,
                title,
                content: $post.find("p").text().trim(),
                excerpt: $post
                  .find("p")
                  .first()
                  .text()
                  .trim()
                  .substring(0, 300),
                author: {
                  name: author,
                  username: company.pyarzgraph,
                  profileUrl: `https://pyarzgraph.xyz/${company.pyarzgraph}`,
                },
                platform: "pyarzgraph",
                url: cleanedUrl,
                publishedAt: new Date(),
                tags: this.extractTags($post.text()),
                metrics: {
                  claps: 0,
                  views: 0,
                  comments: 0,
                  shares: 0,
                },
                company,
                featuredImage: $post.find("img").first().attr("src"),
                readingTime: this.estimateReadingTime($post.find("p").text()),
              });
            }
          } catch (error) {
            logger.error(
              `Error parsing Pyarzgraph post for ${company.name}:`,
              error
            );
          }
        });

      logger.info(
        `Fetched ${posts.length} Pyarzgraph posts for ${company.name}`
      );
      return posts;
    } catch (error) {
      logger.error(
        `Error fetching Pyarzgraph posts for ${company.name}:`,
        error
      );
      return [];
    }
  }

  async fetchAllCompanyPosts(
    company: Web3Company,
    maxPostsPerPlatform: number = 5
  ): Promise<ScrapedWeb3Post[]> {
    const allPosts: ScrapedWeb3Post[] = [];

    try {
      // Fetch from all available platforms
      const [mediumPosts, mirrorPosts, pyarzgraphPosts] = await Promise.all([
        this.fetchMediumPosts(company, maxPostsPerPlatform),
        this.fetchMirrorPosts(company, maxPostsPerPlatform),
        this.fetchPyarzgraphPosts(company, maxPostsPerPlatform),
      ]);

      allPosts.push(...mediumPosts, ...mirrorPosts, ...pyarzgraphPosts);

      logger.info(`Fetched ${allPosts.length} total posts for ${company.name}`);
      return allPosts;
    } catch (error) {
      logger.error(`Error fetching posts for ${company.name}:`, error);
      return [];
    }
  }

  async savePostsToDatabase(posts: ScrapedWeb3Post[]): Promise<IWeb3Post[]> {
    const savedPosts: IWeb3Post[] = [];

    for (const post of posts) {
      try {
        // Check if post already exists by postId or URL
        const existingPost = await Web3Post.findOne({
          $or: [{ postId: post.postId }, { url: post.url }],
        });
        if (existingPost) {
          logger.info(
            `Post ${post.postId} already exists (by postId or URL), skipping`
          );
          continue;
        }

        // Create new post
        const newPost = new Web3Post({
          ...post,
          fetchedAt: new Date(),
        });

        const savedPost = await newPost.save();
        savedPosts.push(savedPost);
        logger.info(`Saved post ${post.postId} to database`);
      } catch (error) {
        logger.error(`Error saving post ${post.postId}:`, error);
      }
    }

    return savedPosts;
  }

  async fetchAndSaveAllPosts(
    maxPostsPerCompany: number = 5
  ): Promise<IWeb3Post[]> {
    const allSavedPosts: IWeb3Post[] = [];

    // Get all active companies from database
    const companies = await Company.find({ isActive: true }).lean();

    for (const company of companies) {
      try {
        logger.info(`Fetching posts for ${company.companyName}`);

        // Convert database company to Web3Company format for existing methods
        const web3Company: Web3Company = {
          name: company.companyName,
          slug: company.companyName.toLowerCase().replace(/\s+/g, "-"),
          website: company.publicSpaceId,
          medium: company.mediumLink,
          mirror: company.mirrorLink,
          pyarzgraph: company.paragraphLink,
        };

        const posts = await this.fetchAllCompanyPosts(
          web3Company,
          maxPostsPerCompany
        );
        const savedPosts = await this.savePostsToDatabase(posts);
        allSavedPosts.push(...savedPosts);

        // Add delay between companies to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        logger.error(`Error fetching posts for ${company.companyName}:`, error);
        // Continue with other companies even if one fails
      }
    }

    return allSavedPosts;
  }

  // Helper methods
  private generatePostId(url: string): string {
    return Buffer.from(url)
      .toString("base64")
      .replace(/[^a-zA-Z0-9]/g, "")
      .substring(0, 32);
  }

  private extractTags(text: string): string[] {
    const tagRegex = /#(\w+)/g;
    const matches = text.match(tagRegex);
    return matches ? matches.map((tag) => tag.substring(1)) : [];
  }

  private extractNumber(text: string): number {
    const number = parseInt(text.replace(/[^\d]/g, "")) || 0;
    return number;
  }

  private estimateReadingTime(text: string): number {
    const wordsPerMinute = 200;
    const wordCount = text.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  }

  // Getter methods - now using database
  async getWeb3Companies(): Promise<Web3Company[]> {
    const companies = await Company.find({ isActive: true }).lean();
    return companies.map((company) => ({
      name: company.companyName,
      slug: company.companyName.toLowerCase().replace(/\s+/g, "-"),
      website: company.publicSpaceId,
      medium: company.mediumLink,
      mirror: company.mirrorLink,
      pyarzgraph: company.paragraphLink,
    }));
  }

  async addWeb3Company(companyData: {
    companyName: string;
    publicSpaceId?: string;
    mediumLink?: string;
    paragraphLink?: string;
    mirrorLink?: string;
  }): Promise<ICompany> {
    const company = new Company({
      ...companyData,
      isActive: true,
    });
    const savedCompany = await company.save();
    logger.info(`Added ${companyData.companyName} to monitoring list`);
    return savedCompany;
  }

  async removeWeb3Company(companyName: string): Promise<boolean> {
    const result = await Company.findOneAndUpdate(
      { companyName },
      { isActive: false },
      { new: true }
    );

    if (result) {
      logger.info(`Removed company ${companyName} from monitoring list`);
      return true;
    }
    return false;
  }

  // New method to scrape based on company name and platform from database
  async scrapeCompanyByPlatform(
    companyName: string,
    platform: "medium" | "paragraph" | "mirror",
    maxPosts: number = 10
  ): Promise<IParagraph[]> {
    try {
      // Get company from database
      const company = await Company.findOne({
        companyName,
        isActive: true,
      }).lean();

      if (!company) {
        throw new Error(`Company ${companyName} not found or inactive`);
      }

      // Get the appropriate link based on platform
      let link: string | undefined;
      switch (platform) {
        case "medium":
          link = company.mediumLink;
          break;
        case "paragraph":
          link = company.paragraphLink;
          break;
        case "mirror":
          link = company.mirrorLink;
          break;
      }

      if (!link) {
        throw new Error(`No ${platform} link found for company ${companyName}`);
      }

      // Scrape posts based on platform
      let scrapedPosts: ScrapedWeb3Post[] = [];
      switch (platform) {
        case "medium":
          scrapedPosts = await this.fetchMediumPostsFromLink(link, maxPosts);
          break;
        case "paragraph":
          scrapedPosts = await this.fetchParagraphPostsFromLink(link, maxPosts);
          break;
        case "mirror":
          scrapedPosts = await this.fetchMirrorPostsFromLink(link, maxPosts);
          break;
      }

      // Convert to Paragraph format and save to database
      const savedParagraphs: IParagraph[] = [];
      for (const post of scrapedPosts) {
        try {
          // Validate post has required content
          if (!post.content || post.content.trim().length < 10) {
            logger.warn(`Skipping post ${post.postId} - insufficient content`);
            continue;
          }

          // Check if paragraph already exists by postId or URL
          const existingParagraph = await Paragraph.findOne({
            $or: [
              { "postData.postId": post.postId },
              { "postData.url": post.url },
            ],
          });

          if (existingParagraph) {
            logger.info(
              `Paragraph ${post.postId} already exists (by postId or URL), skipping`
            );
            continue;
          }

          // Create new paragraph
          const newParagraph = new Paragraph({
            companyName,
            platform,
            postData: {
              postId: post.postId,
              title: post.title,
              content: post.content,
              excerpt: post.excerpt,
              author: post.author,
              url: post.url,
              publishedAt: post.publishedAt,
              tags: post.tags,
              metrics: post.metrics,
              featuredImage: post.featuredImage,
              readingTime: post.readingTime,
            },
            processed: false,
            fetchedAt: new Date(),
          });

          const savedParagraph = await newParagraph.save();
          savedParagraphs.push(savedParagraph);
          logger.info(`Saved paragraph ${post.postId} to database`);
        } catch (error) {
          logger.error(`Error saving paragraph ${post.postId}:`, error);
        }
      }

      logger.info(
        `Scraped and saved ${savedParagraphs.length} ${platform} posts for ${companyName}`
      );
      return savedParagraphs;
    } catch (error) {
      logger.error(
        `Error scraping ${platform} posts for ${companyName}:`,
        error
      );
      throw error;
    }
  }

  // Helper method to fetch Medium posts from a specific link
  private async fetchMediumPostsFromLink(
    link: string,
    maxPosts: number = 10
  ): Promise<ScrapedWeb3Post[]> {
    try {
      const response = await axios.get(link, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });

      const $ = cheerio.load(response.data);

      console.log("$", $);
      const posts: ScrapedWeb3Post[] = [];

      // Try multiple selectors for Medium articles
      let articles = $("article[data-testid='post-preview']");
      if (articles.length === 0) {
        articles = $("article");
      }
      if (articles.length === 0) {
        articles = $("[data-testid='post-preview']");
      }
      if (articles.length === 0) {
        articles = $(".postArticle");
      }

      articles.slice(0, maxPosts).each((index, element) => {
        try {
          const $article = $(element);
          console.log("$article", $article);

          // Try multiple selectors for title
          let title = $article.find("h1, h2, h3").first().text().trim();
          if (!title) {
            title = $article
              .find('[data-testid="post-preview-title"]')
              .text()
              .trim();
          }
          if (!title) {
            title = $article.find(".graf--title").text().trim();
          }

          // Try multiple selectors for link
          let link = $article.find("a").first().attr("href");
          if (!link) {
            link = $article
              .find('[data-testid="post-preview-link"]')
              .attr("href");
          }
          if (!link) {
            link = $article.find('a[href*="/"]').first().attr("href");
          }

          // Try multiple selectors for author
          let author = $article
            .find('[data-testid="authorName"]')
            .text()
            .trim();
          if (!author) {
            author = $article.find(".graf--author").text().trim();
          }
          if (!author) {
            author = $article
              .find(".postMetaInline-authorLockup")
              .text()
              .trim();
          }
          if (!author) {
            author = "Unknown Author";
          }

          if (title && link) {
            const fullUrl = link.startsWith("http")
              ? link
              : `https://medium.com${link}`;
            const cleanedUrl = cleanUrl(fullUrl);
            const postId = this.generatePostId(cleanedUrl);

            // Try multiple selectors to find content
            let content = $article.find("p").text().trim();
            if (!content) {
              content = $article
                .find('[data-testid="post-preview"] p')
                .text()
                .trim();
            }
            if (!content) {
              content = $article.find(".post-content p").text().trim();
            }
            if (!content) {
              content = $article.find(".section-content p").text().trim();
            }
            if (!content) {
              content = $article.text().trim().substring(0, 1000); // Fallback to all text
            }

            // Skip posts with no content
            if (!content || content.length < 10) {
              logger.warn(`Skipping post with insufficient content: ${title}`);
              return;
            }

            posts.push({
              postId,
              title,
              content,
              excerpt: content.substring(0, 300),
              author: {
                name: author,
                username: "medium_user",
                profileUrl: link,
              },
              platform: "medium",
              url: cleanedUrl,
              publishedAt: new Date(),
              tags: this.extractTags($article.text()),
              metrics: {
                claps: this.extractNumber(
                  $article.find('[data-testid="clapCount"]').text()
                ),
                views: 0,
                comments: 0,
                shares: 0,
              },
              company: {
                name: "Medium Company",
                slug: "medium-company",
              },
              featuredImage: $article.find("img").first().attr("src"),
              readingTime: this.estimateReadingTime($article.find("p").text()),
            });
          }
        } catch (error) {
          logger.error("Error parsing Medium post:", error);
        }
      });

      return posts;
    } catch (error) {
      logger.error("Error fetching Medium posts from link:", error);
      return [];
    }
  }

  // Helper method to fetch Paragraph posts from a specific link
  private async fetchParagraphPostsFromLink(
    link: string,
    maxPosts: number = 10
  ): Promise<ScrapedWeb3Post[]> {
    try {
      const response = await axios.get(link, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });

      const $ = cheerio.load(response.data);
      const posts: ScrapedWeb3Post[] = [];

      $("article, .post, [data-testid='post']")
        .slice(0, maxPosts)
        .each((index, element) => {
          try {
            const $post = $(element);
            const title = $post.find("h1, h2, h3").first().text().trim();
            const link = $post.find("a").first().attr("href");
            const author =
              $post.find('.author, [data-testid="author"]').text().trim() ||
              "Unknown Author";

            if (title && link) {
              const fullUrl = link.startsWith("http")
                ? link
                : `https://paragraph.xyz${link}`;
              const cleanedUrl = cleanUrl(fullUrl);
              const postId = this.generatePostId(cleanedUrl);

              posts.push({
                postId,
                title,
                content: $post.find("p").text().trim(),
                excerpt: $post
                  .find("p")
                  .first()
                  .text()
                  .trim()
                  .substring(0, 300),
                author: {
                  name: author,
                  username: "paragraph_user",
                  profileUrl: link,
                },
                platform: "pyarzgraph",
                url: cleanedUrl,
                publishedAt: new Date(),
                tags: this.extractTags($post.text()),
                metrics: {
                  claps: 0,
                  views: 0,
                  comments: 0,
                  shares: 0,
                },
                company: {
                  name: "Paragraph Company",
                  slug: "paragraph-company",
                },
                featuredImage: $post.find("img").first().attr("src"),
                readingTime: this.estimateReadingTime($post.find("p").text()),
              });
            }
          } catch (error) {
            logger.error("Error parsing Paragraph post:", error);
          }
        });

      return posts;
    } catch (error) {
      logger.error("Error fetching Paragraph posts from link:", error);
      return [];
    }
  }

  // Helper method to fetch Mirror posts from a specific link
  private async fetchMirrorPostsFromLink(
    link: string,
    maxPosts: number = 10
  ): Promise<ScrapedWeb3Post[]> {
    try {
      const response = await axios.get(link, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });

      const $ = cheerio.load(response.data);
      const posts: ScrapedWeb3Post[] = [];

      $('[data-testid="post-card"], .post-card, article')
        .slice(0, maxPosts)
        .each((index, element) => {
          try {
            const $post = $(element);
            const title = $post
              .find('h1, h2, h3, [data-testid="post-title"]')
              .first()
              .text()
              .trim();
            const link = $post.find("a").first().attr("href");
            const author =
              $post
                .find('[data-testid="author-name"], .author-name')
                .text()
                .trim() || "Unknown Author";

            if (title && link) {
              const fullUrl = link.startsWith("http")
                ? link
                : `https://mirror.xyz${link}`;
              const cleanedUrl = cleanUrl(fullUrl);
              const postId = this.generatePostId(cleanedUrl);

              posts.push({
                postId,
                title,
                content: $post.find("p").text().trim(),
                excerpt: $post
                  .find("p")
                  .first()
                  .text()
                  .trim()
                  .substring(0, 300),
                author: {
                  name: author,
                  username: "mirror_user",
                  profileUrl: link,
                },
                platform: "mirror",
                url: cleanedUrl,
                publishedAt: new Date(),
                tags: this.extractTags($post.text()),
                metrics: {
                  claps: 0,
                  views: 0,
                  comments: 0,
                  shares: 0,
                },
                company: {
                  name: "Mirror Company",
                  slug: "mirror-company",
                },
                featuredImage: $post.find("img").first().attr("src"),
                readingTime: this.estimateReadingTime($post.find("p").text()),
              });
            }
          } catch (error) {
            logger.error("Error parsing Mirror post:", error);
          }
        });

      return posts;
    } catch (error) {
      logger.error("Error fetching Mirror posts from link:", error);
      return [];
    }
  }
}

export default new Web3ScraperService();
