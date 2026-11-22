'use client';
import NextLink from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Box, Center, Drawer, DrawerBody, DrawerContent, DrawerOverlay, Flex, HStack, IconButton, Spinner, Text, VStack, useDisclosure } from '@chakra-ui/react';
import Icon from '@/components/ui/Icon';
import Logo from '@/components/ui/Logo';
import { useAdmin } from '@/context/AdminContext';
import { adminApi } from '@/lib/api';
import { ROLE_LABELS } from '@/lib/rbac';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: 'home', exact: true },
  { href: '/admin/prescriptions', label: 'Prescriptions', icon: 'doc', perm: 'prescription:review', badge: 'rx' },
  { href: '/admin/orders', label: 'Orders', icon: 'box', perm: 'orders:read', badge: 'orders' },
  { href: '/admin/products', label: 'Products', icon: 'shop', perm: 'products:read' },
  { href: '/admin/inventory', label: 'Inventory', icon: 'stock', perm: 'inventory:read' },
  { href: '/admin/catalogue', label: 'Categories & brands', icon: 'category', perm: 'categories:update' },
  { href: '/admin/coupons', label: 'Coupons', icon: 'gift', perm: 'discounts:read' },
  { href: '/admin/banners', label: 'Banners', icon: 'image', perm: 'banners:read' },
  { href: '/admin/delivery', label: 'Delivery zones', icon: 'truck', perm: 'delivery:read' },
  { href: '/admin/settings', label: 'Settings', icon: 'settings', perm: 'settings:read' },
  { href: '/admin/team', label: 'Team', icon: 'people', role: 'super_admin' },
];

function useBadges(can, adminId) {
  const [b, setB] = useState({});
  useEffect(() => {
    let alive = true;
    const load = async () => {
      const next = {};
      try { if (can('prescription:review')) next.rx = ((await adminApi.get('/prescriptions/pharmacist/queue', { status: 'pending' })).data || []).length; } catch {}
      try { if (can('orders:read')) next.orders = ((await adminApi.get('/orders', { status: 'preparing', payment_status: 'paid' })).data || []).length; } catch {}
      if (alive) setB(next);
    };
    load();
    const t = setInterval(load, 60000);
    return () => { alive = false; clearInterval(t); };
  }, [adminId]); // eslint-disable-line react-hooks/exhaustive-deps
  return b;
}

function NavList({ items, path, badges, onNavigate }) {
  return (
    <VStack align="stretch" spacing={0.5} onClick={onNavigate}>
      {items.map((it) => {
        const active = it.exact ? path === it.href : path.startsWith(it.href);
        const n = it.badge ? badges[it.badge] : 0;
        return (
          <HStack key={it.href} as={NextLink} href={it.href} spacing={3} px={3} h="42px" borderRadius="xl" position="relative" aria-current={active ? 'page' : undefined}
            bg={active ? 'whiteAlpha.200' : 'transparent'} color={active ? 'white' : 'pine.100'} fontWeight={active ? 800 : 600}
            _hover={{ bg: 'whiteAlpha.150', color: 'white', textDecoration: 'none' }}>
            {active && <Box position="absolute" left="-12px" top="9px" bottom="9px" w="4px" borderRadius="full" bg="gold.400" />}
            <Icon name={it.icon} size={20} variant={active ? 'Bold' : 'Linear'} />
            <Text flex={1} fontSize="sm">{it.label}</Text>
            {n > 0 && <Box bg="gold.400" color="pine.900" borderRadius="full" minW="22px" h="22px" px={1.5} fontSize="xs" fontWeight={800} display="flex" alignItems="center" justifyContent="center">{n}</Box>}
          </HStack>
        );
      })}
    </VStack>
  );
}

export default function AdminShell({ children }) {
  const path = usePathname() || '';
  const router = useRouter();
  const { admin, status, can, isRole, logout } = useAdmin();
  const menu = useDisclosure();
  const isLogin = path === '/admin/login';
  const badges = useBadges(can, admin?.id);

  useEffect(() => { if (!isLogin && status === 'guest') router.replace(`/admin/login?next=${encodeURIComponent(path)}`); }, [isLogin, status, path, router]);
  useEffect(() => { menu.onClose(); }, [path]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLogin) return children;
  if (status !== 'authed') return <Center minH="100vh"><Spinner size="lg" color="pine.500" thickness="3px" /></Center>;

  const items = NAV.filter((n) => (n.perm ? can(n.perm) : true) && (n.role ? isRole(n.role) : true));
  const side = (
    <Flex direction="column" h="100%" py={5} px={3}>
      <Box px={2} mb={6}><Logo light name="Just Drugs" size={34} /><Text mt={1.5} fontSize="xs" fontWeight={800} letterSpacing="0.12em" color="gold.300">ADMIN</Text></Box>
      <Box flex={1} overflowY="auto"><NavList items={items} path={path} badges={badges} onNavigate={menu.onClose} /></Box>
      <Box mt={4} pt={4} borderTop="1px solid" borderColor="whiteAlpha.200">
        <Box px={2} mb={3}><Text color="white" fontWeight={700} fontSize="sm" noOfLines={1}>{admin.email}</Text><Text color="pine.200" fontSize="xs">{ROLE_LABELS[admin.role] || admin.role}</Text></Box>
        <HStack spacing={2}>
          <IconButton as="a" href="/" target="_blank" aria-label="View store" icon={<Icon name="external" size={18} />} size="sm" variant="ghost" color="pine.100" _hover={{ bg: 'whiteAlpha.200' }} />
          <IconButton aria-label="Sign out" icon={<Icon name="logout" size={18} />} size="sm" variant="ghost" color="pine.100" _hover={{ bg: 'whiteAlpha.200' }} onClick={async () => { await logout(); router.replace('/admin/login'); }} />
        </HStack>
      </Box>
    </Flex>
  );

  return (
    <Box minH="100vh" bg="mist">
      <Box display={{ base: 'none', lg: 'block' }} position="fixed" left={0} top={0} bottom={0} w="248px" bg="pine.900">{side}</Box>
      <Flex display={{ base: 'flex', lg: 'none' }} position="sticky" top={0} zIndex={30} h="56px" px={3} align="center" gap={2} bg="pine.900">
        <IconButton aria-label="Open menu" icon={<Icon name="menu" size={24} />} variant="ghost" color="white" _hover={{ bg: 'whiteAlpha.200' }} onClick={menu.onOpen} />
        <Logo light name="Just Drugs" size={28} />
        <Text ml="auto" color="gold.300" fontSize="xs" fontWeight={800} letterSpacing="0.12em">ADMIN</Text>
      </Flex>
      <Drawer isOpen={menu.isOpen} placement="left" onClose={menu.onClose}>
        <DrawerOverlay />
        <DrawerContent bg="pine.900" maxW="280px"><DrawerBody p={0}>{side}</DrawerBody></DrawerContent>
      </Drawer>
      <Box ml={{ lg: '248px' }} p={{ base: 4, md: 8 }} pb={{ base: 10, md: 12 }}>{children}</Box>
    </Box>
  );
}
