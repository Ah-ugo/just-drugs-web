import { extendTheme } from '@chakra-ui/react';

const ink = {
  50: '#F5F8F6', 100: '#EAF0EC', 200: '#D5DFD9', 300: '#B3C2B9', 400: '#8A9C92',
  500: '#66786E', 600: '#4B5C53', 700: '#35443D', 800: '#202D27', 900: '#101B16',
};

const field = {
  borderRadius: 'xl', bg: 'white', borderColor: 'ink.200', fontSize: 'md',
  _hover: { borderColor: 'ink.300' },
  _focusVisible: { borderColor: 'pine.500', boxShadow: '0 0 0 3px rgba(27,127,90,.18)' },
  _invalid: { borderColor: 'coral.500', boxShadow: '0 0 0 1px var(--chakra-colors-coral-500)' },
};

const theme = extendTheme({
  config: { initialColorMode: 'light', useSystemColorMode: false },
  fonts: {
    heading: 'var(--font-display), "Segoe UI", system-ui, -apple-system, sans-serif',
    body: 'var(--font-body), "Segoe UI", system-ui, -apple-system, sans-serif',
  },
  colors: {
    ink,
    gray: ink,
    mist: '#F3F7F4',
    pine: {
      50: '#EEF7F2', 100: '#D5EBDD', 200: '#A9D6BC', 300: '#74BA95', 400: '#3F9B72',
      500: '#1B7F5A', 600: '#0F6648', 700: '#0C513A', 800: '#0A3D2C', 900: '#072B1F',
    },
    gold: {
      50: '#FFF8E1', 100: '#FFEDB3', 200: '#FFE082', 300: '#FFD24D', 400: '#FFC21F',
      500: '#F5A800', 600: '#CC8A00', 700: '#A06B00', 800: '#7A5200', 900: '#523600',
    },
    coral: {
      50: '#FFF0EE', 100: '#FFD9D4', 200: '#FFB3AA', 300: '#FF8A7C', 400: '#F26B5A',
      500: '#E5503F', 600: '#C93F2F', 700: '#A53023', 800: '#7C241A', 900: '#521810',
    },
    wa: { 400: '#4FE08C', 500: '#25D366', 600: '#1EBE5B', 700: '#128C4A' },
  },
  shadows: {
    soft: '0 1px 2px rgba(7,43,31,.04), 0 4px 14px -6px rgba(7,43,31,.10)',
    lift: '0 22px 44px -22px rgba(7,43,31,.38)',
    bar: '0 -8px 28px -12px rgba(7,43,31,.25)',
  },
  radii: { '2xl': '20px', '3xl': '28px' },
  styles: {
    global: {
      html: { scrollBehavior: 'smooth' },
      body: { bg: 'mist', color: 'ink.900', WebkitFontSmoothing: 'antialiased', textRendering: 'optimizeLegibility' },
      '::selection': { bg: 'gold.300', color: 'pine.900' },
      'a, button': { WebkitTapHighlightColor: 'transparent' },
    },
  },
  components: {
    Heading: { baseStyle: { fontFamily: 'heading', fontWeight: 700, letterSpacing: '-0.025em', color: 'pine.900' } },
    Button: {
      baseStyle: {
        borderRadius: 'full',
        fontWeight: 700,
        letterSpacing: '-0.005em',
        touchAction: 'manipulation',
        transition: 'transform 0.09s cubic-bezier(0.175, 0.885, 0.32, 1.275), background-color 0.12s ease, box-shadow 0.12s ease, color 0.12s ease',
        cursor: 'pointer',
        userSelect: 'none',
        _hover: {
          transform: 'translateY(-1px)',
          _disabled: { transform: 'none' },
        },
        _active: {
          transform: 'scale(0.93) !important',
          transition: 'transform 0.015s ease-out !important',
          _disabled: { transform: 'none' },
        },
        _focusVisible: { boxShadow: '0 0 0 3px rgba(255,194,31,.7)' },
      },
      sizes: {
        xs: { h: 8, px: 3, fontSize: 'xs' },
        sm: { h: 10, px: 4, fontSize: 'sm' },
        md: { h: 12, px: 6, fontSize: 'md' },
        lg: { h: 14, px: 8, fontSize: 'md' },
      },
      variants: {
        buy: {
          bg: 'gold.400', color: 'pine.900', boxShadow: '0 8px 18px -8px rgba(245,168,0,.9)',
          _hover: { bg: 'gold.300', transform: 'translateY(-1.5px)', boxShadow: '0 12px 24px -6px rgba(245,168,0,.8)', _disabled: { bg: 'gold.400', transform: 'none' } },
          _active: { bg: 'gold.500', transform: 'scale(0.95)' },
        },
        wa: {
          bg: 'wa.500', color: 'pine.900',
          _hover: { bg: 'wa.400', transform: 'translateY(-1.5px)', boxShadow: '0 12px 24px -6px rgba(37,211,102,.5)', _disabled: { bg: 'wa.500', transform: 'none' } },
          _active: { bg: 'wa.600', transform: 'scale(0.95)' },
        },
        soft: {
          bg: 'pine.50', color: 'pine.700',
          _hover: { bg: 'pine.100', transform: 'translateY(-1px)' },
          _active: { bg: 'pine.200', transform: 'scale(0.96)' },
        },
        dark: {
          bg: 'pine.800', color: 'white',
          _hover: { bg: 'pine.700', transform: 'translateY(-1px)', boxShadow: 'soft', _disabled: { bg: 'pine.800', transform: 'none' } },
          _active: { bg: 'pine.900', transform: 'scale(0.95)' },
        },
        outline: {
          borderColor: 'ink.200', color: 'pine.800',
          _hover: { bg: 'pine.50', borderColor: 'pine.300', transform: 'translateY(-1px)' },
          _active: { bg: 'pine.100', transform: 'scale(0.96)' },
        },
        ghost: {
          color: 'pine.800',
          _hover: { bg: 'pine.50', transform: 'translateY(-1px)' },
          _active: { bg: 'pine.100', transform: 'scale(0.96)' },
        },
      },
      defaultProps: { colorScheme: 'pine' },
    },
    Input: { variants: { outline: { field } }, sizes: { md: { field: { h: 12, px: 4, borderRadius: 'xl' } } } },
    Select: { variants: { outline: { field } }, sizes: { md: { field: { h: 12, borderRadius: 'xl' } } } },
    Textarea: { variants: { outline: field } },
    FormLabel: { baseStyle: { fontWeight: 600, fontSize: 'sm', color: 'ink.700', mb: 1.5 } },
    Badge: { baseStyle: { borderRadius: 'full', px: 2.5, py: 0.5, textTransform: 'none', fontWeight: 700, letterSpacing: 0, fontSize: 'xs' } },
    Tabs: {
      variants: {
        pill: {
          tablist: { gap: 2, overflowX: 'auto', pb: 1 },
          tab: { borderRadius: 'full', fontWeight: 600, color: 'ink.600', px: 4, whiteSpace: 'nowrap', _selected: { bg: 'pine.800', color: 'white' }, _hover: { bg: 'pine.50', _selected: { bg: 'pine.800' } } },
          tabpanel: { px: 0 },
        },
      },
    },
    Modal: { baseStyle: { dialog: { borderRadius: '2xl' } } },
    Drawer: { baseStyle: { dialog: { bg: 'white' } } },
    Accordion: { baseStyle: { container: { borderColor: 'ink.100' }, button: { py: 4, fontWeight: 700, _hover: { bg: 'transparent' } } } },
  },
});

export default theme;
