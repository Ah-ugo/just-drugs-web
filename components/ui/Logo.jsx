'use client';
import NextLink from 'next/link';
import { HStack, Text } from '@chakra-ui/react';

export function LogoMark({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <rect width="40" height="40" rx="12" fill="#0A3D2C" />
      <g transform="rotate(-40 20 20)">
        <rect x="7" y="14" width="26" height="12" rx="6" fill="#fff" />
        <path d="M20 14h7a6 6 0 0 1 0 12h-7z" fill="#FFC21F" />
      </g>
    </svg>
  );
}

export default function Logo({ name = 'Just Drugs', light = false, size = 36 }) {
  return (
    <HStack as={NextLink} href="/" spacing={2.5} aria-label={`${name} home`} _hover={{ textDecoration: 'none' }}>
      <LogoMark size={size} />
      <Text fontFamily="heading" fontWeight={800} fontSize={{ base: 'xl', md: '2xl' }} letterSpacing="-0.04em"
        color={light ? 'white' : 'pine.900'} lineHeight={1}>
        {name}
      </Text>
    </HStack>
  );
}
