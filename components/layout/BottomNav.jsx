'use client';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { Box, Flex, Text } from '@chakra-ui/react';
import Icon from '@/components/ui/Icon';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useStore } from '@/context/StoreContext';

export default function BottomNav() {
  const path = usePathname() || '';
  const { count } = useCart();
  const { isAuthed } = useAuth();
  const { navDrawer } = useStore();

  const items = [
    { href: '/', label: 'Home', icon: 'home', match: (p) => p === '/' },
    {
      href: '/shop',
      label: 'Categories',
      icon: 'category',
      match: (p) => p.startsWith('/category') || p.startsWith('/shop'),
      onClick: (e) => {
        e?.preventDefault();
        navDrawer?.onOpen();
      },
    },
    { href: '/prescriptions', label: 'Rx', icon: 'upload', match: (p) => p.startsWith('/prescriptions') },
    { href: '/cart', label: 'Cart', icon: 'cart', match: (p) => p.startsWith('/cart') || p.startsWith('/checkout'), badge: count },
    { href: isAuthed ? '/account' : '/login', label: isAuthed ? 'Account' : 'Sign in', icon: 'user', match: (p) => p.startsWith('/account') || p === '/login' },
  ];

  return (
    <Box
      as="nav"
      aria-label="Main"
      className="no-print"
      display={{ base: 'block', md: 'none' }}
      position="fixed"
      bottom={0}
      left={0}
      right={0}
      zIndex={45}
      bg="white"
      boxShadow="bar"
      pb="env(safe-area-inset-bottom)"
    >
      <Flex>
        {items.map((it) => {
          const active = it.match(path);
          const isButton = !!it.onClick;
          const Component = isButton ? Box : NextLink;
          return (
            <Flex
              key={it.label}
              as={Component}
              href={isButton ? undefined : it.href}
              onClick={it.onClick}
              cursor="pointer"
              flex={1}
              direction="column"
              align="center"
              justify="center"
              py={2}
              gap={0.5}
              color={active ? 'pine.700' : 'ink.500'}
              position="relative"
              aria-current={active ? 'page' : undefined}
            >
              <Box
                position="relative"
                px={3}
                py={0.5}
                borderRadius="full"
                bg={active ? 'gold.300' : 'transparent'}
                transition="background .2s"
              >
                <Icon name={it.icon} size={22} variant={active ? 'Bold' : 'Linear'} />
                {it.badge > 0 && (
                  <Box
                    position="absolute"
                    top="-4px"
                    right="2px"
                    bg="coral.500"
                    color="white"
                    borderRadius="full"
                    minW="17px"
                    h="17px"
                    fontSize="10px"
                    fontWeight={800}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    {it.badge > 99 ? '99+' : it.badge}
                  </Box>
                )}
              </Box>
              <Text fontSize="11px" fontWeight={active ? 800 : 600}>
                {it.label}
              </Text>
            </Flex>
          );
        })}
      </Flex>
    </Box>
  );
}
