/* Home page copy. Script accent words use _underscores_. */
import { site } from './site';

export const home = {
  eyebrow: 'Writer and photographer, based in Lagos',
  headline: "I'm a writer, photographer and all-around _creative_ person.",
  intro:
    "My current life goal is to define and develop a creative practice. I have 6 years' work experience creating written and visual content for companies like Buffer, Appcues and Notion.",
  portraitLabel: '[Your portrait, full bleed]',
  cards: [
    { num: '01', title: 'Photography', text: 'Series from Lagos and the places I pass through', href: '/photography', tone: 'paper', tilt: -1.2 },
    { num: '02', title: 'Partner with me', text: 'Media kit, rates and past brand work', href: '/partnerships', tone: 'periwinkle', tilt: 0.8 },
    { num: '03', title: 'Writing', text: 'Articles and data stories, on my portfolio site', href: site.writingUrl, tone: 'paper', tilt: -0.4, external: true },
  ],
  brandsHeading: "Brands I've made content with",
  /** Swap labels for logo images once you have them. */
  brands: ['[Logo]', '[Logo]', '[Logo]', '[Logo]'],
};
