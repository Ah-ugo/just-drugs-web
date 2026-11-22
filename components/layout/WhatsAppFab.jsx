'use client';
import { usePathname } from 'next/navigation';
import { Box, Text } from '@chakra-ui/react';
import WhatsAppIcon from '@/components/ui/WhatsAppIcon';
import { useStore } from '@/context/StoreContext';

export default function WhatsAppFab() {
  const { wa, storeName } = useStore();
  const path = usePathname() || '';
  const onProduct = path.startsWith('/drugs/');
  return (
    <Box as="a" className="no-print" href={wa(`Hello ${storeName} 👋 I need help from a pharmacist.`)} target="_blank" rel="noopener noreferrer"
      aria-label="Chat with a pharmacist on WhatsApp" position="fixed" right={{ base: 3, md: 6 }} bottom={{ base: '84px', md: 6 }} zIndex={44}
      display={{ base: onProduct ? 'none' : 'flex', md: 'flex' }} alignItems="center" gap={2} bg="wa.500" color="pine.900" h="52px" px={{ base: '14px', md: 5 }} borderRadius="full" fontWeight={800}
      boxShadow="0 12px 28px -10px rgba(18,140,74,.8)" _hover={{ bg: 'wa.400', textDecoration: 'none' }}>
      <WhatsAppIcon size={24} />
      <Text display={{ base: 'none', md: 'block' }}>Chat with a pharmacist</Text>
    </Box>
  );
}
