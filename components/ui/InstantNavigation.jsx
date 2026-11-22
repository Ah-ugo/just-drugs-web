'use client';
import { useEffect, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Box } from '@chakra-ui/react';

/**
 * Provides:
 * 1. An instant YouTube/GitHub-style top progress bar on link clicks
 * 2. Instant background route prefetching on hover / touchstart
 * 3. Zero-delay route transitions
 */
export default function InstantNavigation() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const [, startTransition] = useTransition();

  // Complete progress on route change
  useEffect(() => {
    if (visible) {
      setProgress(100);
      const timer = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // 1. Instant prefetcher on hover / touch
    const handlePrefetch = (e) => {
      const el = e?.target instanceof Element ? e.target : e?.target?.parentElement;
      if (!el || typeof el.closest !== 'function') return;
      const link = el.closest('a[href]');
      if (!link) return;
      const href = link.getAttribute('href');
      if (
        href &&
        href.startsWith('/') &&
        !href.startsWith('//') &&
        !href.startsWith('/api') &&
        !href.startsWith('/backend')
      ) {
        try {
          router.prefetch(href);
        } catch {
          /* ignore */
        }
      }
    };

    // 2. Click feedback: start progress bar immediately (0ms)
    const handleClick = (e) => {
      // Don't intercept clicks with modifiers (Cmd, Ctrl, Shift, Alt) or right clicks
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      const el = e?.target instanceof Element ? e.target : e?.target?.parentElement;
      if (!el || typeof el.closest !== 'function') return;
      const link = el.closest('a[href]');
      if (!link) return;
      const target = link.getAttribute('target');
      if (target && target !== '_self') return;
      const href = link.getAttribute('href');
      if (
        href &&
        href.startsWith('/') &&
        !href.startsWith('//') &&
        !href.startsWith('/api') &&
        !href.startsWith('/backend') &&
        !href.startsWith('#')
      ) {
        // Compare with current path
        const current = window.location.pathname + window.location.search;
        if (href !== current && href !== window.location.pathname) {
          startTransition(() => {
            setVisible(true);
            setProgress(35);
          });
          // Gradually increment toward 85% until route finishes
          setTimeout(() => setProgress((p) => (p > 0 && p < 85 ? 65 : p)), 100);
          setTimeout(() => setProgress((p) => (p > 0 && p < 85 ? 85 : p)), 300);
        }
      }
    };

    document.addEventListener('pointerenter', handlePrefetch, { passive: true, capture: true });
    document.addEventListener('touchstart', handlePrefetch, { passive: true, capture: true });
    document.addEventListener('click', handleClick, { capture: true });

    return () => {
      document.removeEventListener('pointerenter', handlePrefetch, { capture: true });
      document.removeEventListener('touchstart', handlePrefetch, { capture: true });
      document.removeEventListener('click', handleClick, { capture: true });
    };
  }, [router]);

  if (!visible && progress === 0) return null;

  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      h="3px"
      zIndex={999999}
      pointerEvents="none"
      overflow="hidden"
    >
      <Box
        h="100%"
        w={`${progress}%`}
        bg="linear-gradient(90deg, #1B7F5A 0%, #FFC21F 50%, #4FE08C 100%)"
        boxShadow="0 0 10px rgba(255,194,31,.9), 0 0 5px rgba(27,127,90,.8)"
        transition={progress === 100 ? 'width .15s ease-out, opacity .2s ease-out' : 'width .25s ease-out'}
        opacity={visible || progress > 0 ? 1 : 0}
      />
    </Box>
  );
}
