/*
  Site-wide settings. In phase 2 most of this moves into the Keystatic
  `settings` singleton; until then it is the single place to edit.
*/

export interface NavItem {
  label: string;
  href: string;
  /** Hidden items are skipped, e.g. a section with zero entries. */
  hidden?: boolean;
}

export const site = {
  name: 'Tami Oladipo',
  title: 'Tami Oladipo',
  description:
    'Photographer, creator of The Remote Path, and content lead at Buffer. Writing, photography and partnerships in one place.',
  email: 'hello@example.com', // placeholder until the settings singleton exists
  locale: 'en',
} as const;

/** Top nav: exactly five items, in this order. */
export const mainNav: NavItem[] = [
  { label: 'About', href: '/about' },
  { label: 'Work', href: '/work' },
  { label: 'Photography', href: '/photography' },
  { label: 'Creator', href: '/creator' },
  { label: 'Contact', href: '/contact' },
];

/** Footer adds Partnerships, which stays out of the main nav. */
export const footerNav: NavItem[] = [
  ...mainNav,
  { label: 'Partnerships', href: '/partnerships' },
];

/** Fill in real profile URLs; entries with an empty href are not rendered. */
export const socials: NavItem[] = [
  { label: 'LinkedIn', href: '' },
  { label: 'Instagram', href: '' },
  { label: 'Threads', href: '' },
  { label: 'YouTube', href: '' },
  { label: 'TikTok', href: '' },
];

export const visible = (items: NavItem[]) => items.filter((i) => !i.hidden && i.href);
