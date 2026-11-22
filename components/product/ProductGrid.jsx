'use client';
import { Box, SimpleGrid } from '@chakra-ui/react';
import ProductCard from './ProductCard';

/** `inserts`: { [index]: node } renders a full-width node (e.g. a banner) before that product. */
export default function ProductGrid({ products = [], inserts = {}, columns = { base: 2, md: 3, lg: 4 }, priorityCount = 4 }) {
  return (
    <SimpleGrid columns={columns} spacing={{ base: 2.5, sm: 3, md: 5 }}>
      {products.flatMap((p, i) => {
        const out = [];
        if (inserts[i]) out.push(<Box key={`ins-${i}`} gridColumn="1 / -1">{inserts[i]}</Box>);
        out.push(<ProductCard key={p._id} product={p} priority={i < priorityCount} />);
        return out;
      })}
    </SimpleGrid>
  );
}
