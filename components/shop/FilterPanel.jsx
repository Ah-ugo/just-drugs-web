'use client';
import NextLink from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  Box,
  Button,
  Checkbox,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  HStack,
  Input,
  Select,
  Text,
  VStack,
  useDisclosure,
} from '@chakra-ui/react';
import Icon from '@/components/ui/Icon';

export const SORTS = [
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Most popular' },
  { value: 'price_low', label: 'Price: low to high' },
  { value: 'price_high', label: 'Price: high to low' },
  { value: 'name', label: 'Name: A–Z' },
];

function useNav() {
  const router = useRouter();
  const path = usePathname();
  const sp = useSearchParams();
  return {
    sp,
    update(patch) {
      const next = new URLSearchParams(sp.toString());
      Object.entries(patch).forEach(([k, v]) => {
        if (v === '' || v === null || v === undefined || v === false) next.delete(k);
        else next.set(k, String(v));
      });
      next.delete('page');
      router.push(`${path}${next.toString() ? `?${next}` : ''}`, { scroll: false });
    },
    clear() {
      const q = sp.get('q');
      router.push(q ? `${path}?q=${encodeURIComponent(q)}` : path, { scroll: false });
    },
  };
}

export function SortSelect() {
  const { sp, update } = useNav();
  return (
    <Select
      aria-label="Sort products"
      value={sp.get('sort_by') || 'newest'}
      onChange={(e) => update({ sort_by: e.target.value === 'newest' ? '' : e.target.value })}
      w={{ base: '100%', md: '210px' }}
      h="44px"
      borderRadius="full"
      bg="white"
    >
      {SORTS.map((s) => (
        <option key={s.value} value={s.value}>
          {s.label}
        </option>
      ))}
    </Select>
  );
}

