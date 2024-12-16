interface SubstackPost {
  title: string;
  content: string;
  author: string;
  images: string[];
  featuredImage: string;
  subtitle?: string;
  slug?: string;
}

export function breakIntoTweets(
  post: SubstackPost,
  options: {
    maxLength?: number;
    excludePhrases?: string[];
  } = {}
): { text: string; image?: string }[] {
  const { maxLength = 280, excludePhrases = [] } = options;
  const tweets: { text: string; image?: string }[] = [];
  const postUrl = `https://angelofpc.com/p/${post.slug}`;

  // Prepare and clean content
  // Prepare and clean content
  let content = `${post.content}\n`
    .replace(/\s+/g, ' ')
    .replace(/\.(?=\S)/g, '. ') // Ensure a space after full stops
    .trim();

  // Remove excluded phrases
  excludePhrases.forEach((phrase) => {
    content = content.replace(new RegExp(escapeRegExp(phrase), 'gi'), '');
  });

  // Break content into tweets
  while (content.length > 0) {
    let tweetText = content.slice(0, maxLength);

    // Ensure no partial words and account for Twitter's stricter limits
    if (tweetText.length === maxLength && content[maxLength] !== ' ') {
      const lastSpaceIndex = tweetText.lastIndexOf(' ');
      tweetText = tweetText.slice(0, lastSpaceIndex).trim();
    }

    // Adjust for encoded characters like URLs that may increase byte size
    while (new TextEncoder().encode(tweetText).length > maxLength) {
      const lastSpaceIndex = tweetText.lastIndexOf(' ');
      tweetText = tweetText.slice(0, lastSpaceIndex).trim();
    }

    // Add first tweet with image if available
    if (tweets.length === 0 && (post.featuredImage || post.images?.[0])) {
      tweets.push({
        text: tweetText,
        image: post.featuredImage || post.images[0],
      });
    } else {
      tweets.push({ text: tweetText });
    }

    // Remove used content
    content = content.slice(tweetText.length).trim();
  }

  // Add remaining images
  const remainingImages = post.images?.slice(1) || [];
  remainingImages.forEach((image) => {
    tweets.push({ text: '', image });
  });

  // Add post URL
  tweets.push({ text: `Title: ${post.title} -- \nLink: ${postUrl}.` });

  return tweets;
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
