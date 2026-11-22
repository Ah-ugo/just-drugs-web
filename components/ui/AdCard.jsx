'use client';
import NextLink from 'next/link';
import { Box, Button, Heading, Text } from '@chakra-ui/react';
import { optimizeImage } from '@/lib/images';

/** One admin-managed banner ad (image or video) with a text overlay. */
export default function AdCard({ ad, minH = { base: '170px', md: '220px' }, priority = false }) {
  const link = ad.link || '/shop';
  const external = /^https?:\/\//.test(link);
  const linkProps = external ? { as: 'a', href: link, target: '_blank', rel: 'noopener noreferrer' } : { as: NextLink, href: link };
  return (
    <Box position="relative" overflow="hidden" borderRadius="2xl" minH={minH} bg="pine.800" color="white">
      {ad.media_type === 'video' ? (
        <video src={ad.image_video_url} autoPlay muted loop playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <img src={optimizeImage(ad.image_video_url, 1100)} alt="" loading={priority ? 'eager' : 'lazy'} decoding="async"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      )}
      <Box position="absolute" inset={0} bg="linear-gradient(90deg, rgba(7,43,31,.88) 0%, rgba(7,43,31,.55) 55%, rgba(7,43,31,.1) 100%)" />
      <Box position="relative" p={{ base: 5, md: 8 }} maxW="470px" display="flex" flexDirection="column" justifyContent="center" h="100%" minH={minH} gap={2}>
        {ad.subtitle && <Text fontWeight={700} color="gold.300">{ad.subtitle}</Text>}
        <Heading as="h3" color="white" fontSize={{ base: '2xl', md: '4xl' }} lineHeight={1.05}>{ad.title}</Heading>
        {ad.description && <Text color="pine.50" noOfLines={2}>{ad.description}</Text>}
        {ad.button_text && <Button {...linkProps} variant="buy" size="sm" mt={2} alignSelf="flex-start">{ad.button_text}</Button>}
      </Box>
    </Box>
  );
}

export const adsOf = (banners = []) =>
  banners.flatMap((b) => b.ads || []).filter((a) => a.image_video_url).sort((a, b) => (a.priority || 0) - (b.priority || 0));
