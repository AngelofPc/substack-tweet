'use client';

import { useState } from 'react';
import {
  Box,
  Container,
  Flex,
  Heading,
  Image,
  Input,
  Text,
  Textarea,
  VStack,
} from '@chakra-ui/react';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { breakIntoTweets } from '@/lib/breakIntoTweet';

interface SubstackPost {
  title: string;
  content: string;
  author: string;
  images: string[];
  featuredImage: string;
  subtitle?: string;
  slug?: string;
}

export default function SubstackToTwitterConverter() {
  const [substackUrl, setSubstackUrl] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [post, setPost] = useState<SubstackPost>();
  const [twitterThreadTweets, setTwitterThreadTweets] = useState<
    {
      image: string;
      text: string;
    }[]
  >([]);

  const handleFetchPost = async () => {
    setIsLoading(true);
    setError('');
    setTwitterThreadTweets([]);
    setPost(null);
    try {
      const response = await fetch('/api/fetch-substack', {
        method: 'POST',
        body: JSON.stringify({ url: substackUrl }),
      });

      console.log(response);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch Substack post');
      }

      // const aa = await axios.post(
      //   '/api/fetch-substack',
      //   { url: substackUrl },
      //   {
      //     headers: {
      //       Accept: 'application/json',
      //     },
      //   }
      // );

      setPost(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An unknown error occurred'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const generateTwitterThread = () => {
    if (!post) return;
    const tweets = breakIntoTweets(post as SubstackPost, {
      excludePhrases: [
        'Thanks for reading Inked from the mind!',
        'Subscribe for free to receive new posts and support my work',
        'work.Subscribe',
      ],
    });
    console.log('tweets');
    console.log(tweets);

    setTwitterThreadTweets(tweets);
  };

  const postToTwitter = async () => {
    setIsLoading(true);
    setError('');

    try {
      console.log('postToTwitter');
      console.log(post);
      const response = await fetch('/api/post-thread', {
        method: 'POST',
        body: JSON.stringify({ post }),
        // body: JSON.stringify({ tweets: twitterThreadTweets }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to post Twitter thread');
      }

      alert('Thread posted successfully!');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An unknown error occurred'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxW="container.md" py={8}>
      <VStack gap={6} width="full">
        <Heading as="h1" size="xl" textAlign="center">
          Substack to Twitter Thread Converter
        </Heading>

        <Box width="full">
          <Heading as="h3" size="sm" mb={2}>
            Substack Post URL
          </Heading>
          <Flex gap={4}>
            <Input
              placeholder="Enter Substack Post URL"
              value={substackUrl}
              onChange={(e) => setSubstackUrl(e.target.value)}
              flex={1}
            />
            <Button
              onClick={handleFetchPost}
              loading={isLoading}
              colorScheme="blue"
            >
              Fetch Post
            </Button>
          </Flex>
        </Box>

        {error && <Alert status="info" title={error} />}

        {post && (
          <VStack width="full" gap={4}>
            <Box width="full">
              <Text fontWeight="bold">{post.title}</Text>
              {post.subtitle && <Text fontStyle="italic">{post.subtitle}</Text>}
              {post.featuredImage && (
                <Image w={300} h={300} src={post.featuredImage} />
              )}
            </Box>

            <Textarea
              value={post.content}
              onChange={(e) =>
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                setPost((prev) => ({
                  ...prev,
                  content: e.target.value,
                }))
              }
              height="200px"
            />

            <Button
              onClick={generateTwitterThread}
              loading={isLoading}
              colorScheme="green"
            >
              Generate Twitter Thread
            </Button>
          </VStack>
        )}

        {twitterThreadTweets.length > 0 && (
          <VStack width="full" gap={4}>
            <Text fontSize="lg" fontWeight="bold">
              Twitter Thread Preview:
            </Text>
            {twitterThreadTweets.map((tweet, index) => (
              <Box
                borderWidth={8}
                key={index}
                width="full"
                borderColor="grey.100"
                p={2}
              >
                <Text>{tweet.text}</Text>
                {tweet?.image && (
                  <Image w={300} h={300} src={post.featuredImage} />
                )}
              </Box>
            ))}
            <Button
              onClick={postToTwitter}
              loading={isLoading}
              colorScheme="twitter"
            >
              Post Thread to Twitter
            </Button>
          </VStack>
        )}
      </VStack>
    </Container>
  );
}
