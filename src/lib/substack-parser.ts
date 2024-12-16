import axios from 'axios';
import * as cheerio from 'cheerio';

interface SubstackPost {
  title: string;
  content: string;
  subtitle: string;
  featuredImage: string;
  slug: string;
  images: string[];
}

export async function parseSubstackPost(url: string): Promise<SubstackPost> {
  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    const $ = cheerio.load(data);

    const title = $('h1.post-title').text().trim();

    const featuredImage = $('meta[property="og:image"]').attr('content') || '';
    const subtitle = $('meta[property="og:description"]').attr('content') || '';
    const slug =
      $('meta[property="og:url"]').attr('content')?.split('/p/')[1] || '';

    // Extract the body content, excluding the pullquote
    const content = $('.body.markup')
      .clone() // Clone the body to avoid mutation
      .find('.pullquote') // Find the pullquote
      .remove() // Remove it
      .end() // Return to the original body markup
      .text() // Extract the text content
      .trim(); // Trim whitespace

    // console.log(title, content, subtitle, featuredImage, slug);
    // console.log(title, content, featuredImage, subtitle, slug, []);

    console.log(slug);

    return { title, content, slug, featuredImage, subtitle, images: [] };
  } catch (error) {
    console.error('Substack parsing error:', error);
    throw new Error('Could not parse Substack post');
  }
}
