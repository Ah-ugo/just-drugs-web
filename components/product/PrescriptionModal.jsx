'use client';
import { useRef, useState } from 'react';
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  HStack,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  Textarea,
  VStack,
} from '@chakra-ui/react';
import Icon from '@/components/ui/Icon';
import WhatsAppIcon from '@/components/ui/WhatsAppIcon';
import ProductImage from '@/components/ui/ProductImage';
import { useAuth } from '@/context/AuthContext';
import { useStore } from '@/context/StoreContext';
import { api } from '@/lib/api';
import { storage } from '@/lib/storage';
import { money } from '@/lib/format';
import { priceInfo, productUrl } from '@/lib/product';
import { isValidPhone, normalizePhone } from '@/lib/format';
import { useNotify } from '@/lib/hooks';
import { siteOrigin } from '@/lib/config';

const MAX_MB = 10;

export default function PrescriptionModal({ isOpen, onClose, pending, onApprovedAdd }) {
  const { isAuthed } = useAuth();
  const { wa } = useStore();
  const notify = useNotify();
  const fileInput = useRef(null);

  const [files, setFiles] = useState([]);
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const product = pending?.product;
  const qty = pending?.qty || 1;
  const price = product ? priceInfo(product) : null;
  const existingRxList = storage.getJSON('jd_rx', []);
  const latestRx = existingRxList[0];

  const handleFiles = (fileList) => {
    setErr('');
    const next = [...files];
    for (const f of Array.from(fileList || [])) {
      if (next.length >= 3) {
        setErr('You can upload up to 3 pages/files.');
        break;
      }
      if (!/^image\//.test(f.type) && f.type !== 'application/pdf') {
        setErr('Only photo (JPEG, PNG) or PDF files are accepted.');
        continue;
      }
      if (f.size > MAX_MB * 1024 * 1024) {
        setErr(`"${f.name}" is larger than ${MAX_MB}MB.`);
        continue;
      }
      next.push({ file: f, preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : null });
    }
    setFiles(next);
  };

  const removeFile = (idx) => {
    setFiles((prev) => {
      if (prev[idx]?.preview) URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handleUseExisting = () => {
    if (!product) return;
    notify.success('Prescription applied', `Using prescription ${latestRx.number}`);
    onApprovedAdd(product, qty, { openDrawer: pending?.openDrawer ?? true });
    onClose();
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setErr('');

    if (!files.length) {
      setErr('Please select or take a photo of your prescription.');
      return;
    }
    if (!isAuthed && !isValidPhone(phone)) {
      setErr('Enter a valid phone number so our pharmacist can verify your prescription.');
      return;
    }

    setBusy(true);
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append('files', f.file));
      if (!isAuthed) fd.append('guest_phone', normalizePhone(phone));
      if (notes.trim()) fd.append('notes', notes.trim());

      const r = await api.upload('/prescriptions/upload', fd);
      const item = r.data;

      const local = storage.getJSON('jd_rx', []);
      storage.setJSON('jd_rx', [{ id: item._id, number: item.prescription_number }, ...local].slice(0, 10));

      files.forEach((f) => f.preview && URL.revokeObjectURL(f.preview));
      setFiles([]);
      setNotes('');
      setPhone('');

      notify.success('Prescription uploaded', `Ref #${item.prescription_number} — added to cart!`);
      onApprovedAdd(product, qty, { openDrawer: pending?.openDrawer ?? true });
      onClose();
    } catch (e2) {
      setErr(e2.message || 'Failed to upload prescription. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const waHref = product
    ? wa(`Hello 👋 I'd like to order *${product.name}* (requires prescription). Here is my prescription.\n${siteOrigin()}${productUrl(product.slug)}`)
    : wa('Hello 👋 I’d like to send my prescription.');

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
      <ModalOverlay backdropFilter="blur(4px)" />
      <ModalContent borderRadius="3xl" overflow="hidden" mx={3}>
        <ModalHeader bg="pine.900" color="white" py={5}>
          <HStack spacing={2.5}>
            <Icon name="doc" size={24} color="#FFD24D" />
            <Box>
              <Text fontSize="lg" fontWeight={800} lineHeight={1.2}>
                Upload Prescription First
              </Text>
              <Text fontSize="xs" fontWeight={500} color="pine.200">
                Prescription required before adding to cart
              </Text>
            </Box>
          </HStack>
          <ModalCloseButton color="white" top={4} right={4} />
        </ModalHeader>

        <ModalBody py={5}>
          <VStack align="stretch" spacing={4}>
            {product && (
              <HStack
                spacing={3}
                p={3}
                bg="mist"
                borderRadius="2xl"
                border="1px solid"
                borderColor="ink.200"
              >
                <ProductImage product={product} width={100} w="54px" rounded="xl" />
                <Box flex={1} minW={0}>
                  <Text fontWeight={700} fontSize="sm" noOfLines={1}>
                    {product.name}
                  </Text>
                  <HStack spacing={2} mt={0.5}>
                    <Badge colorScheme="red" variant="subtle" fontSize="2xs">
                      Rx Required
                    </Badge>
                    {price && (
                      <Text fontWeight={800} fontSize="xs" color="pine.800">
                        {money(price.current * qty)} ({qty}x)
                      </Text>
                    )}
                  </HStack>
                </Box>
              </HStack>
            )}

            {latestRx && (
              <Alert status="info" borderRadius="xl" bg="pine.50" color="pine.900" py={2.5}>
                <AlertIcon color="pine.600" />
                <Box flex={1} fontSize="xs">
                  <Text fontWeight={700}>You have a prescription on file</Text>
                  <Text color="ink.600">Ref: {latestRx.number}</Text>
                </Box>
                <Button size="xs" variant="buy" onClick={handleUseExisting}>
                  Use this Rx
                </Button>
              </Alert>
            )}

            <Box
              border="2px dashed"
              borderColor={files.length ? 'pine.500' : 'ink.200'}
              borderRadius="2xl"
              p={4}
              textAlign="center"
              bg={files.length ? 'pine.50' : 'white'}
              cursor="pointer"
              onClick={() => fileInput.current?.click()}
              transition="all .2s"
              _hover={{ borderColor: 'pine.400', bg: 'pine.50' }}
            >
              <input
                ref={fileInput}
                type="file"
                accept="image/*,application/pdf"
                multiple
                style={{ display: 'none' }}
                onChange={(e) => handleFiles(e.target.files)}
              />
              <VStack spacing={2}>
                <Icon name="camera" size={32} color="#1B7F5A" />
                <Text fontWeight={700} fontSize="sm" color="pine.900">
                  Click to take photo or upload file
                </Text>
                <Text fontSize="xs" color="ink.500">
                  Doctor’s prescription note, paper script, or hospital report (PDF, JPG, PNG)
                </Text>
              </VStack>
            </Box>

            {files.length > 0 && (
              <HStack spacing={2} overflowX="auto" py={1}>
                {files.map((f, i) => (
                  <Box
                    key={i}
                    position="relative"
                    w="60px"
                    h="60px"
                    borderRadius="xl"
                    overflow="hidden"
                    border="1px solid"
                    borderColor="pine.300"
                    bg="white"
                    flexShrink={0}
                  >
                    {f.preview ? (
                      <img
                        src={f.preview}
                        alt="Prescription preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <VStack justify="center" h="100%" spacing={0}>
                        <Icon name="doc" size={20} color="#1B7F5A" />
                        <Text fontSize="2xs" fontWeight={700} color="pine.800">
                          PDF
                        </Text>
                      </VStack>
                    )}
                    <IconButton
                      aria-label="Remove"
                      icon={<Icon name="close" size={14} />}
                      size="xs"
                      position="absolute"
                      top={0.5}
                      right={0.5}
                      colorScheme="red"
                      variant="solid"
                      borderRadius="full"
                      h="18px"
                      w="18px"
                      minW="18px"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(i);
                      }}
                    />
                  </Box>
                ))}
              </HStack>
            )}

            {!isAuthed && (
              <FormControl isRequired>
                <FormLabel fontSize="xs" fontWeight={700}>
                  Your Phone Number (for Pharmacist verification)
                </FormLabel>
                <Input
                  type="tel"
                  placeholder="e.g. 09028022359"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  size="sm"
                  borderRadius="xl"
                />
                <FormHelperText fontSize="2xs">
                  A licensed pharmacist will review this before dispatch.
                </FormHelperText>
              </FormControl>
            )}

            <FormControl>
              <FormLabel fontSize="xs" fontWeight={700}>
                Notes for the Pharmacist (optional)
              </FormLabel>
              <Textarea
                placeholder="Doctor's name, dosage instructions or special requests"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                size="sm"
                borderRadius="xl"
                rows={2}
              />
            </FormControl>

            {err && (
              <Alert status="error" borderRadius="xl" fontSize="xs">
                <AlertIcon />
                {err}
              </Alert>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter bg="mist" borderTop="1px solid" borderColor="ink.100" gap={2}>
          <Button
            as="a"
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            variant="wa"
            size="sm"
            leftIcon={<WhatsAppIcon size={18} />}
          >
            Send on WhatsApp
          </Button>
          <Button
            variant="buy"
            size="sm"
            flex={1}
            isLoading={busy}
            loadingText="Uploading..."
            onClick={handleSubmit}
            leftIcon={<Icon name="cart" size={18} />}
          >
            Upload & Add to Cart
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
