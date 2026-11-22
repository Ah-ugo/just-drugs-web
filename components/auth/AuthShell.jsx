'use client';
import { Box, Flex, Heading, Text, VStack } from '@chakra-ui/react';
import Logo from '@/components/ui/Logo';
import DrugArt from '@/components/ui/DrugArt';
import { Page } from '@/components/ui/Layout';
import { useStore } from '@/context/StoreContext';

export default function AuthShell({ title, subtitle, children }) {
  const { storeName } = useStore();
  return (
    <Page py={{ base: 6, md: 14 }}>
      <Flex maxW="980px" mx="auto" bg="white" border="1px solid" borderColor="ink.100" borderRadius="3xl" overflow="hidden" boxShadow="soft">
        <Box display={{ base: 'none', md: 'flex' }} flex="0 0 42%" bg="linear-gradient(160deg,#FFE082,#FFC21F)" p={10} flexDirection="column" justifyContent="space-between" position="relative">
          <Logo name={storeName} />
          <Box h="260px" mx="auto" w="260px"><DrugArt kind="bottle" /></Box>
          <Text fontFamily="heading" fontWeight={800} fontSize="2xl" color="pine.900" lineHeight={1.15}>Save addresses, reorder in one tap, and track every delivery.</Text>
        </Box>
        <VStack flex={1} align="stretch" spacing={6} p={{ base: 6, md: 12 }}>
          <Box><Heading as="h1" fontSize={{ base: '3xl', md: '4xl' }}>{title}</Heading>{subtitle && <Text color="ink.600" mt={2}>{subtitle}</Text>}</Box>
          {children}
        </VStack>
      </Flex>
    </Page>
  );
}

export const safeNext = (n) => (n && n.startsWith('/') && !n.startsWith('//') ? n : '/account');
