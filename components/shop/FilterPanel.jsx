'use client';
import NextLink from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Box, Button, Checkbox, Drawer, DrawerBody, DrawerCloseButton, DrawerContent, DrawerFooter, DrawerHeader, DrawerOverlay, HStack, Input, Select, Text, VStack, useDisclosure } from '@chakra-ui/react';
import Icon from '@/components/ui/Icon';

export const SORTS = [
  { value: 'newest', label: 'Newest' }, { value: 'popular', label: 'Most popular' },
  { value: 'price_low', label: 'Price: low to high' }, { value: 'price_high', label: 'Price: high to low' }, { value: 'name', label: 'Name: A–Z' },
];

function useNav() {
  const router = useRouter();
  const path = usePathname();
  const sp = useSearchParams();
  return {
    sp,
    update(patch) {
      const next = new URLSearchParams(sp.toString());
      Object.entries(patch).forEach(([k, v]) => { if (v === '' || v === null || v === undefined || v === false) next.delete(k); else next.set(k, String(v)); });
      next.delete('page');
      router.push(`${path}${next.toString() ? `?${next}` : ''}`, { scroll: false });
    },
    clear() { const q = sp.get('q'); router.push(q ? `${path}?q=${encodeURIComponent(q)}` : path, { scroll: false }); },
  };
}

export function SortSelect() {
  const { sp, update } = useNav();
  return (
    <Select aria-label="Sort products" value={sp.get('sort_by') || 'newest'} onChange={(e) => update({ sort_by: e.target.value === 'newest' ? '' : e.target.value })}
      w={{ base: '100%', md: '210px' }} h="44px" borderRadius="full" bg="white">
      {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
    </Select>
  );
}

function Filters({ categories, brands, activeCategory }) {
  const { sp, update, clear } = useNav();
  const [min, setMin] = useState(sp.get('min_price') || '');
  const [max, setMax] = useState(sp.get('max_price') || '');
  useEffect(() => { setMin(sp.get('min_price') || ''); setMax(sp.get('max_price') || ''); }, [sp]);
  const q = sp.get('q');

  return (
    <VStack align="stretch" spacing={7}>
      <Box>
        <Text fontFamily="heading" fontWeight={800} mb={2}>Category</Text>
        <VStack align="stretch" spacing={0.5}>
          <Button as={NextLink} href={q ? `/shop?q=${encodeURIComponent(q)}` : '/shop'} variant={!activeCategory ? 'soft' : 'ghost'} justifyContent="flex-start" size="sm" h={9}>All medicines</Button>
          {categories.map((c) => (
            <Button key={c._id} as={NextLink} href={`/category/${c.slug}`} variant={activeCategory === c.slug ? 'soft' : 'ghost'} justifyContent="flex-start" size="sm" h={9} fontWeight={activeCategory === c.slug ? 800 : 500}>
              <Text as="span" w="24px" aria-hidden="true">{c.emoji}</Text>{c.name}
            </Button>
          ))}
        </VStack>
      </Box>

      {brands.length > 0 && (
        <Box>
          <Text fontFamily="heading" fontWeight={800} mb={2}>Brand</Text>
          <Select placeholder="All brands" value={sp.get('brand_id') || ''} onChange={(e) => update({ brand_id: e.target.value })} h="44px">
            {brands.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
          </Select>
        </Box>
      )}

      <Box>
        <Text fontFamily="heading" fontWeight={800} mb={2}>Price (₦)</Text>
        <HStack as="form" onSubmit={(e) => { e.preventDefault(); update({ min_price: min, max_price: max }); }}>
          <Input type="number" inputMode="numeric" min={0} placeholder="Min" value={min} onChange={(e) => setMin(e.target.value)} aria-label="Minimum price" />
          <Text color="ink.400">–</Text>
          <Input type="number" inputMode="numeric" min={0} placeholder="Max" value={max} onChange={(e) => setMax(e.target.value)} aria-label="Maximum price" />
          <Button type="submit" variant="dark" size="sm" flexShrink={0}>Go</Button>
        </HStack>
      </Box>

      <Checkbox colorScheme="pine" isChecked={sp.get('requires_prescription') === 'false'} onChange={(e) => update({ requires_prescription: e.target.checked ? 'false' : '' })}>
        No prescription needed
      </Checkbox>

      <Button variant="ghost" size="sm" onClick={clear} alignSelf="flex-start" leftIcon={<Icon name="refresh" size={16} />}>Reset filters</Button>
    </VStack>
  );
}

export function FilterSidebar(props) {
  return (
    <Box display={{ base: 'none', lg: 'block' }} w="260px" flexShrink={0} position="sticky" top="150px" alignSelf="flex-start" bg="white" border="1px solid" borderColor="ink.100" borderRadius="2xl" p={5}>
      <Filters {...props} />
    </Box>
  );
}

export function FilterDrawerButton(props) {
  const drawer = useDisclosure();
  return (
    <>
      <Button onClick={drawer.onOpen} variant="outline" h="44px" leftIcon={<Icon name="filter" size={18} />} bg="white">Filters</Button>
      <Drawer isOpen={drawer.isOpen} placement="bottom" onClose={drawer.onClose}>
        <DrawerOverlay />
        <DrawerContent borderTopRadius="3xl" maxH="88vh">
          <DrawerCloseButton />
          <DrawerHeader fontFamily="heading">Filters</DrawerHeader>
          <DrawerBody><Filters {...props} /></DrawerBody>
          <DrawerFooter><Button variant="buy" w="full" onClick={drawer.onClose}>Show results</Button></DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}
