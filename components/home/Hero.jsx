'use client';
import NextLink from 'next/link';
import { useEffect, useState } from 'react';
import { Box, Button, Flex, Heading, HStack, IconButton, Text, VStack, Wrap, WrapItem } from '@chakra-ui/react';
import Icon from '@/components/ui/Icon';
import WhatsAppIcon from '@/components/ui/WhatsAppIcon';
import DrugArt from '@/components/ui/DrugArt';
import AdCard from '@/components/ui/AdCard';
import SearchBox from '@/components/layout/SearchBox';
import { Page } from '@/components/ui/Layout';
import { useStore } from '@/context/StoreContext';

function Carousel({ ads }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = ads.length;
  useEffect(() => {
    if (n < 2 || paused) return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    const t = setInterval(() => setI((x) => (x + 1) % n), 6000);
    return () => clearInterval(t);
  }, [n, paused]);

  return (
    <Box position="relative" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}
      role="region" aria-roledescription="carousel" aria-label="Offers">
      <AdCard key={i} ad={ads[i]} minH={{ base: '230px', lg: '420px' }} priority />
      {n > 1 && (
        <>
          <HStack position="absolute" bottom={4} left={0} right={0} justify="center" spacing={2}>
            {ads.map((_, k) => (
              <Box as="button" key={k} onClick={() => setI(k)} aria-label={`Show offer ${k + 1}`} aria-current={k === i}
                h="8px" w={k === i ? '26px' : '8px'} borderRadius="full" bg={k === i ? 'gold.400' : 'whiteAlpha.700'} transition="width .25s" />
            ))}
          </HStack>
          <IconButton aria-label="Previous offer" icon={<Icon name="left" size={20} color="#072B1F" />} onClick={() => setI((i - 1 + n) % n)} position="absolute" left={3} top="50%" transform="translateY(-50%)"
            borderRadius="full" size="sm" variant="unstyled" bg="white" boxShadow="0 2px 8px rgba(0,0,0,.18)" zIndex={2} display="inline-flex" alignItems="center" justifyContent="center" w="32px" h="32px" minW="32px"
            _hover={{ bg: 'white', transform: 'translateY(-50%) scale(1.1)' }} _active={{ bg: 'gray.50' }} />
          <IconButton aria-label="Next offer" icon={<Icon name="right" size={20} color="#072B1F" />} onClick={() => setI((i + 1) % n)} position="absolute" right={3} top="50%" transform="translateY(-50%)"
            borderRadius="full" size="sm" variant="unstyled" bg="white" boxShadow="0 2px 8px rgba(0,0,0,.18)" zIndex={2} display="inline-flex" alignItems="center" justifyContent="center" w="32px" h="32px" minW="32px"
            _hover={{ bg: 'white', transform: 'translateY(-50%) scale(1.1)' }} _active={{ bg: 'gray.50' }} />
        </>
      )}
    </Box>
  );
}

function HeroArt() {
  return (
    <Box position="relative" h={{ base: '240px', lg: '420px' }} borderRadius="3xl" bg="linear-gradient(145deg,#FFE082 0%,#FFC21F 100%)" overflow="hidden">
      <Box position="absolute" w="70%" h="70%" borderRadius="full" bg="whiteAlpha.500" top="-14%" right="-12%" />
      <Box position="absolute" left="2%" bottom="4%" w="46%" h="78%"><DrugArt kind="syrup" /></Box>
      <Box position="absolute" left="30%" bottom="0" w="52%" h="92%" zIndex={1}><DrugArt kind="bottle" /></Box>
      <Box position="absolute" right="0%" bottom="6%" w="44%" h="60%"><DrugArt kind="blister" /></Box>
    </Box>
  );
}

export default function Hero({ ads = [], categories = [] }) {
  const { wa } = useStore();
  return (
    <Box bg="white" borderBottom="1px solid" borderColor="ink.100">
      <Page py={{ base: 6, md: 10 }}>
        <Flex direction={{ base: 'column', lg: 'row' }} gap={{ base: 6, lg: 12 }} align={{ lg: 'center' }}>
          <VStack align="stretch" spacing={{ base: 5, md: 6 }} flex={{ lg: '0 0 46%' }}>
            <Heading as="h1" fontSize={{ base: '4xl', md: '6xl' }} lineHeight={1.02}>
              Order medicines online, or in one WhatsApp message.
            </Heading>
            <Text fontSize={{ base: 'md', md: 'lg' }} color="ink.600" maxW="520px">
              Upload your prescription, pay securely with Paystack, and track your delivery to your door anywhere in Nigeria.
            </Text>
            <Box maxW="560px"><SearchBox placeholder="Search e.g. paracetamol, malaria, vitamin C" /></Box>
            <Wrap spacing={2}>
              {categories.slice(0, 6).map((c) => (
                <WrapItem key={c._id}>
                  <Button as={NextLink} href={`/category/${c.slug}`} size="sm" variant="soft" fontWeight={600}>
                    {c.emoji && <Text as="span" mr={1.5} aria-hidden="true">{c.emoji}</Text>}{c.name}
                  </Button>
                </WrapItem>
              ))}
            </Wrap>
            <HStack spacing={3} flexWrap="wrap">
              <Button as={NextLink} href="/shop" variant="buy" size="lg" rightIcon={<Icon name="right" size={18} />}>Shop medicines</Button>
              <Button as="a" href={wa('Hello 👋 I’d like to order some medicines.')} target="_blank" rel="noopener noreferrer" variant="wa" size="lg" leftIcon={<WhatsAppIcon size={22} />}>Order on WhatsApp</Button>
            </HStack>
          </VStack>
          <Box flex={1} minW={0}>{ads.length ? <Carousel ads={ads} /> : <HeroArt />}</Box>
        </Flex>
      </Page>
    </Box>
  );
}
