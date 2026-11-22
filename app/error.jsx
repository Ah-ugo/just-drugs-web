'use client';
import { Button } from '@chakra-ui/react';
import { EmptyState } from '@/components/ui/Layout';

export default function Error({ reset }) {
  return (
    <EmptyState icon="danger" title="Something went wrong" text="That didn’t load properly. Please try again.">
      <Button variant="buy" onClick={() => reset()}>Try again</Button>
    </EmptyState>
  );
}
