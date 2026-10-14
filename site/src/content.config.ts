import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

/*
  Headlines use _underscores_ around the script accent word.
  Images are optional everywhere: with none set, a labelled placeholder renders.
*/

const caseStudies = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/case-studies' }),
  schema: ({ image }) =>
    z.object({
      order: z.number(),
      draft: z.boolean().default(false),
      brand: z.string(),
      headline: z.string(),
      // Card on /partnerships
      card: z.object({
        eyebrow: z.string(),
        title: z.string(),
        image: image().optional(),
        imageAlt: z.string().optional(),
        imageLabel: z.string().default('[Post screenshot]'),
      }),
      hero: z.object({
        image: image().optional(),
        alt: z.string().optional(),
        label: z.string().default('[Hero still from the campaign]'),
      }),
      facts: z.array(z.object({ label: z.string(), value: z.string() })),
      brief: z.string(),
      angles: z.object({
        heading: z.string().default('The two angles'),
        items: z.array(
          z.object({
            eyebrow: z.string(),
            title: z.string(),
            body: z.string(),
            /** Video URL; YouTube links become an embed, others a link. */
            videoUrl: z.string().optional(),
            poster: image().optional(),
            posterAlt: z.string().optional(),
            label: z.string(),
          })
        ),
      }),
      system: z.object({
        headline: z.string(),
        body: z.string(),
        images: z.array(
          z.object({ label: z.string(), image: image().optional(), alt: z.string().optional() })
        ),
      }),
      results: z.array(z.object({ value: z.string(), label: z.string() })),
      quote: z.object({ text: z.string(), by: z.string() }).optional(),
    }),
});

const photoSeries = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/photo-series' }),
  schema: ({ image }) => {
    const photo = z.object({
      image: image().optional(),
      alt: z.string().optional(),
      label: z.string().default('[Image]'),
      caption: z.string().optional(),
    });
    return z.object({
      order: z.number(),
      /** Held work (exhibition anonymity) and drafts never render. */
      status: z.enum(['draft', 'held', 'public']).default('draft'),
      title: z.string(),
      place: z.string().optional(),
      year: z.string().optional(),
      camera: z.string().optional(),
      lead: photo,
      pair: z.array(photo).default([]),
      note: z.string().optional(),
      detail: photo.optional(),
      /** Further images, shown as a grid. */
      more: z.array(photo).default([]),
    });
  },
});

export const collections = { caseStudies, photoSeries };
