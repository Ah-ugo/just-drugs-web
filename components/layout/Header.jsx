'use client';
import NextLink from 'next/link';
import { useEffect, useState } from 'react';
import { Badge, Box, Button, Drawer, DrawerBody, DrawerCloseButton, DrawerContent, DrawerHeader, DrawerOverlay, Flex, HStack, IconButton, Text, VStack, useDisclosure } from '@chakra-ui/react';
import Icon from '@/components/ui/Icon';
import Logo from '@/components/ui/Logo';
import WhatsAppIcon from '@/components/ui/WhatsAppIcon';
import SearchBox from './SearchBox';
import { Page } from '@/components/ui/Layout';
import { useStore } from '@/context/StoreContext';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { money } from '@/lib/format';

function CountBadge({ n }) {
  const [bump, setBump] = useState(false);
  useEffect(() => { if (!n) return undefined; setBump(true); const t = setTimeout(() => setBump(false), 400); return () => clearTimeout(t); }, [n]);
  if (!n) return null;
  return (
    <Badge position="absolute" top="-2px" right="-2px" bg="gold.400" color="pine.900" borderRadius="full" minW="20px" h="20px"
      display="flex" alignItems="center" justifyContent="center" fontSize="11px" animation={bump ? 'jd-bump .4s ease' : undefined}>
      {n > 99 ? '99+' : n}
    </Badge>
  );
}

export default function Header() {
  const { storeName, categories, freeThreshold, wa } = useStore();
  const { isAuthed, user } = useAuth();
  const { count, drawer } = useCart();
  const wl = useWishlist();
  const menu = useDisclosure();
  const [showSearch, setShowSearch] = useState(false);

  const navLinks = [
    { href: '/shop', label: 'Shop all' },
    { href: '/prescriptions', label: 'Upload prescription' },
    { href: '/track', label: 'Track order' },
    { href: '/help', label: 'Help' },
  ];

  return (
    <Box as="header" className="no-print" position="sticky" top={0} zIndex={40} bg="white" boxShadow="soft">
      <Box bg="pine.800" color="pine.50" fontSize="sm" display={{ base: 'none', md: 'block' }}>
        <Page>
          <Flex justify="space-between" py={2} gap={4}>
            <Text>Free delivery on orders from {money(freeThreshold)} · Pay securely with Paystack</Text>
            <HStack spacing={5}>
              <Text as={NextLink} href="/track" _hover={{ color: 'gold.300' }}>Track order</Text>
              <Text as="a" href={wa('Hello 👋 I need help with an order.')} target="_blank" rel="noopener noreferrer" _hover={{ color: 'gold.300' }}>WhatsApp us</Text>
            </HStack>
          </Flex>
        </Page>
      </Box>

      <Page>
        <Flex align="center" gap={{ base: 2, md: 6 }} h={{ base: '64px', md: '76px' }}>
          <IconButton display={{ base: 'inline-flex', lg: 'none' }} aria-label="Open menu" icon={<Icon name="menu" size={24} />} variant="ghost" onClick={menu.onOpen} ml={-2} />
          <Logo name={storeName} />
          <Box flex={1} maxW="640px" display={{ base: 'none', md: 'block' }} mx="auto"><SearchBox /></Box>
          <HStack spacing={{ base: 0, md: 1 }} ml="auto">
            <IconButton display={{ base: 'inline-flex', md: 'none' }} aria-label="Search" icon={<Icon name="search" size={22} />} variant="ghost" onClick={() => setShowSearch((s) => !s)} />
            <Button as="a" href={wa('Hello 👋 I’d like to order some medicines.')} target="_blank" rel="noopener noreferrer" variant="wa" size="sm"
              display={{ base: 'none', xl: 'inline-flex' }} leftIcon={<WhatsAppIcon size={18} />} mr={2}>Order on WhatsApp</Button>
            <Box position="relative" display={{ base: 'none', md: 'block' }}>
              <IconButton as={NextLink} href="/wishlist" aria-label="Wishlist" icon={<Icon name="heart" size={23} />} variant="ghost" borderRadius="full" />
              <CountBadge n={wl.count} />
            </Box>
            <IconButton as={NextLink} href={isAuthed ? '/account' : '/login'} aria-label={isAuthed ? 'My account' : 'Sign in'} display={{ base: 'none', md: 'inline-flex' }}
              icon={<Icon name="user" size={23} />} variant="ghost" borderRadius="full" title={isAuthed ? `${user?.first_name}` : 'Sign in'} />
            <Box position="relative">
              <IconButton aria-label={`Cart, ${count} items`} icon={<Icon name="cart" size={23} />} variant="ghost" borderRadius="full" onClick={drawer.onOpen} />
              <CountBadge n={count} />
            </Box>
          </HStack>
        </Flex>
        {showSearch && <Box pb={3} display={{ md: 'none' }}><SearchBox autoFocus onDone={() => setShowSearch(false)} /></Box>}
      </Page>

      <Box borderTop="1px solid" borderColor="ink.100" display={{ base: 'none', lg: 'block' }}>
        <Page>
          <HStack spacing={1} py={2} overflowX="auto" className="hide-scrollbar">
            {categories.slice(0, 9).map((c) => (
              <Button key={c._id} as={NextLink} href={`/category/${c.slug}`} variant="ghost" size="sm" flexShrink={0} fontWeight={600} color="ink.700">
                {c.emoji && <Text as="span" mr={1.5} aria-hidden="true">{c.emoji}</Text>}{c.name}
              </Button>
            ))}
          </HStack>
        </Page>
      </Box>

      <Drawer isOpen={menu.isOpen} placement="left" onClose={menu.onClose} size="xs">
        <DrawerOverlay />
        <DrawerContent maxW="86vw">
          <DrawerCloseButton />
          <DrawerHeader><Logo name={storeName} /></DrawerHeader>
          <DrawerBody px={3}>
            <VStack align="stretch" spacing={0.5} onClick={menu.onClose}>
              {navLinks.map((l) => <Button key={l.href} as={NextLink} href={l.href} variant="ghost" justifyContent="flex-start" h={12}>{l.label}</Button>)}
              <Button as={NextLink} href="/wishlist" variant="ghost" justifyContent="flex-start" h={12}>Wishlist {wl.count ? `(${wl.count})` : ''}</Button>
              <Button as={NextLink} href={isAuthed ? '/account' : '/login'} variant="ghost" justifyContent="flex-start" h={12}>{isAuthed ? `Hi, ${user?.first_name}` : 'Sign in / Create account'}</Button>
            </VStack>
            <Text mt={5} mb={2} px={3} fontWeight={800} fontFamily="heading" color="pine.900">Categories</Text>
            <VStack align="stretch" spacing={0} onClick={menu.onClose}>
              {categories.map((c) => (
                <Button key={c._id} as={NextLink} href={`/category/${c.slug}`} variant="ghost" justifyContent="flex-start" h={11} fontWeight={500}>
                  <Text as="span" w="28px" aria-hidden="true">{c.emoji}</Text>{c.name}
                </Button>
              ))}
            </VStack>
            <Button as="a" href={wa('Hello 👋 I’d like to order some medicines.')} target="_blank" rel="noopener noreferrer" variant="wa" w="full" mt={6} mb={6} leftIcon={<WhatsAppIcon />}>Order on WhatsApp</Button>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
}
