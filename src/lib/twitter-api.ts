import { TwitterApi } from 'twitter-api-v2';
import { breakIntoTweets } from './breakIntoTweet';
import axios from 'axios';
import { twitterKeys } from '../../keys';

export async function postTwitterThread(tweets: string[]) {
  // const user = await client.v2.userByUsername('theangelofpc');
  // console.log(user);

  const client = new TwitterApi(twitterKeys);

  const threadTweets = [];
  let previousTweet = null;

  for (const tweetText of tweets) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const tweet = await client.v2.tweet(tweetText, {
      ...(previousTweet && {
        reply: { in_reply_to_tweet_id: previousTweet.data.id },
      }),
    });

    threadTweets.push(tweet);
    previousTweet = tweet;
  }

  return threadTweets;
}

interface SubstackPost {
  title: string;
  content: string;
  author: string;
  images: string[];
  featuredImage: string;
  subtitle?: string;
  slug?: string;
}

async function uploadImageFromUrl(
  client: TwitterApi,
  imageUrl: string
): Promise<string | null> {
  try {
    // Download the image
    const response = await axios({
      method: 'get',
      url: imageUrl,
      responseType: 'arraybuffer',
    });

    // Upload the image to Twitter
    const mediaId = await client.v1.uploadMedia(response.data, {
      mimeType: response.headers['content-type'],
    });

    return mediaId;
  } catch (error) {
    console.error('Error uploading image from URL:', error);
    return null;
  }
}

export async function postThreadWithImages(
  post: SubstackPost,
  excludePhrases?: string[]
): Promise<{ links: string[] }> {
  // Create a client with read and write permissions
  const client = new TwitterApi(twitterKeys);
  const rwClient = client.readWrite;

  // Break post into tweet parts
  const threadTweets = await breakIntoTweets(post, {
    maxLength: 280,
    excludePhrases: excludePhrases,
  });

  const postedTweets = [];
  let previousTweetId: string | null = null;
  const MAX_RETRIES = 3;

  for (const [index, tweetPart] of threadTweets.entries()) {
    let retries = 0;
    let shouldRetry = true;

    while (shouldRetry && retries < MAX_RETRIES) {
      try {
        // Add delay between tweets
        if (index > 0) {
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tweetOptions: any = {};

        // Handle media if image exists
        if (tweetPart.image) {
          try {
            const mediaId = await uploadImageFromUrl(client, tweetPart.image);
            if (mediaId) {
              tweetOptions.media = { media_ids: [mediaId] };
            }
          } catch (imageError) {
            console.error('Image upload failed:', imageError);
          }
        }

        // Add reply context for thread
        if (previousTweetId) {
          tweetOptions.reply = {
            in_reply_to_tweet_id: previousTweetId,
          };
        }

        // Post tweet
        const tweet = await rwClient.v2.tweet(tweetPart.text, tweetOptions);
        postedTweets.push(tweet);
        previousTweetId = tweet.data.id;

        // Reset retry mechanism on successful tweet
        shouldRetry = false;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        retries++;

        // Check for rate limit error (429)

        if (error.response?.status === 429) {
          const rateLimitReset = error.response.headers['x-rate-limit-reset'];
          const waitTime = rateLimitReset
            ? (rateLimitReset - Math.floor(Date.now() / 1000)) * 1000
            : Math.pow(2, retries) * 60000; // Exponential backoff

          console.log(`Rate limited. Waiting ${waitTime / 1000} seconds.`);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        } else {
          // For non-rate limit errors, log and potentially retry
          console.error(`Error posting tweet ${index + 1}:`, error);

          if (retries >= MAX_RETRIES) {
            throw error; // Throw after max retries
          }

          // Exponential backoff for other errors
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, retries) * 1000)
          );
        }
      }
    }
  }

  // Return tweet links
  return {
    links: postedTweets.map(
      (tweet) => `https://twitter.com/x/status/${tweet.data.id}`
    ),
  };
}
