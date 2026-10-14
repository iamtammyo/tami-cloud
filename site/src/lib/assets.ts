import type { ImageMetadata } from 'astro';

const portraits = import.meta.glob<{ default: ImageMetadata }>('/src/assets/portrait.{jpg,jpeg,png,webp}', {
  eager: true,
});

/** The home portrait, if src/assets/portrait.(jpg|png|webp) exists. */
export const portrait = Object.values(portraits)[0]?.default;
