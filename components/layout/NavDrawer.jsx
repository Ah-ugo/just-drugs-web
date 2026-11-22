'use client';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import {
  Badge,
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  HStack,
  Text,
  VStack,
} from '@chakra-ui/react';
import Icon from '@/components/ui/Icon';
import Logo from '@/components/ui/Logo';
import WhatsAppIcon from '@/components/ui/WhatsAppIcon';
import { useStore } from '@/context/StoreContext';
import { useAuth } from '@/context/AuthContext';
import { useWishlist } from '@/context/WishlistContext';

export default function NavDrawer() {
  const { storeName, categories, wa, navDrawer } = useStore();
  const { isAuthed, user } = useAuth();
  const wl = useWishlist();
  const pathname = usePathname();

  // Close drawer automatically when user navigates
  useEffect(() => {
    navDrawer?.onClose();
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const navLinks = [
    { href: '/shop', label: 'Shop all medicines', icon: 'shop' },
    { href: '/prescriptions', label: 'Upload prescription', icon: 'upload' },
    { href: '/track', label: 'Track order', icon: 'truck' },
    { href: '/help', label: 'Help & support', icon: 'support' },
  ];

  if (!navDrawer) return null;

  return (
    <Drawer
      isOpen={navDrawer.isOpen}
      placement="left"
      onClose={navDrawer.onClose}
      size="xs"
    >
      <DrawerOverlay bg="blackAlpha.600" backdropFilter="blur(2px)" />
      <DrawerContent maxW={{ base: '84vw', sm: '320px' }} w="100%" borderRightRadius="2xl" bg="white" overflow="hidden">
        <DrawerCloseButton top={4} right={4} size="md" borderRadius="full" />
        <DrawerHeader pt={5} pb={3} px={4} borderBottom="1px solid" borderColor="ink.100">
          <Logo name={storeName} />
        </DrawerHeader>
        <DrawerBody px={3} py={4} pb="calc(90px + env(safe-area-inset-bottom))" sx={{ overscrollBehavior: 'contain' }}>
          <Text fontSize="xs" fontWeight={800} textTransform="uppercase" letterSpacing="0.06em" color="ink.400" px={3} mb={1.5}>
            Navigation
          </Text>
          <VStack align="stretch" spacing={1}>
            {navLinks.map((l) => {
              const active = pathname === l.href;
              return (
                <HStack
                  key={l.href}
                  as={NextLink}
                  href={l.href}
                  onClick={navDrawer.onClose}
                  px={3}
                  py={2.5}
                  borderRadius="xl"
                  bg={active ? 'pine.50' : 'transparent'}
                  color={active ? 'pine.800' : 'ink.800'}
                  fontWeight={active ? 700 : 500}
                  fontSize="sm"
                  justify="space-between"
                  transition="background .15s"
                  _hover={{ bg: 'ink.50' }}
                >
                  <HStack spacing={3}>
                    <Icon name={l.icon} size={18} color={active ? '#1B7F5A' : '#4B5C53'} />
                    <Text>{l.label}</Text>
                  </HStack>
                  <Icon name="right" size={13} color="ink.300" />
                </HStack>
              );
            })}
            <HStack
              as={NextLink}
              href="/wishlist"
              onClick={navDrawer.onClose}
              px={3}
              py={2.5}
              borderRadius="xl"
              bg={pathname === '/wishlist' ? 'pine.50' : 'transparent'}
              color={pathname === '/wishlist' ? 'pine.800' : 'ink.800'}
              fontWeight={pathname === '/wishlist' ? 700 : 500}
              fontSize="sm"
              justify="space-between"
              _hover={{ bg: 'ink.50' }}
            >
              <HStack spacing={3}>
                <Icon name="heart" size={18} color={pathname === '/wishlist' ? '#E5503F' : '#4B5C53'} />
                <Text>Wishlist</Text>
              </HStack>
              {wl.count > 0 ? (
                <Badge bg="coral.500" color="white" borderRadius="full" px={2} py={0.5} fontSize="xs">
                  {wl.count}
                </Badge>
              ) : (
                <Icon name="right" size={13} color="ink.300" />
              )}
            </HStack>
            <HStack
              as={NextLink}
              href={isAuthed ? '/account' : '/login'}
              onClick={navDrawer.onClose}
              px={3}
              py={2.5}
              borderRadius="xl"
              bg={pathname?.startsWith('/account') || pathname === '/login' ? 'pine.50' : 'transparent'}
              color={pathname?.startsWith('/account') || pathname === '/login' ? 'pine.800' : 'ink.800'}
              fontWeight={pathname?.startsWith('/account') || pathname === '/login' ? 700 : 500}
              fontSize="sm"
              justify="space-between"
              _hover={{ bg: 'ink.50' }}
            >
              <HStack spacing={3}>
                <Icon name="user" size={18} color={isAuthed ? '#1B7F5A' : '#4B5C53'} />
                <Text noOfLines={1}>{isAuthed ? `Hi, ${user?.first_name || 'Account'}` : 'Sign in / Register'}</Text>
              </HStack>
              <Icon name="right" size={13} color="ink.300" />
            </HStack>
          </VStack>

          <Flex align="center" justify="space-between" px={3} mt={6} mb={2}>
            <Text fontSize="xs" fontWeight={800} textTransform="uppercase" letterSpacing="0.06em" color="ink.400">
              Categories
            </Text>
            <Text as={NextLink} href="/shop" onClick={navDrawer.onClose} fontSize="xs" fontWeight={700} color="pine.600">
              View all ({categories.length})
            </Text>
          </Flex>

          <VStack align="stretch" spacing={1}>
            {categories.map((c) => {
              const active = pathname === `/category/${c.slug}`;
              return (
                <HStack
                  key={c._id || c.slug}
                  as={NextLink}
                  href={`/category/${c.slug}`}
                  onClick={navDrawer.onClose}
                  px={2.5}
                  py={2}
                  borderRadius="xl"
                  bg={active ? 'pine.50' : 'transparent'}
                  border="1px solid"
                  borderColor={active ? 'pine.200' : 'transparent'}
                  color={active ? 'pine.800' : 'ink.800'}
                  justify="space-between"
                  transition="all .12s ease"
                  _hover={{ bg: active ? 'pine.100' : 'ink.50' }}
                  _active={{ bg: 'ink.100' }}
                >
                  <HStack spacing={2.5} minW={0} flex={1}>
                    <Box
                      w="32px"
                      h="32px"
                      minW="32px"
                      borderRadius="lg"
                      bg={active ? 'white' : 'ink.100'}
                      boxShadow={active ? 'soft' : 'none'}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      fontSize="15px"
                      aria-hidden="true"
                    >
                      {c.emoji || '💊'}
                    </Box>
                    <Text fontSize="sm" fontWeight={active ? 700 : 500} noOfLines={1}>
                      {c.name}
                    </Text>
                  </HStack>
                  <Icon name="right" size={12} color={active ? '#1B7F5A' : '#8A9C92'} />
                </HStack>
              );
            })}
          </VStack>

          <Box mt={6} pt={4} borderTop="1px solid" borderColor="ink.100">
            <Button
              as="a"
              href={wa('Hello 👋 I’d like to order some medicines.')}
              target="_blank"
              rel="noopener noreferrer"
              variant="wa"
              w="full"
              h="44px"
              leftIcon={<WhatsAppIcon size={18} />}
            >
              Order on WhatsApp
            </Button>
          </Box>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
