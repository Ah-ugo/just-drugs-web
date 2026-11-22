'use client';
import NextLink from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Center,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Text,
  VStack,
} from '@chakra-ui/react';
import Logo from '@/components/ui/Logo';
import Icon from '@/components/ui/Icon';
import { useAdmin } from '@/context/AdminContext';

export default function AdminLogin() {
  const { login, status } = useAdmin();
  const router = useRouter();
  const next = useSearchParams().get('next');
  const dest = next && next.startsWith('/admin') ? next : '/admin';
  const [f, setF] = useState({ email: '', password: '' });
  const [show, setShow] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (status === 'authed') router.replace(dest);
  }, [status, dest, router]);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    if (!f.email || !f.password) return setErr('Enter your staff email and password.');
    setBusy(true);
    try {
      await login(f.email, f.password);
      router.replace(dest);
    } catch (e2) {
      setErr(
        e2.status === 429
          ? 'Too many attempts. Wait a minute and try again.'
          : e2.message || 'Invalid email or password.'
      );
      setBusy(false);
    }
  };

  return (
    <Center minH="100vh" px={4} bg="pine.900">
      <Box w="100%" maxW="440px" bg="white" borderRadius="3xl" p={{ base: 6, md: 9 }} boxShadow="lift">
        <VStack align="stretch" spacing={6} as="form" onSubmit={submit} noValidate>
          <Box>
            <Logo name="Just Drugs" />
            <Text mt={4} fontSize="xs" fontWeight={800} letterSpacing="0.12em" color="gold.600">
              STAFF & PHARMACIST PORTAL
            </Text>
            <Heading as="h1" fontSize="3xl" mt={1}>
              Staff sign in
            </Heading>
            <Text color="ink.600" mt={1} fontSize="sm">
              Sign in with your staff account to review prescriptions, manage inventory, and process orders.
            </Text>
          </Box>

          <FormControl isRequired>
            <FormLabel fontWeight={700}>Staff Email</FormLabel>
            <Input
              type="email"
              inputMode="email"
              autoComplete="username"
              placeholder="e.g. admin@justdrugs.com"
              value={f.email}
              onChange={(e) => setF({ ...f, email: e.target.value })}
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel fontWeight={700}>Password</FormLabel>
            <InputGroup>
              <Input
                type={show ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter password"
                value={f.password}
                onChange={(e) => setF({ ...f, password: e.target.value })}
              />
              <InputRightElement h="100%">
                <IconButton
                  aria-label={show ? 'Hide password' : 'Show password'}
                  icon={<Icon name={show ? 'eyeoff' : 'eye'} size={19} />}
                  size="sm"
                  variant="ghost"
                  borderRadius="full"
                  onClick={() => setShow((x) => !x)}
                />
              </InputRightElement>
            </InputGroup>
          </FormControl>

          {err && (
            <Alert status="error" borderRadius="xl" role="alert">
              <AlertIcon />
              {err}
            </Alert>
          )}

          <Button type="submit" variant="buy" size="lg" isLoading={busy}>
            Sign in to Admin
          </Button>

          <Box bg="mist" p={3.5} borderRadius="xl" border="1px solid" borderColor="ink.100">
            <HStack spacing={2} align="start">
              <Icon name="info" size={18} color="#1B7F5A" />
              <Box fontSize="xs" color="ink.600">
                <Text fontWeight={700} color="pine.900">Staff Access Info</Text>
                <Text>Staff accounts are assigned by pharmacy management. Default root super admin is configured as <b>admin@justdrugs.com</b>.</Text>
              </Box>
            </HStack>
          </Box>

          <Text textAlign="center" fontSize="sm">
            <Text as={NextLink} href="/" color="pine.600" fontWeight={700}>
              ← Back to the store
            </Text>
          </Text>
        </VStack>
      </Box>
    </Center>
  );
}
