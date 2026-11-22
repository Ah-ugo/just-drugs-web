'use client';
import { Suspense } from 'react';
import { CacheProvider } from '@chakra-ui/next-js';
import { ChakraProvider } from '@chakra-ui/react';
import theme from '@/theme';
import { StoreProvider } from '@/context/StoreContext';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import InstantNavigation from '@/components/ui/InstantNavigation';

export default function Providers({ settings, categories, children }) {
  return (
    <CacheProvider>
      <ChakraProvider theme={theme}>
        <Suspense fallback={null}>
          <InstantNavigation />
        </Suspense>
        <StoreProvider settings={settings} categories={categories}>
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>{children}</WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </StoreProvider>
      </ChakraProvider>
    </CacheProvider>
  );
}
