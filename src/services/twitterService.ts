import puppeteer, { Browser, Page } from "puppeteer";
import { TwitterApi } from "twitter-api-v2";
import Tweet, { ITweet } from "../models/Tweet";
import { logger } from "../utils/logger";
import { cleanUrls } from "../utils/urlCleaner";

export interface TwitterAccount {
  username: string;
  displayName: string;
  profileImageUrl?: string;
}

export interface ScrapedTweet {
  tweetId: string;
  text: string;
  author: TwitterAccount;
  createdAt: Date;
  metrics: {
    retweetCount: number;
    likeCount: number;
    replyCount: number;
    quoteCount: number;
  };
  urls?: string[];
  hashtags?: string[];
  mentions?: string[];
  media?: {
    type: string;
    url: string;
  }[];
  isRetweet: boolean;
  originalTweetId?: string;
}

class TwitterService {
  private browser: Browser | null = null;
  private isInitialized = false;
  private twitterApi: TwitterApi | null = null;
  private useApi = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Try to initialize Twitter API first
      if (this.initializeTwitterApi()) {
        this.useApi = true;
        logger.info("Twitter API initialized successfully");
      } else {
        // Fallback to scraping
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
        this.useApi = false;
        logger.info("Twitter scraping service initialized successfully");
      }
      this.isInitialized = true;
    } catch (error) {
      logger.error("Failed to initialize Twitter service:", error);
      throw error;
    }
  }

  private initializeTwitterApi(): boolean {
    try {
      const apiKey = process.env.TWITTER_API_KEY;
      const apiSecret = process.env.TWITTER_API_SECRET;
      const accessToken = process.env.TWITTER_ACCESS_TOKEN;
      const accessSecret = process.env.TWITTER_ACCESS_SECRET;

      if (apiKey && apiSecret && accessToken && accessSecret) {
        this.twitterApi = new TwitterApi({
          appKey: apiKey,
          appSecret: apiSecret,
          accessToken: accessToken,
          accessSecret: accessSecret,
        });
        return true;
      }
      return false;
    } catch (error) {
      logger.warn(
        "Twitter API credentials not found, falling back to scraping"
      );
      return false;
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.isInitialized = false;
      logger.info("Twitter service closed");
    }
  }

  async fetchUserTweets(
    username: string,
    maxTweets: number = 20
  ): Promise<ScrapedTweet[]> {
    if (this.useApi && this.twitterApi) {
      return this.fetchTweetsViaApi(username, maxTweets);
    } else {
      return this.scrapeUserTweets(username, maxTweets);
    }
  }

  private async fetchTweetsViaApi(
    username: string,
    maxTweets: number
  ): Promise<ScrapedTweet[]> {
    try {
      // Get user by username
      const user = await this.twitterApi!.v2.userByUsername(username);
      if (!user.data) {
        throw new Error(`User ${username} not found`);
      }

      // Get user's timeline
      const timeline = await this.twitterApi!.v2.userTimeline(user.data.id, {
        max_results: Math.min(maxTweets, 100),
        "tweet.fields": [
          "created_at",
          "public_metrics",
          "context_annotations",
          "entities",
          "referenced_tweets",
        ],
        "user.fields": ["name", "username", "profile_image_url"],
      });

      const tweets: ScrapedTweet[] = [];

      for (const tweet of timeline.data.data || []) {
        const metrics = (tweet.public_metrics as any) || {};

        // Extract hashtags and mentions from entities
        const hashtags: string[] = [];
        const mentions: string[] = [];
        const urls: string[] = [];

        if (tweet.entities) {
          if (tweet.entities.hashtags) {
            hashtags.push(
              ...tweet.entities.hashtags.map((h: any) => `#${h.tag}`)
            );
          }
          if (tweet.entities.mentions) {
            mentions.push(
              ...tweet.entities.mentions.map((m: any) => `@${m.username}`)
            );
          }
          if (tweet.entities.urls) {
            const rawUrls = tweet.entities.urls.map(
              (u: any) => u.expanded_url || u.url
            );
            urls.push(...cleanUrls(rawUrls));
          }
        }

        tweets.push({
          tweetId: tweet.id,
          text: tweet.text,
          author: {
            username: user.data.username,
            displayName: user.data.name,
            profileImageUrl: user.data.profile_image_url,
          },
          createdAt: new Date(tweet.created_at!),
          metrics: {
            retweetCount: metrics.retweet_count || 0,
            likeCount: metrics.like_count || 0,
            replyCount: metrics.reply_count || 0,
            quoteCount: metrics.quote_count || 0,
          },
          urls,
          hashtags,
          mentions,
          isRetweet: !!tweet.referenced_tweets?.some(
            (rt: any) => rt.type === "retweeted"
          ),
          originalTweetId: tweet.referenced_tweets?.find(
            (rt: any) => rt.type === "retweeted"
          )?.id,
        });
      }

      logger.info(
        `Fetched ${tweets.length} tweets via API for user ${username}`
      );
      return tweets;
    } catch (error) {
      logger.error(`Error fetching tweets via API for ${username}:`, error);
      throw error;
    }
  }

  private async scrapeUserTweets(
    username: string,
    maxTweets: number = 20
  ): Promise<ScrapedTweet[]> {
    if (!this.browser) {
      throw new Error("Twitter service not initialized");
    }

    const page = await this.browser.newPage();

    try {
      // Set user agent to avoid detection
      await page.setUserAgent(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      );

      // Set viewport
      await page.setViewport({ width: 1366, height: 768 });

      // Navigate to user's profile
      const profileUrl = `https://twitter.com/${username}`;
      logger.info(`Navigating to ${profileUrl}`);

      await page.goto(profileUrl, {
        waitUntil: "networkidle2",
        timeout: 30000,
      });

      // Wait for tweets to load with multiple selectors
      const tweetSelectors = [
        '[data-testid="tweet"]',
        '[data-testid="tweetText"]',
        'article[data-testid="tweet"]',
      ];

      let tweetsLoaded = false;
      for (const selector of tweetSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 5000 });
          tweetsLoaded = true;
          break;
        } catch (e) {
          continue;
        }
      }

      if (!tweetsLoaded) {
        throw new Error("No tweets found on page");
      }

      // Scroll to load more tweets
      await this.scrollToLoadTweets(page, maxTweets);

      // Extract tweet data with improved selectors
      const tweets = await page.evaluate(() => {
        const tweetElements = document.querySelectorAll(
          'article[data-testid="tweet"], [data-testid="tweet"]'
        );
        const scrapedTweets: any[] = [];

        tweetElements.forEach((tweetEl: any, index: number) => {
          if (index >= 20) return; // Limit to 20 tweets

          try {
            // Extract tweet text with multiple selectors
            const textSelectors = [
              '[data-testid="tweetText"]',
              ".tweet-text",
              "[lang]",
            ];

            let text = "";
            for (const selector of textSelectors) {
              const textEl = tweetEl.querySelector(selector);
              if (textEl?.textContent?.trim()) {
                text = textEl.textContent.trim();
                break;
              }
            }

            if (!text) return; // Skip if no text found

            // Extract author info
            const authorSelectors = [
              '[data-testid="User-Name"]',
              ".css-1dbjc4n.r-1awozwy.r-18u37iz.r-1wbh5a2",
            ];

            let username = "";
            let displayName = "";

            for (const selector of authorSelectors) {
              const authorEl = tweetEl.querySelector(selector);
              if (authorEl) {
                const link = authorEl.querySelector("a");
                if (link?.href) {
                  username = link.href.split("/").pop() || "";
                }
                const nameSpan = authorEl.querySelector("span");
                if (nameSpan?.textContent) {
                  displayName = nameSpan.textContent.trim();
                }
                break;
              }
            }

            // Extract metrics with better selectors
            const metrics = {
              retweetCount: 0,
              likeCount: 0,
              replyCount: 0,
              quoteCount: 0,
            };

            // Try to extract engagement metrics
            const metricSelectors = {
              retweet: '[data-testid="retweet"]',
              like: '[data-testid="like"]',
              reply: '[data-testid="reply"]',
            };

            Object.entries(metricSelectors).forEach(([key, selector]) => {
              const element = tweetEl.querySelector(selector);
              if (element) {
                const text = element.textContent || "";
                const number = parseInt(text.replace(/[^\d]/g, "")) || 0;
                if (key === "retweet") metrics.retweetCount = number;
                if (key === "like") metrics.likeCount = number;
                if (key === "reply") metrics.replyCount = number;
              }
            });

            // Extract hashtags and mentions
            const hashtags: string[] = [];
            const mentions: string[] = [];
            const urls: string[] = [];

            // Simple regex to find hashtags and mentions
            const hashtagRegex = /#\w+/g;
            const mentionRegex = /@\w+/g;
            const urlRegex = /https?:\/\/[^\s]+/g;

            const hashtagMatches = text.match(hashtagRegex);
            const mentionMatches = text.match(mentionRegex);
            const urlMatches = text.match(urlRegex);

            if (hashtagMatches) hashtags.push(...hashtagMatches);
            if (mentionMatches) mentions.push(...mentionMatches);
            if (urlMatches) urls.push(...cleanUrls(urlMatches));

            // Try to extract real tweet ID from URL
            let tweetId = `tweet_${Date.now()}_${index}`;
            const tweetLink = tweetEl.querySelector('a[href*="/status/"]');
            if (tweetLink) {
              const href = tweetLink.getAttribute("href");
              const idMatch = href?.match(/\/status\/(\d+)/);
              if (idMatch) {
                tweetId = idMatch[1];
              }
            }

            scrapedTweets.push({
              tweetId,
              text,
              author: {
                username,
                displayName,
              },
              createdAt: new Date(),
              metrics,
              urls,
              hashtags,
              mentions,
              isRetweet:
                text.startsWith("RT @") ||
                tweetEl.querySelector('[data-testid="socialContext"]') !== null,
            });
          } catch (error) {
            console.error("Error extracting tweet data:", error);
          }
        });

        return scrapedTweets;
      });

      logger.info(`Scraped ${tweets.length} tweets for user ${username}`);
      return tweets;
    } catch (error) {
      logger.error(`Error scraping tweets for ${username}:`, error);
      throw error;
    } finally {
      await page.close();
    }
  }

  private async scrollToLoadTweets(
    page: Page,
    maxTweets: number
  ): Promise<void> {
    let previousHeight = 0;
    let currentHeight = (await page.evaluate(
      () => document.body.scrollHeight
    )) as number;
    let scrollAttempts = 0;
    const maxScrollAttempts = 5;

    while (
      currentHeight > previousHeight &&
      scrollAttempts < maxScrollAttempts
    ) {
      previousHeight = currentHeight;
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await new Promise((resolve) => setTimeout(resolve, 2000));
      currentHeight = (await page.evaluate(
        () => document.body.scrollHeight
      )) as number;
      scrollAttempts++;
    }
  }

  async saveTweetsToDatabase(tweets: ScrapedTweet[]): Promise<ITweet[]> {
    const savedTweets: ITweet[] = [];

    for (const tweet of tweets) {
      try {
        // Check if tweet already exists
        const existingTweet = await Tweet.findOne({ tweetId: tweet.tweetId });
        if (existingTweet) {
          logger.info(`Tweet ${tweet.tweetId} already exists, skipping`);
          continue;
        }

        // Create new tweet
        const newTweet = new Tweet({
          ...tweet,
          fetchedAt: new Date(),
        });

        const savedTweet = await newTweet.save();
        savedTweets.push(savedTweet);
        logger.info(`Saved tweet ${tweet.tweetId} to database`);
      } catch (error) {
        logger.error(`Error saving tweet ${tweet.tweetId}:`, error);
      }
    }

    return savedTweets;
  }

  async fetchAndSaveTweets(
    usernames: string[],
    maxTweetsPerUser: number = 20
  ): Promise<ITweet[]> {
    const allSavedTweets: ITweet[] = [];

    for (const username of usernames) {
      try {
        logger.info(`Fetching tweets for ${username}`);
        const tweets = await this.fetchUserTweets(username, maxTweetsPerUser);
        const savedTweets = await this.saveTweetsToDatabase(tweets);
        allSavedTweets.push(...savedTweets);

        // Add delay between users to avoid rate limiting
        const delay = this.useApi ? 1000 : 5000; // Shorter delay for API
        await new Promise((resolve) => setTimeout(resolve, delay));
      } catch (error) {
        logger.error(`Error fetching tweets for ${username}:`, error);
        // Continue with other users even if one fails
      }
    }

    return allSavedTweets;
  }
}

export default new TwitterService();
