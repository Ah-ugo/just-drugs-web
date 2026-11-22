'use client';
import NextLink from 'next/link';
import { Badge, Box, Center, Container, Flex, Heading, HStack, Skeleton, Text, VStack } from '@chakra-ui/react';
import Icon from './Icon';
import { statusInfo, RX_STATUS } from '@/lib/format';

export const Page = (props) => <Container maxW="1240px" px={{ base: 4, md: 6 }} {...props} />;

export function SectionHeading({ title, subtitle, href, linkLabel = 'See all', ...rest }) {
  return (
    <Flex align="end" justify="space-between" gap={4} mb={{ base: 4, md: 6 }} {...rest}>
      <Box>
        <Heading as="h2" fontSize={{ base: '2xl', md: '3xl' }}>{title}</Heading>
        {subtitle && <Text color="ink.500" mt={1}>{subtitle}</Text>}
      </Box>
      {href && (
        <HStack as={NextLink} href={href} color="pine.600" fontWeight={700} flexShrink={0} spacing={1} _hover={{ color: 'pine.800' }}>
          <Text>{linkLabel}</Text><Icon name="right" size={18} />
        </HStack>
      )}
    </Flex>
  );
}

export function EmptyState({ icon = 'box', title, text, children, ...rest }) {
  return (
    <Center py={{ base: 12, md: 20 }} px={4} {...rest}>
      <VStack spacing={4} maxW="420px" textAlign="center">
        <Center w="84px" h="84px" borderRadius="full" bg="pine.50" color="pine.600"><Icon name={icon} size={38} /></Center>
        <Heading as="h2" fontSize="2xl">{title}</Heading>
        {text && <Text color="ink.600">{text}</Text>}
        {children}
      </VStack>
    </Center>
  );
}

export const OrderStatusBadge = ({ status }) => {
  const s = statusInfo(status);
  return <Badge colorScheme={s.color} variant="subtle">{s.label}</Badge>;
};

export const RxStatusBadge = ({ status }) => {
  const s = RX_STATUS[status] || { label: status, color: 'gray' };
  return <Badge colorScheme={s.color} variant="subtle">{s.label}</Badge>;
};

export function ProductSkeletons({ count = 8 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Box key={i} bg="white" borderRadius="2xl" overflow="hidden" border="1px solid" borderColor="ink.100">
          <Skeleton sx={{ aspectRatio: '1 / 1' }} />
          <Box p={3.5}><Skeleton h="12px" w="40%" mb={2} /><Skeleton h="16px" mb={2} /><Skeleton h="20px" w="55%" mb={3} /><Skeleton h="40px" borderRadius="full" /></Box>
        </Box>
      ))}
    </>
  );
}
