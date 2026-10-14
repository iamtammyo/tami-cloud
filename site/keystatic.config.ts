/*
  The admin (Keystatic). Visit /keystatic to edit.
  Locally it writes files on disk; on the live site it commits to GitHub,
  which triggers a redeploy. Keep these schemas in step with src/content.config.ts.
*/
import { collection, config, fields, singleton } from '@keystatic/core';

const SCRIPT_HINT = 'Wrap the handwritten word in underscores, e.g. "Say _hello_".';
const ALT_HINT = 'Describe the photo for people who cannot see it. Required when a photo is added.';

const imageField = (label: string, folder: string) =>
  fields.image({ label, directory: `src/assets/${folder}`, publicPath: `../../assets/${folder}/` });

/** A photo plus its alt text. Files land in src/assets/<folder>/. */
const photo = (label: string, folder: string) =>
  fields.object(
    { image: imageField(label, folder), alt: fields.text({ label: 'Alt text', description: ALT_HINT }) },
    { label }
  );

/** A photo with alt text and a caption. */
const captioned = (label: string, folder: string) =>
  fields.object(
    {
      image: imageField(label, folder),
      alt: fields.text({ label: 'Alt text', description: ALT_HINT }),
      caption: fields.text({ label: 'Caption' }),
    },
    { label }
  );

// Local files while developing; commits to GitHub on the live site.
const storage = import.meta.env.DEV
  ? ({ kind: 'local' } as const)
  : ({ kind: 'github', repo: 'iamtammyo/tami-cloud', pathPrefix: 'site' } as const);

