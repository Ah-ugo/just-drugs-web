'use client';
import NextLink from 'next/link';
import { Box, Grid, HStack, Stack, Text, VStack } from '@chakra-ui/react';
import Logo from '@/components/ui/Logo';
import Icon from '@/components/ui/Icon';
import WhatsAppIcon from '@/components/ui/WhatsAppIcon';
import { Page } from '@/components/ui/Layout';
import { useStore } from '@/context/StoreContext';

const FLink = ({ href, children, ...r }) => <Text as={NextLink} href={href} color="pine.100" _hover={{ color: 'gold.300' }} {...r}>{children}</Text>;
const Col = ({ title, children }) => (
  <VStack align="start" spacing={2.5}>
    <Text fontFamily="heading" fontWeight={800} color="white" fontSize="lg">{title}</Text>
    {children}
  </VStack>
);

export default function Footer() {
  const { storeName, categories, wa, phone, email, address, freeThreshold } = useStore();
  return (
    <Box as="footer" className="no-print" bg="pine.900" color="pine.100" mt={{ base: 14, md: 20 }} pt={{ base: 12, md: 16 }} pb={{ base: 28, md: 8 }}>
      <Page>
        <Grid templateColumns={{ base: '1fr', md: '1.4fr 1fr 1fr 1.2fr' }} gap={{ base: 9, md: 10 }}>
          <VStack align="start" spacing={4}>
            <Logo name={storeName} light />
            <Text maxW="320px">Order medicines and health essentials online or on WhatsApp, pay securely, and track your delivery.</Text>
            <HStack spacing={2} color="gold.300"><Icon name="truck" size={18} /><Text fontSize="sm">Free delivery over ₦{Number(freeThreshold).toLocaleString('en-NG')}</Text></HStack>
          </VStack>
          <Col title="Shop">
            <FLink href="/shop">All medicines</FLink>
            {categories.slice(0, 6).map((c) => <FLink key={c._id} href={`/category/${c.slug}`}>{c.name}</FLink>)}
          </Col>
          <Col title="Help">
            <FLink href="/prescriptions">Upload a prescription</FLink>
            <FLink href="/track">Track an order</FLink>
            <FLink href="/wishlist">Wishlist</FLink>
            <FLink href="/help">FAQs</FLink>
            <FLink href="/admin/login">Staff / Admin sign in</FLink>
          </Col>
          <Col title="Talk to us">
            <Text as="a" href={wa('Hello 👋')} target="_blank" rel="noopener noreferrer" display="inline-flex" alignItems="center" gap={2} color="wa.500" fontWeight={700}><WhatsAppIcon size={20} /> Chat on WhatsApp</Text>
            {phone && <Text as="a" href={`tel:${phone}`} display="inline-flex" alignItems="center" gap={2}><Icon name="call" size={18} />{phone}</Text>}
            {email && <Text as="a" href={`mailto:${email}`} display="inline-flex" alignItems="center" gap={2}><Icon name="mail" size={18} />{email}</Text>}
            {address && <Text display="flex" gap={2}><Icon name="pin" size={18} />{address}</Text>}
          </Col>
        </Grid>
        <Stack mt={12} pt={6} borderTop="1px solid" borderColor="whiteAlpha.200" fontSize="sm" color="pine.200" spacing={2}>
          <Text>Always read the label and follow your pharmacist’s or doctor’s advice. Prescription-only medicines need a valid prescription.</Text>
          <Text>© {new Date().getFullYear()} {storeName}. All rights reserved.</Text>
        </Stack>
      </Page>
    </Box>
  );
}
