'use client';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Button, HStack, Text } from '@chakra-ui/react';
import Icon from '@/components/ui/Icon';

export default function Pagination({ page, pages }) {
  const router = useRouter();
  const path = usePathname();
  const sp = useSearchParams();
  if (!pages || pages <= 1) return null;

  const go = (n) => {
    const next = new URLSearchParams(sp.toString());
    if (n <= 1) next.delete('page'); else next.set('page', String(n));
    router.push(`${path}${next.toString() ? `?${next}` : ''}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const nums = [];
  for (let i = 1; i <= pages; i += 1) if (i === 1 || i === pages || Math.abs(i - page) <= 1) nums.push(i);
  const withGaps = nums.flatMap((n, i) => (i && n - nums[i - 1] > 1 ? ['…', n] : [n]));

  return (
    <HStack as="nav" aria-label="Pagination" justify="center" spacing={1.5} mt={10} flexWrap="wrap">
      <Button size="sm" variant="outline" isDisabled={page <= 1} onClick={() => go(page - 1)} leftIcon={<Icon name="left" size={16} />}>Prev</Button>
      {withGaps.map((n, i) => n === '…'
        ? <Text key={`g${i}`} px={1} color="ink.400">…</Text>
        : <Button key={n} size="sm" minW="40px" variant={n === page ? 'dark' : 'ghost'} aria-current={n === page ? 'page' : undefined} onClick={() => go(n)}>{n}</Button>)}
      <Button size="sm" variant="outline" isDisabled={page >= pages} onClick={() => go(page + 1)} rightIcon={<Icon name="right" size={16} />}>Next</Button>
    </HStack>
  );
}
