'use client';
import NextLink from 'next/link';
import { useState } from 'react';
import { Badge, Box, Button, FormControl, FormErrorMessage, HStack, Text, Textarea, VStack } from '@chakra-ui/react';
import Icon from '@/components/ui/Icon';
import Rating from '@/components/ui/Rating';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { fmtDate } from '@/lib/format';
import { useNotify } from '@/lib/hooks';

export default function Reviews({ productId, initial }) {
  const { isAuthed } = useAuth();
  const notify = useNotify();
  const [data, setData] = useState({ reviews: initial?.reviews || [], avg: initial?.average_rating || 0, total: initial?.total_reviews || 0 });
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!rating) return setErr('Tap a star to rate this medicine.');
    if (comment.trim().length < 3) return setErr('Tell others a little about your experience.');
    setErr(''); setBusy(true);
    try {
      const r = await api.post('/reviews', { product_id: productId, rating, comment: comment.trim() });
      const rev = r.data;
      setData((d) => {
        const total = d.total + 1;
        return { reviews: [rev, ...d.reviews], total, avg: Math.round(((d.avg * d.total + rating) / total) * 10) / 10 };
      });
      setRating(0); setComment('');
      notify.success('Thanks for your review!');
    } catch (e2) { setErr(e2.message); } finally { setBusy(false); }
  };

  return (
    <Box id="reviews">
      <HStack spacing={4} mb={5} align="center">
        <Text fontFamily="heading" fontWeight={800} fontSize="5xl" color="pine.900" lineHeight={1}>{data.total ? data.avg.toFixed(1) : '–'}</Text>
        <Box><Rating value={data.avg} showValue={false} size={20} /><Text color="ink.500" fontSize="sm">{data.total ? `${data.total} review${data.total === 1 ? '' : 's'}` : 'No reviews yet'}</Text></Box>
      </HStack>

      <VStack align="stretch" spacing={3}>
        {data.reviews.map((r) => (
          <Box key={r._id} bg="white" border="1px solid" borderColor="ink.100" borderRadius="xl" p={4}>
            <HStack justify="space-between" mb={1.5} flexWrap="wrap">
              <HStack><Text fontWeight={700}>{r.user_name || 'Customer'}</Text>
                {r.is_verified_purchase && <Badge colorScheme="green" variant="subtle">Verified purchase</Badge>}</HStack>
              <Text fontSize="sm" color="ink.500">{fmtDate(r.created_at)}</Text>
            </HStack>
            <Rating value={r.rating} showValue={false} size={15} />
            <Text mt={2} color="ink.700">{r.comment}</Text>
          </Box>
        ))}
      </VStack>

      <Box mt={6} bg="white" border="1px solid" borderColor="ink.100" borderRadius="2xl" p={{ base: 4, md: 6 }}>
        <Text fontFamily="heading" fontWeight={800} fontSize="xl" mb={3}>Share your experience</Text>
        {isAuthed ? (
          <form onSubmit={submit}>
            <FormControl isInvalid={!!err}>
              <HStack spacing={1} mb={3} role="radiogroup" aria-label="Your rating">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Box as="button" type="button" key={i} onClick={() => setRating(i)} aria-label={`${i} star${i > 1 ? 's' : ''}`} role="radio" aria-checked={rating === i} p={1}>
                    <Icon name="star" size={32} variant={i <= rating ? 'Bold' : 'Linear'} color={i <= rating ? '#F5A800' : '#8A9C92'} />
                  </Box>
                ))}
              </HStack>
              <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="How did it work for you? Any tips for other buyers?" rows={3} />
              <FormErrorMessage>{err}</FormErrorMessage>
            </FormControl>
            <Button type="submit" mt={4} isLoading={busy} variant="dark">Post review</Button>
          </form>
        ) : (
          <Text color="ink.600"><Text as={NextLink} href={`/login?next=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : '/')}`} color="pine.600" fontWeight={700}>Sign in</Text> to leave a review.</Text>
        )}
      </Box>
    </Box>
  );
}
