'use client';
import { createContext, useContext, useMemo } from 'react';
import { useDisclosure } from '@chakra-ui/react';
import { WHATSAPP_NUMBER, SUPPORT_PHONE, SUPPORT_EMAIL, STORE_NAME, waDigitsOf } from '@/lib/config';
import { waLink } from '@/lib/whatsapp';

const StoreCtx = createContext(null);

export function StoreProvider({ settings, categories, children }) {
  const navDrawer = useDisclosure();

  const value = useMemo(() => {
    const s = settings || {};
    const whatsappNumber = waDigitsOf(WHATSAPP_NUMBER || s.whatsapp_number || s.company_phone || '09028022359');
    return {
      storeName: s.company_name || STORE_NAME,
      settings: s,
      categories: categories || [],
      symbol: s.currency_symbol || '₦',
      deliveryFee: Number(s.default_delivery_fee ?? 1500),
      freeThreshold: Number(s.free_delivery_threshold ?? 25000),
      taxRate: Number(s.tax_rate_percent ?? 7.5),
      taxName: s.tax_name || 'VAT',
      prescriptionsEnabled: s.enable_prescriptions !== false,
      whatsappNumber,
      wa: (text) => waLink(text, whatsappNumber),
      phone: SUPPORT_PHONE || s.company_phone || '',
      email: SUPPORT_EMAIL || s.company_email || '',
      address: s.company_address || '',
      navDrawer,
    };
  }, [settings, categories, navDrawer]);

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export const useStore = () => useContext(StoreCtx);
