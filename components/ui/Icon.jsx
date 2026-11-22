'use client';
import { ICONS } from './icons.generated';

/** Iconsax icon by alias (see lib/icon-map.json). Unknown aliases render a neutral dot, never crash. */
export default function Icon({ name, size = 20, variant = 'Linear', color = 'currentColor', ...rest }) {
  const C = ICONS[name];
  if (!C) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" {...rest}>
        <circle cx="12" cy="12" r="4" fill={color} opacity=".4" />
      </svg>
    );
  }
  return <C size={size} variant={variant} color={color} aria-hidden="true" {...rest} />;
}
