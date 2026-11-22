'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, HStack, Input, IconButton, Spinner, Text, VStack, useOutsideClick } from '@chakra-ui/react';
import Icon from '@/components/ui/Icon';
import ProductImage from '@/components/ui/ProductImage';
import { api } from '@/lib/api';
import { useDebounced } from '@/lib/hooks';
import { money } from '@/lib/format';
import { priceInfo, productUrl } from '@/lib/product';

export default function SearchBox({ autoFocus = false, onDone, placeholder = 'Search drugs, brands or symptoms' }) {
  const router = useRouter();
  const ref = useRef(null);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const dq = useDebounced(q.trim(), 250);
  useOutsideClick({ ref, handler: () => setOpen(false) });

  useEffect(() => {
    if (dq.length < 2) { setResults([]); return undefined; }
    const ctl = new AbortController();
    setLoading(true);
    api.get('/shop/search/autocomplete', { q: dq }, { auth: false, guest: false, signal: ctl.signal })
      .then((r) => { setResults(r.data || []); setOpen(true); })
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => ctl.abort();
  }, [dq]);

  const submit = (e) => {
    e?.preventDefault();
    if (!q.trim()) return;
    setOpen(false);
    router.push(`/shop?q=${encodeURIComponent(q.trim())}`);
    onDone?.();
  };

  return (
    <Box ref={ref} position="relative" w="100%">
      <form onSubmit={submit} role="search">
        <Box position="relative">
          <Box position="absolute" left="16px" top="0" bottom="0" display="flex" alignItems="center" color="pine.600" pointerEvents="none" zIndex={1}>
            <Icon name="search" size={20} />
          </Box>
          <Input value={q} onChange={(e) => setQ(e.target.value)} onFocus={() => results.length && setOpen(true)}
            autoFocus={autoFocus} placeholder={placeholder} aria-label="Search medicines" borderRadius="full" bg="white" borderColor="ink.200"
            autoComplete="off" enterKeyHint="search" textOverflow="ellipsis"
            sx={{ paddingInlineStart: '46px !important', paddingInlineEnd: q ? '52px !important' : '16px !important' }} />
          {q && (
            <Box position="absolute" right="8px" top="0" bottom="0" display="flex" alignItems="center">
              {loading ? <Spinner size="sm" color="pine.500" mr={2} /> : (
                <IconButton aria-label="Clear search" icon={<Icon name="close" size={18} />} size="sm" variant="ghost" borderRadius="full"
                  onClick={() => { setQ(''); setResults([]); }} />
              )}
            </Box>
          )}
        </Box>
      </form>
      {open && dq.length >= 2 && (
        <Box position="absolute" top="calc(100% + 8px)" left={0} right={0} bg="white" borderRadius="2xl" boxShadow="lift"
          border="1px solid" borderColor="ink.100" zIndex={50} overflow="hidden" maxH="70vh" overflowY="auto">
          {results.length === 0 && !loading ? (
            <Text p={5} color="ink.600">No match for “{dq}”. Try the generic name, or <Text as="a" href={`/shop?q=${encodeURIComponent(dq)}`} color="pine.600" fontWeight={700}>search the full shop</Text>.</Text>
          ) : (
            <VStack align="stretch" spacing={0}>
              {results.map((p) => (
                <HStack as="a" key={p._id} href={productUrl(p.slug)} spacing={3} p={3} _hover={{ bg: 'pine.50' }}
                  onClick={(e) => { e.preventDefault(); setOpen(false); router.push(productUrl(p.slug)); onDone?.(); }}>
                  <ProductImage product={p} width={120} w="48px" flexShrink={0} rounded="lg" />
                  <Box flex={1} minW={0}>
                    <Text fontWeight={700} noOfLines={1}>{p.name}</Text>
                    {p.generic_name && <Text fontSize="xs" color="ink.500" noOfLines={1}>{p.generic_name}</Text>}
                  </Box>
                  <Text fontWeight={800} color="pine.800">{money(priceInfo(p).current)}</Text>
                </HStack>
              ))}
              <HStack as="a" href={`/shop?q=${encodeURIComponent(dq)}`} p={3.5} justify="center" color="pine.600" fontWeight={700} borderTop="1px solid" borderColor="ink.100"
                onClick={submit}>
                <Text>See all results for “{dq}”</Text><Icon name="right" size={16} />
              </HStack>
            </VStack>
          )}
        </Box>
      )}
    </Box>
  );
}