function Filters({ categories = [], brands = [], activeCategory, onClose }) {
  const { sp, update, clear } = useNav();
  const [min, setMin] = useState(sp.get('min_price') || '');
  const [max, setMax] = useState(sp.get('max_price') || '');
  useEffect(() => {
    setMin(sp.get('min_price') || '');
    setMax(sp.get('max_price') || '');
  }, [sp]);
  const q = sp.get('q');

  return (
    <VStack align="stretch" spacing={6}>
      <Box>
        <Flex justify="space-between" align="center" mb={2}>
          <Text fontFamily="heading" fontWeight={800} fontSize="sm" color="pine.900">
            Category
          </Text>
          {activeCategory && (
            <Text
              as={NextLink}
              href={q ? `/shop?q=${encodeURIComponent(q)}` : '/shop'}
              onClick={onClose}
              fontSize="xs"
              fontWeight={700}
              color="pine.600"
              _hover={{ textDecoration: 'underline' }}
            >
              Clear
            </Text>
          )}
        </Flex>
        <VStack align="stretch" spacing={1} maxH="280px" overflowY="auto" className="hide-scrollbar" pr={1}>
          <HStack
            as={NextLink}
            href={q ? `/shop?q=${encodeURIComponent(q)}` : '/shop'}
            onClick={onClose}
            px={2.5}
            py={2}
            borderRadius="lg"
            bg={!activeCategory ? 'pine.50' : 'transparent'}
            border="1px solid"
            borderColor={!activeCategory ? 'pine.200' : 'transparent'}
            color={!activeCategory ? 'pine.800' : 'ink.700'}
            fontSize="sm"
            fontWeight={!activeCategory ? 700 : 500}
            transition="all .12s ease"
            _hover={{ bg: 'ink.50' }}
          >
            <Box
              w="24px"
              h="24px"
              minW="24px"
              borderRadius="md"
              bg={!activeCategory ? 'white' : 'ink.100'}
              display="flex"
              alignItems="center"
              justifyContent="center"
              fontSize="13px"
            >
              ✨
            </Box>
            <Text noOfLines={1} flex={1}>
              All medicines
            </Text>
            {!activeCategory && <Icon name="check" size={14} color="#1B7F5A" />}
          </HStack>
          {categories.map((c) => {
            const active = activeCategory === c.slug;
            return (
              <HStack
                key={c._id || c.slug}
                as={NextLink}
                href={`/category/${c.slug}`}
                onClick={onClose}
                px={2.5}
                py={2}
                borderRadius="lg"
                bg={active ? 'pine.50' : 'transparent'}
                border="1px solid"
                borderColor={active ? 'pine.200' : 'transparent'}
                color={active ? 'pine.800' : 'ink.700'}
                fontSize="sm"
                fontWeight={active ? 700 : 500}
                justify="space-between"
                transition="all .12s ease"
                _hover={{ bg: active ? 'pine.100' : 'ink.50' }}
              >
                <HStack spacing={2} minW={0} flex={1}>
                  <Box
                    w="24px"
                    h="24px"
                    minW="24px"
                    borderRadius="md"
                    bg={active ? 'white' : 'ink.100'}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    fontSize="13px"
                    aria-hidden="true"
                  >
                    {c.emoji || '💊'}
                  </Box>
                  <Text noOfLines={1}>{c.name}</Text>
                </HStack>
                {active && <Icon name="check" size={14} color="#1B7F5A" />}
              </HStack>
            );
          })}
        </VStack>
      </Box>

      {brands.length > 0 && (
        <Box>
          <Text fontFamily="heading" fontWeight={800} fontSize="sm" color="pine.900" mb={2}>
            Brand
          </Text>
          <Select
            placeholder="All brands"
            value={sp.get('brand_id') || ''}
            onChange={(e) => update({ brand_id: e.target.value })}
            h="44px"
          >
            {brands.map((b) => (
              <option key={b._id} value={b._id}>
                {b.name}
              </option>
            ))}
          </Select>
        </Box>
      )}

      <Box>
        <Text fontFamily="heading" fontWeight={800} fontSize="sm" color="pine.900" mb={2}>
          Price (₦)
        </Text>
        <HStack
          as="form"
          onSubmit={(e) => {
            e.preventDefault();
            update({ min_price: min, max_price: max });
          }}
        >
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="Min"
            value={min}
            onChange={(e) => setMin(e.target.value)}
            aria-label="Minimum price"
          />
          <Text color="ink.400">–</Text>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="Max"
            value={max}
            onChange={(e) => setMax(e.target.value)}
            aria-label="Maximum price"
          />
          <Button type="submit" variant="dark" size="sm" flexShrink={0}>
            Go
          </Button>
        </HStack>
      </Box>

      <Checkbox
        colorScheme="pine"
        isChecked={sp.get('requires_prescription') === 'false'}
        onChange={(e) => update({ requires_prescription: e.target.checked ? 'false' : '' })}
      >
        No prescription needed
      </Checkbox>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          clear();
          onClose?.();
        }}
        alignSelf="flex-start"
        leftIcon={<Icon name="refresh" size={16} />}
      >
        Reset filters
      </Button>
    </VStack>
  );
}

export function FilterSidebar(props) {
  return (
    <Box
      display={{ base: 'none', lg: 'block' }}
      w="260px"
      flexShrink={0}
      position="sticky"
      top="150px"
      alignSelf="flex-start"
      bg="white"
      border="1px solid"
      borderColor="ink.100"
      borderRadius="2xl"
      p={5}
    >
      <Filters {...props} />
    </Box>
  );
}

export function FilterDrawerButton(props) {
  const drawer = useDisclosure();
  return (
    <>
      <Button
        onClick={drawer.onOpen}
        variant="outline"
        h="44px"
        leftIcon={<Icon name="filter" size={18} />}
        bg="white"
      >
        Filters
      </Button>
      <Drawer isOpen={drawer.isOpen} placement="left" onClose={drawer.onClose} size="xs">
        <DrawerOverlay bg="blackAlpha.600" backdropFilter="blur(2px)" />
        <DrawerContent maxW={{ base: '84vw', sm: '320px' }} borderRightRadius="2xl" overflow="hidden">
          <DrawerCloseButton top={4} right={4} size="md" borderRadius="full" />
          <DrawerHeader fontFamily="heading" pt={5} pb={3} px={4} borderBottom="1px solid" borderColor="ink.100">
            Filters
          </DrawerHeader>
          <DrawerBody px={4} py={4} pb="calc(80px + env(safe-area-inset-bottom))" sx={{ overscrollBehavior: 'contain' }}>
            <Filters {...props} onClose={drawer.onClose} />
          </DrawerBody>
          <DrawerFooter borderTop="1px solid" borderColor="ink.100" p={4}>
            <Button variant="buy" w="full" h="44px" onClick={drawer.onClose}>
              Show results
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}
