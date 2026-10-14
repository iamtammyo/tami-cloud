import { getEntry, type CollectionEntry } from 'astro:content';

type PageName = 'settings' | 'home' | 'photography' | 'partnerships' | 'about';

/** Read one of the editable page files in src/content/pages. */
export async function getPage<N extends PageName>(name: N): Promise<CollectionEntry<N>['data']> {
  const entry = await getEntry(name, name);
  if (!entry) throw new Error(`Missing src/content/pages/${name}.yaml`);
  return entry.data as CollectionEntry<N>['data'];
}

export const SITE_NAME = 'Tami Oladipo';
export const SITE_PLACE = 'Lagos';

export interface NavLink {
  label: string;
  href: string;
  external?: boolean;
}

/** Settings plus the derived bits most pages need. */
export async function getSite() {
  const s = await getPage('settings');
  const real = (url: string) => (url && url !== '#' ? url : '');
  const writingUrl = real(s.writingUrl);
  const nav: NavLink[] = [
    { label: 'Photography', href: '/photography' },
    { label: 'Partner with me', href: '/partnerships' },
    { label: 'About', href: '/about' },
    // Hidden until the portfolio link is set, so it never points nowhere.
    ...(writingUrl ? [{ label: 'Writing', href: writingUrl, external: true }] : []),
  ];
  return {
    ...s,
    writingUrl,
    nav,
    /** Empty until a PDF is uploaded; buttons hide when empty. */
    mediaKitHref: real(s.mediaKitPdf),
    emailText: s.email || '[your email]',
    emailHref: s.email ? `mailto:${s.email}` : '/about#contact',
    socials: s.socials.filter((x) => real(x.url)),
    social: (platform: string) => real(s.socials.find((x) => x.platform.toLowerCase() === platform.toLowerCase())?.url ?? ''),
  };
}
