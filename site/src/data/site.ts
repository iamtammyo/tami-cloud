/*
  Everything site-wide in one place. Anything marked TODO needs a real value
  from Tami before launch; the README lists them all.
*/

export const site = {
  name: 'Tami Oladipo',
  place: 'Lagos',
  description:
    'Writer, photographer and all-around creative person based in Lagos. Photography, brand partnerships and writing.',
  email: '', // TODO: public contact email
  writingUrl: '#', // TODO: writing portfolio URL (external)
  mediaKitPdf: '#', // TODO: media kit PDF, e.g. /media-kit.pdf in public/
  newsletter: {
    name: 'The Remote Path',
    /** Form action from the newsletter platform (beehiiv, Substack, etc.). */
    action: '', // TODO
  },
  /** Form endpoint for the contact form (Formspree, Basin, etc.). Empty = opens the visitor's email app. */
  contactAction: '', // TODO
};

export interface Link {
  label: string;
  href: string;
  external?: boolean;
}

export const nav: Link[] = [
  { label: 'Photography', href: '/photography' },
  { label: 'Partner with me', href: '/partnerships' },
  { label: 'About', href: '/about' },
  { label: 'Writing', href: site.writingUrl, external: true },
];

export const socials: Link[] = [
  { label: 'LinkedIn', href: '#' }, // TODO
  { label: 'Instagram', href: '#' }, // TODO
  { label: 'Threads', href: '#' }, // TODO
  { label: 'TikTok', href: '#' }, // TODO
];

export const social = (label: string) => socials.find((s) => s.label === label)!;

/** Shown as "[your email]" until site.email is set, matching the design boards. */
export const emailText = () => site.email || '[your email]';
export const emailHref = () => (site.email ? `mailto:${site.email}` : '#contact');
