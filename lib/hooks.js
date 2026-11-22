import { useEffect, useState, useCallback } from 'react';
import { useToast } from '@chakra-ui/react';

export function useDebounced(value, delay = 250) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return v;
}

export function useNotify() {
  const toast = useToast();
  const base = { position: 'top', isClosable: true, variant: 'subtle' };
  return {
    success: useCallback((title, description) => toast({ ...base, status: 'success', title, description, duration: 2800 }), []), // eslint-disable-line react-hooks/exhaustive-deps
    error: useCallback((title, description) => toast({ ...base, status: 'error', title, description, duration: 5000 }), []), // eslint-disable-line react-hooks/exhaustive-deps
    info: useCallback((title, description) => toast({ ...base, status: 'info', title, description, duration: 3500 }), []), // eslint-disable-line react-hooks/exhaustive-deps
  };
}
