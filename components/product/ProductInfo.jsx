'use client';
import { Accordion, AccordionButton, AccordionIcon, AccordionItem, AccordionPanel, Box, Grid, ListItem, Text, UnorderedList } from '@chakra-ui/react';

function List({ items }) {
  return <UnorderedList spacing={1.5} ml={5} color="ink.700">{items.map((x, i) => <ListItem key={i}>{x}</ListItem>)}</UnorderedList>;
}

export default function ProductInfo({ product: p }) {
  const sections = [
    p.description && { title: 'About this medicine', body: <Text color="ink.700" whiteSpace="pre-line">{p.description}</Text> },
    p.uses?.length && { title: 'What it’s used for', body: <List items={p.uses} /> },
    p.warnings?.length && { title: 'Warnings & precautions', body: <List items={p.warnings} /> },
    p.side_effects?.length && { title: 'Possible side effects', body: <List items={p.side_effects} /> },
    p.ingredients?.length && { title: 'Ingredients', body: <List items={p.ingredients} /> },
  ].filter(Boolean);

  const facts = [
    ['Brand', p.brand_name], ['Generic name', p.generic_name], ['Strength', p.strength && p.strength !== 'Standard' ? p.strength : null],
    ['Form', p.dosage_form], ['Manufacturer', p.manufacturer], ['Category', p.category_name], ['SKU', p.sku],
  ].filter(([, v]) => v);

  return (
    <Box>
      <Accordion allowMultiple defaultIndex={[0]} bg="white" borderRadius="2xl" border="1px solid" borderColor="ink.100" overflow="hidden">
        {sections.map((s) => (
          <AccordionItem key={s.title} borderColor="ink.100" _last={{ borderBottomWidth: 0 }}>
            <AccordionButton px={5} fontFamily="heading" fontSize="lg"><Box flex={1} textAlign="left">{s.title}</Box><AccordionIcon /></AccordionButton>
            <AccordionPanel px={5} pb={5}>{s.body}</AccordionPanel>
          </AccordionItem>
        ))}
      </Accordion>
      {facts.length > 0 && (
        <Grid templateColumns={{ base: '1fr 1fr', md: 'repeat(4, 1fr)' }} gap={3} mt={5}>
          {facts.map(([k, v]) => (
            <Box key={k} bg="white" border="1px solid" borderColor="ink.100" borderRadius="xl" p={3.5}>
              <Text fontSize="xs" color="ink.500" fontWeight={600}>{k}</Text>
              <Text fontWeight={700} noOfLines={2}>{v}</Text>
            </Box>
          ))}
        </Grid>
      )}
      <Text mt={5} fontSize="sm" color="ink.500">This information is for guidance only and doesn’t replace advice from your doctor or pharmacist. Always read the label before use.</Text>
    </Box>
  );
}
