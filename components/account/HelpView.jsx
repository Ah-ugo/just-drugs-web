'use client';
import NextLink from 'next/link';
import { Accordion, AccordionButton, AccordionIcon, AccordionItem, AccordionPanel, Box, Button, Heading, HStack, Text } from '@chakra-ui/react';
import WhatsAppIcon from '@/components/ui/WhatsAppIcon';
import { Page } from '@/components/ui/Layout';
import { useStore } from '@/context/StoreContext';
import { money } from '@/lib/format';

export default function HelpView() {
  const { wa, freeThreshold, deliveryFee, taxName, taxRate } = useStore();
  const faqs = [
    ['How do I order?', 'Add medicines to your cart and check out with Paystack, or tap “Order on WhatsApp” to send your list to our pharmacist and finish the order there.'],
    ['Do I need a prescription?', 'Some medicines are prescription-only and are marked “Prescription required”. Upload a photo or PDF of your prescription, or send it on WhatsApp. A pharmacist reviews it before those items are released.'],
    ['How much is delivery?', `Delivery is ${money(deliveryFee)} on smaller orders and free from ${money(freeThreshold)}. ${taxName} (${taxRate}%) is added at checkout.`],
    ['How can I pay?', 'Checkout is handled by Paystack, which supports cards, bank transfer and USSD.'],
    ['How do I track my order?', 'Use the Track order page with your order number and phone number, or open the order from your account.'],
    ['Can I get an invoice?', 'Yes. Every paid order has an invoice you can print, save as PDF, or share on WhatsApp. From your cart you can also get a proforma invoice before paying.'],
    ['Can I share a medicine with someone?', 'Every medicine page has a Share button for WhatsApp, Telegram, Facebook, email or a copyable link.'],
  ];
  return (
    <Page py={{ base: 6, md: 12 }} maxW="820px">
      <Heading as="h1" fontSize={{ base: '3xl', md: '5xl' }} mb={6}>Help & FAQs</Heading>
      <Accordion allowToggle bg="white" borderRadius="2xl" border="1px solid" borderColor="ink.100" overflow="hidden">
        {faqs.map(([q, a]) => (
          <AccordionItem key={q} borderColor="ink.100" _last={{ borderBottomWidth: 0 }}>
            <AccordionButton px={5} fontFamily="heading" fontSize="lg"><Box flex={1} textAlign="left">{q}</Box><AccordionIcon /></AccordionButton>
            <AccordionPanel px={5} pb={5} color="ink.700">{a}</AccordionPanel>
          </AccordionItem>
        ))}
      </Accordion>
      <Box mt={8} p={6} bg="pine.800" color="white" borderRadius="2xl">
        <Text fontFamily="heading" fontWeight={800} fontSize="xl">Still need help?</Text>
        <Text color="pine.100" mt={1} mb={4}>A pharmacist is a message away.</Text>
        <HStack spacing={3} flexWrap="wrap">
          <Button as="a" href={wa('Hello 👋 I need help.')} target="_blank" rel="noopener noreferrer" variant="wa" leftIcon={<WhatsAppIcon size={20} />}>Chat on WhatsApp</Button>
          <Button as={NextLink} href="/track" variant="buy">Track an order</Button>
        </HStack>
      </Box>
    </Page>
  );
}
