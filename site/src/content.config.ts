/*
  Content schemas. These mirror keystatic.config.ts (the admin); keep both in step.
  Headlines mark the script accent word with _underscores_.
  Every photo is optional: with none set, a labelled placeholder renders.
*/
import { defineCollection, type SchemaContext } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const text = z.string().nullish().transform((v) => v ?? '');

const needsAlt = (v: { image?: unknown; alt: string }, ctx: z.RefinementCtx) => {
  if (v.image && !v.alt.trim()) {
    ctx.addIssue({ code: 'custom', message: 'This photo needs alt text. Add a short description in the admin.' });
  }
};

/** A photo plus alt text. A photo without alt text fails the build. */
const photo = ({ image }: SchemaContext) =>
  z.object({ image: image().nullish(), alt: text }).default({ alt: '' }).superRefine(needsAlt);

/** A photo with alt text and a caption. */
const captioned = ({ image }: SchemaContext) =>
  z.object({ image: image().nullish(), alt: text, caption: text }).default({ alt: '', caption: '' }).superRefine(needsAlt);

/** One YAML file in src/content/pages as its own collection. Read with getPage(). */
const page = <T extends z.ZodTypeAny>(name: string, schema: (ctx: SchemaContext) => T) =>
  defineCollection({ loader: glob({ pattern: `${name}.yaml`, base: './src/content/pages' }), schema });

const settings = page('settings', () =>
  z.object({
    email: text,
    writingUrl: text,
    socials: z.array(z.object({ platform: z.string(), url: z.string() })).default([]),
    photographyInstagram: text,
    mediaKitPdf: text,
    newsletterName: text,
    newsletterAction: text,
    contactAction: text,
  })
);

const home = page('home', (ctx) =>
  z.object({
    portrait: photo(ctx),
    eyebrow: text,
    headline: text,
    intro: text,
    cards: z
      .array(
        z.object({
          title: z.string(),
          text: text,
          link: text,
          external: z.boolean().default(false),
          colour: z.enum(['paper', 'periwinkle']).default('paper'),
          photo: photo(ctx),
        })
      )
      .default([]),
    brandsHeading: text,
    brands: z.array(z.object({ name: z.string(), logo: ctx.image().nullish() })).default([]),
  })
);

const photography = page('photography', () =>
  z.object({ headline: text, statement: text, footerLabel: text })
);

const partnerships = page('partnerships', (ctx) =>
  z.object({
    hero: photo(ctx),
    eyebrow: text,
    headline: text,
    intro: text,
    updated: text,
    numbers: z
      .array(
        z.object({
          value: text,
          label: text,
          buffer: z.enum(['none', 'linkedin', 'instagram', 'tiktok']).default('none'),
          note: text,
        })
      )
      .default([]),
    numbersNote: text,
    audience: z.array(z.object({ label: text, text: text })).default([]),
    offers: z.array(z.object({ title: text, text: text, price: text })).default([]),
    usage: z.array(z.object({ label: text, price: text })).default([]),
    quote: text,
    quoteBy: text,
    process: z.array(z.string()).default([]),
    cta: text,
  })
);

const about = page('about', (ctx) =>
  z.object({
    hero: photo(ctx),
    hello: text,
    headline: text,
    paragraphs: z.array(z.string()).default([]),
    workingOn: z.array(z.object({ name: text, text: text })).default([]),
    contactIntro: text,
    topics: z.array(z.string()).default([]),
  })
);

const photoSeries = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/photo-series' }),
  schema: (ctx) =>
    z.object({
      title: z.string(),
      /** Held work (exhibition anonymity) and drafts never build. */
      status: z.enum(['draft', 'held', 'public']).default('draft'),
      order: z.number().nullish().transform((v) => v ?? 99),
      place: text,
      year: text,
      camera: text,
      lead: captioned(ctx),
      pair: z.array(captioned(ctx)).default([]),
      note: text,
      detail: captioned(ctx),
      more: z.array(captioned(ctx)).default([]),
    }),
});

const caseStudies = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/case-studies' }),
  schema: (ctx) =>
    z.object({
      brand: z.string(),
      order: z.number().nullish().transform((v) => v ?? 99),
      draft: z.boolean().default(false),
      headline: text,
      card: z
        .object({ eyebrow: text, title: text, image: ctx.image().nullish(), alt: text })
        .superRefine(needsAlt),
      hero: photo(ctx),
      facts: z.array(z.object({ label: text, value: text })).default([]),
      brief: text,
      anglesHeading: text,
      angles: z
        .array(z.object({ eyebrow: text, title: text, body: text, videoUrl: text, poster: photo(ctx) }))
        .default([]),
      systemHeadline: text,
      systemBody: text,
      systemImages: z.array(photo(ctx)).default([]),
      results: z.array(z.object({ value: text, label: text })).default([]),
      quote: text,
      quoteBy: text,
    }),
});

export const collections = { settings, home, photography, partnerships, about, photoSeries, caseStudies };
