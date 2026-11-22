'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertDialog, AlertDialogBody, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogOverlay, Alert, AlertIcon, Badge, Box, Button, Flex, FormControl, FormErrorMessage, FormHelperText, FormLabel, Heading, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Spinner, Text } from '@chakra-ui/react';
import Icon from '@/components/ui/Icon';
import { useAdmin } from '@/context/AdminContext';

/** Fetch-on-mount helper with reload + silent background refresh. */
export function useLoad(fn, deps = [], { poll } = {}) {
  const [s, setS] = useState({ loading: true, data: null, error: '' });
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const run = useCallback(async (silent = false) => {
    if (!silent) setS((x) => ({ ...x, loading: true, error: '' }));
    try { const data = await fn(); if (alive.current) setS({ loading: false, data, error: '' }); }
    catch (e) { if (alive.current && !silent) setS({ loading: false, data: null, error: e.message }); }
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { run(); }, [run]);
  useEffect(() => {
    if (!poll) return undefined;
    const t = setInterval(() => run(true), poll);
    return () => clearInterval(t);
  }, [poll, run]);
  return { ...s, reload: () => run(false), refresh: () => run(true), setData: (d) => setS((x) => ({ ...x, data: typeof d === 'function' ? d(x.data) : d })) };
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <Flex justify="space-between" align={{ md: 'center' }} direction={{ base: 'column', md: 'row' }} gap={3} mb={6}>
      <Box><Heading as="h1" fontSize={{ base: '2xl', md: '3xl' }}>{title}</Heading>{subtitle && <Text color="ink.500" mt={0.5}>{subtitle}</Text>}</Box>
      {actions && <Flex gap={2} flexWrap="wrap">{actions}</Flex>}
    </Flex>
  );
}

export const Panel = ({ title, actions, children, ...r }) => (
  <Box bg="white" border="1px solid" borderColor="ink.100" borderRadius="2xl" p={{ base: 4, md: 5 }} {...r}>
    {(title || actions) && <Flex justify="space-between" align="center" mb={4} gap={3}><Heading as="h2" fontSize="lg">{title}</Heading>{actions}</Flex>}
    {children}
  </Box>
);

export function StatCard({ label, value, hint, icon, tone = 'pine', href }) {
  const tones = { pine: ['pine.50', 'pine.600'], gold: ['gold.50', 'gold.600'], coral: ['coral.50', 'coral.600'], blue: ['#E8F1FB', '#2B6CB0'] };
  const [bg, fg] = tones[tone] || tones.pine;
  const inner = (
    <Flex gap={4} align="center" bg="white" border="1px solid" borderColor="ink.100" borderRadius="2xl" p={5} h="100%" _hover={href ? { borderColor: 'pine.300', boxShadow: 'soft' } : undefined} transition="all .2s">
      <Flex w="48px" h="48px" borderRadius="xl" bg={bg} color={fg} align="center" justify="center" flexShrink={0}><Icon name={icon} size={24} /></Flex>
      <Box minW={0}><Text color="ink.500" fontSize="sm" fontWeight={600}>{label}</Text>
        <Text fontFamily="heading" fontWeight={800} fontSize="2xl" lineHeight={1.15} noOfLines={1}>{value}</Text>
        {hint && <Text color="ink.500" fontSize="xs">{hint}</Text>}</Box>
    </Flex>
  );
  return href ? <Box as="a" href={href} display="block" _hover={{ textDecoration: 'none' }}>{inner}</Box> : inner;
}

export const Field = ({ label, error, help, children, ...r }) => (
  <FormControl isInvalid={!!error} {...r}>
    {label && <FormLabel>{label}</FormLabel>}
    {children}
    {error ? <FormErrorMessage>{error}</FormErrorMessage> : help ? <FormHelperText>{help}</FormHelperText> : null}
  </FormControl>
);

export function AdminModal({ isOpen, onClose, title, children, onSubmit, submitLabel = 'Save', busy, size = 'xl', error, hideFooter }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size={size} scrollBehavior="inside" isCentered closeOnOverlayClick={!busy}>
      <ModalOverlay />
      <ModalContent mx={3} as={onSubmit ? 'form' : undefined} onSubmit={onSubmit ? (e) => { e.preventDefault(); onSubmit(); } : undefined}>
        <ModalHeader fontFamily="heading" pr={12}>{title}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {error && <Alert status="error" borderRadius="xl" mb={4} role="alert"><AlertIcon />{error}</Alert>}
          {children}
        </ModalBody>
        {!hideFooter && (
          <ModalFooter gap={2}>
            <Button variant="ghost" onClick={onClose} isDisabled={busy}>Cancel</Button>
            {onSubmit && <Button type="submit" variant="dark" isLoading={busy}>{submitLabel}</Button>}
          </ModalFooter>
        )}
      </ModalContent>
    </Modal>
  );
}

export function ConfirmDialog({ isOpen, onClose, onConfirm, title, body, confirmLabel = 'Confirm', danger, busy }) {
  const ref = useRef();
  return (
    <AlertDialog isOpen={isOpen} leastDestructiveRef={ref} onClose={onClose} isCentered>
      <AlertDialogOverlay>
        <AlertDialogContent mx={3}>
          <AlertDialogHeader fontFamily="heading">{title}</AlertDialogHeader>
          <AlertDialogBody color="ink.700">{body}</AlertDialogBody>
          <AlertDialogFooter gap={2}>
            <Button ref={ref} variant="ghost" onClick={onClose} isDisabled={busy}>Cancel</Button>
            <Button colorScheme={danger ? 'coral' : 'pine'} bg={danger ? 'coral.500' : undefined} color="white" _hover={{ bg: danger ? 'coral.600' : undefined }} onClick={onConfirm} isLoading={busy}>{confirmLabel}</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
}

export const Loading = () => <Flex justify="center" py={16}><Spinner size="lg" color="pine.500" thickness="3px" /></Flex>;

export const ErrorNote = ({ error, onRetry }) => (
  <Alert status="error" borderRadius="xl" alignItems="center"><AlertIcon /><Text flex={1}>{error}</Text>{onRetry && <Button size="sm" variant="outline" onClick={onRetry}>Retry</Button>}</Alert>
);

export const Pill = ({ children, color = 'gray', solid }) => <Badge colorScheme={color} variant={solid ? 'solid' : 'subtle'}>{children}</Badge>;

/** Renders children only when the signed-in staff member has the permission. */
export function Guard({ perm, role, children }) {
  const { can, isRole } = useAdmin();
  const ok = (perm ? can(perm) : true) && (role ? isRole(...[].concat(role)) : true);
  if (ok) return children;
  return (
    <Flex direction="column" align="center" textAlign="center" py={20} gap={3}>
      <Flex w="72px" h="72px" borderRadius="full" bg="coral.50" color="coral.600" align="center" justify="center"><Icon name="lock" size={32} /></Flex>
      <Heading as="h1" fontSize="2xl">You don’t have access to this section</Heading>
      <Text color="ink.600" maxW="420px">Your role doesn’t include this area. Ask a super admin if you need it.</Text>
    </Flex>
  );
}
