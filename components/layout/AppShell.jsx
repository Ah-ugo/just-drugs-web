'use client';
import { usePathname } from 'next/navigation';
import { Box } from '@chakra-ui/react';
import Header from './Header';
import Footer from './Footer';
import BottomNav from './BottomNav';
import CartDrawer from './CartDrawer';
import WhatsAppFab from './WhatsAppFab';

export default function AppShell({ children }) {
  const path = usePathname() || '';
  if (path.startsWith('/admin')) return <>{children}</>;
  return (
    <Box minH="100vh" display="flex" flexDirection="column">
      <Header />
      <Box as="main" id="main" flex={1}>{children}</Box>
      <Footer />
      <BottomNav />
      <CartDrawer />
      <WhatsAppFab />
    </Box>
  );
}