export default config({
  storage,
  ui: {
    brand: { name: 'Tami Oladipo' },
    navigation: {
      Pages: ['home', 'photography', 'partnerships', 'about'],
      Work: ['photoSeries', 'caseStudies'],
      Site: ['settings'],
    },
  },

  singletons: {
    settings: singleton({
      label: 'Site settings',
      path: 'src/content/pages/settings',
      format: { data: 'yaml' },
      schema: {
        email: fields.text({ label: 'Public email' }),
        writingUrl: fields.text({ label: 'Writing portfolio link', description: 'Full URL to your external portfolio.' }),
        socials: fields.array(
          fields.object({
            platform: fields.text({ label: 'Platform', validation: { isRequired: true } }),
            url: fields.text({ label: 'Profile URL', validation: { isRequired: true } }),
          }),
          { label: 'Social links', itemLabel: (p) => p.fields.platform.value || 'Link' }
        ),
        photographyInstagram: fields.text({
          label: 'Photography Instagram',
          description: 'Linked from the Photography page footer.',
        }),
        mediaKitPdf: fields.file({
          label: 'Media kit PDF',
          directory: 'public/files',
          publicPath: '/files/',
        }),
        newsletterName: fields.text({ label: 'Newsletter name', defaultValue: 'The Remote Path' }),
        newsletterAction: fields.text({
          label: 'Newsletter form action',
          description: 'The signup form URL from your newsletter platform.',
        }),
        contactAction: fields.text({
          label: 'Contact form endpoint',
          description: 'From Formspree or similar. Leave empty to open the visitor’s email app.',
        }),
      },
    }),

    home: singleton({
      label: 'Home',
      path: 'src/content/pages/home',
      format: { data: 'yaml' },
      schema: {
        portrait: photo('Portrait (left panel)', 'home'),
        eyebrow: fields.text({ label: 'Small caps line' }),
        headline: fields.text({ label: 'Headline', description: SCRIPT_HINT }),
        intro: fields.text({ label: 'Intro', multiline: true }),
        cards: fields.array(
          fields.object({
            title: fields.text({ label: 'Title', validation: { isRequired: true } }),
            text: fields.text({ label: 'Text' }),
            link: fields.text({ label: 'Link', description: 'A page like /photography, or a full URL. Leave empty on an external card to use your writing portfolio link.' }),
            external: fields.checkbox({ label: 'Opens another site' }),
            colour: fields.select({
              label: 'Colour',
              options: [
                { label: 'Paper', value: 'paper' },
                { label: 'Periwinkle', value: 'periwinkle' },
              ],
              defaultValue: 'paper',
            }),
            photo: photo('Small photo', 'home/cards'),
          }),
          { label: 'Cards', itemLabel: (p) => p.fields.title.value || 'Card' }
        ),
        brandsHeading: fields.text({ label: 'Brands heading' }),
        brands: fields.array(
          fields.object({
            name: fields.text({ label: 'Brand name', validation: { isRequired: true } }),
            logo: fields.image({ label: 'Logo', directory: 'src/assets/brands', publicPath: '../../assets/brands/' }),
          }),
          { label: 'Brands', itemLabel: (p) => p.fields.name.value || 'Brand' }
        ),
      },
    }),

    photography: singleton({
      label: 'Photography page',
      path: 'src/content/pages/photography',
      format: { data: 'yaml' },
      schema: {
        headline: fields.text({ label: 'Headline', description: SCRIPT_HINT }),
        statement: fields.text({ label: 'Statement', multiline: true }),
        footerLabel: fields.text({ label: 'Footer label', defaultValue: 'Prints and licensing' }),
      },
    }),

    partnerships: singleton({
      label: 'Partner with me (media kit)',
      path: 'src/content/pages/partnerships',
      format: { data: 'yaml' },
      schema: {
        hero: photo('Hero photo', 'partnerships'),
        eyebrow: fields.text({ label: 'Small caps line' }),
        headline: fields.text({ label: 'Headline', description: SCRIPT_HINT }),
        intro: fields.text({ label: 'Intro', multiline: true }),
        updated: fields.text({ label: 'Follower counts last updated', description: 'e.g. October 2026' }),
        numbers: fields.array(
          fields.object({
            value: fields.text({ label: 'Big number', description: 'e.g. 20K+' }),
            label: fields.text({ label: 'Label', description: 'e.g. LinkedIn followers' }),
            buffer: fields.select({
              label: 'Auto-fill the small line from Buffer',
              options: [
                { label: 'No, I’ll write it', value: 'none' },
                { label: 'LinkedIn', value: 'linkedin' },
                { label: 'Instagram', value: 'instagram' },
                { label: 'TikTok', value: 'tiktok' },
              ],
              defaultValue: 'none',
            }),
            note: fields.text({ label: 'Small line (used when not auto-filled)' }),
          }),
          { label: 'Numbers', itemLabel: (p) => `${p.fields.value.value} ${p.fields.label.value}` }
        ),
        numbersNote: fields.text({ label: 'Note under the numbers', multiline: true }),
        audience: fields.array(
          fields.object({
            label: fields.text({ label: 'Label' }),
            text: fields.text({ label: 'Text', multiline: true }),
          }),
          { label: 'Who’s listening', itemLabel: (p) => p.fields.label.value || 'Box' }
        ),
        offers: fields.array(
          fields.object({
            title: fields.text({ label: 'Title' }),
            text: fields.text({ label: 'Description' }),
            price: fields.text({ label: 'Price line' }),
          }),
          { label: 'What I make', itemLabel: (p) => p.fields.title.value || 'Offer' }
        ),
        usage: fields.array(
          fields.object({ label: fields.text({ label: 'Usage' }), price: fields.text({ label: 'Price' }) }),
          { label: 'Usage rights', itemLabel: (p) => p.fields.label.value || 'Row' }
        ),
        quote: fields.text({ label: 'Brand quote', multiline: true }),
        quoteBy: fields.text({ label: 'Quote attribution' }),
        process: fields.array(fields.text({ label: 'Step' }), {
          label: 'How a partnership runs',
          itemLabel: (p) => p.value || 'Step',
        }),
        cta: fields.text({ label: 'Closing headline', description: SCRIPT_HINT }),
      },
    }),

    about: singleton({
      label: 'About and contact',
      path: 'src/content/pages/about',
      format: { data: 'yaml' },
      schema: {
        hero: photo('Full-bleed photo behind the "hello" note', 'about'),
        hello: fields.text({ label: 'Line under "hello"' }),
        headline: fields.text({ label: 'Headline', description: SCRIPT_HINT }),
        paragraphs: fields.array(fields.text({ label: 'Paragraph', multiline: true }), {
          label: 'Story',
          itemLabel: (p) => p.value.slice(0, 60) || 'Paragraph',
        }),
        workingOn: fields.array(
          fields.object({ name: fields.text({ label: 'Name' }), text: fields.text({ label: 'Text', multiline: true }) }),
          { label: 'What I’m working on', itemLabel: (p) => p.fields.name.value || 'Item' }
        ),
        contactIntro: fields.text({ label: 'Contact intro', multiline: true }),
        topics: fields.array(fields.text({ label: 'Topic' }), {
          label: 'Contact form topics',
          itemLabel: (p) => p.value || 'Topic',
        }),
      },
    }),
  },

  collections: {
    photoSeries: collection({
      label: 'Photo series',
      slugField: 'title',
      path: 'src/content/photo-series/*',
      format: { data: 'yaml' },
      columns: ['title', 'status'],
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        status: fields.select({
          label: 'Status',
          description: 'Only Public series appear on the site. Use Held for work under exhibition anonymity rules.',
          options: [
            { label: 'Draft', value: 'draft' },
            { label: 'Held', value: 'held' },
            { label: 'Public', value: 'public' },
          ],
          defaultValue: 'draft',
        }),
        order: fields.integer({ label: 'Order', description: '1 shows first.', defaultValue: 1 }),
        place: fields.text({ label: 'Place' }),
        year: fields.text({ label: 'Year' }),
        camera: fields.text({ label: 'Camera' }),
        lead: captioned('Lead photo (landscape, full width)', 'photography'),
        pair: fields.array(captioned('Photo', 'photography'), {
          label: 'Two portrait photos',
          itemLabel: (p) => p.fields.caption.value || 'Photo',
          validation: { length: { max: 2 } },
        }),
        note: fields.text({ label: 'Short note (pull quote)', multiline: true }),
        detail: captioned('Detail shot', 'photography'),
        more: fields.array(captioned('Photo', 'photography'), {
          label: 'More photos',
          itemLabel: (p) => p.fields.caption.value || p.fields.alt.value || 'Photo',
        }),
      },
    }),

    caseStudies: collection({
      label: 'Case studies',
      slugField: 'brand',
      path: 'src/content/case-studies/*',
      format: { data: 'yaml' },
      columns: ['brand'],
      schema: {
        brand: fields.slug({ name: { label: 'Brand' } }),
        order: fields.integer({ label: 'Order', defaultValue: 1 }),
        draft: fields.checkbox({ label: 'Hide from the site (draft)' }),
        headline: fields.text({ label: 'Headline', description: SCRIPT_HINT }),
        card: fields.object(
          {
            eyebrow: fields.text({ label: 'Small caps line', description: 'e.g. Slate · two-video campaign' }),
            title: fields.text({ label: 'Card title' }),
            image: fields.image({ label: 'Card image', directory: 'src/assets/case-studies', publicPath: '../../assets/case-studies/' }),
            alt: fields.text({ label: 'Alt text', description: ALT_HINT }),
          },
          { label: 'Card on the Partner with me page' }
        ),
        hero: photo('Hero still', 'case-studies'),
        facts: fields.array(
          fields.object({ label: fields.text({ label: 'Label' }), value: fields.text({ label: 'Value' }) }),
          { label: 'Facts (brand, format, channel, when)', itemLabel: (p) => p.fields.label.value || 'Fact' }
        ),
        brief: fields.text({ label: 'The brief', multiline: true }),
        anglesHeading: fields.text({ label: 'Videos section heading', defaultValue: 'The two angles' }),
        angles: fields.array(
          fields.object({
            eyebrow: fields.text({ label: 'Small caps line' }),
            title: fields.text({ label: 'Title' }),
            body: fields.text({ label: 'Text', multiline: true }),
            videoUrl: fields.text({ label: 'Video link', description: 'YouTube links play on the page; others open in a new tab.' }),
            poster: photo('Poster image', 'case-studies'),
          }),
          { label: 'Videos', itemLabel: (p) => p.fields.title.value || 'Video' }
        ),
        systemHeadline: fields.text({ label: 'Creative system headline', description: SCRIPT_HINT }),
        systemBody: fields.text({ label: 'Creative system text', multiline: true }),
        systemImages: fields.array(photo('Image', 'case-studies'), {
          label: 'Creative system images',
          itemLabel: (p) => p.fields.alt.value || 'Image',
        }),
        results: fields.array(
          fields.object({ value: fields.text({ label: 'Number' }), label: fields.text({ label: 'Label' }) }),
          { label: 'What happened', itemLabel: (p) => `${p.fields.value.value} ${p.fields.label.value}` }
        ),
        quote: fields.text({ label: 'Quote', multiline: true }),
        quoteBy: fields.text({ label: 'Quote attribution' }),
      },
    }),
  },
});
