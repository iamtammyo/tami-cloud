/* "Partner with me" page: the live media kit. Update numbers and `updated` together. */

export const partnerships = {
  eyebrow: 'Partner with me',
  headline: 'I create for people building _global_ careers',
  intro:
    'My audience is early-to-mid career professionals, a lot of them in marketing, content and social media roles. I talk about career growth, personal branding and the creator economy, and I come at brand work as a content strategist first.',
  heroLabel: '[Photo of you mid-shoot, or a still from a brand video]',

  /** Shown next to the numbers so stale figures are obvious. */
  updated: '[month, year]',
  numbers: [
    { value: '20K+', label: 'LinkedIn followers', note: '[avg. impressions per post]' },
    { value: '[X]', label: 'Instagram followers', note: '[avg. saves and shares per post]' },
    { value: '[X]', label: 'Threads followers', note: '[avg. replies per post]' },
    { value: '[X]', label: 'TikTok followers', note: '[avg. views per video]' },
  ],
  numbersNote: 'Engagement is shown as raw counts. [One line on how you measured them and over what period.]',

  audience: [
    { label: 'Roles', text: '[Top job functions from LinkedIn analytics, with percentages]' },
    { label: 'Seniority', text: '[Entry, mid and senior split]' },
    { label: 'Where they are', text: '[Top countries and cities]' },
  ],

  offers: [
    { title: 'LinkedIn post or carousel', text: "[One line on the format and what's included]", price: 'From [your rate]' },
    { title: 'LinkedIn video', text: '[Talking to camera, with your angle and on-screen text]', price: 'From [your rate]' },
    { title: 'Instagram add-on', text: '[Reel or carousel added to a LinkedIn package]', price: '+ [your rate]' },
  ],
  usage: [
    { label: 'Organic, on my channels', price: 'Included' },
    { label: 'Cross-posting on your channels', price: '+ [your rate]' },
    { label: 'Partnership ads', price: '+ [your rate] per [period]' },
    { label: 'Paid amplification', price: '+ [your rate] per [period]' },
  ],

  quote: { text: "[A short quote from a brand or agency you've worked with]", by: '[Name, role, company]' },

  process: [
    "You send a brief and what you'd like people to do after",
    'I come back with an angle and a moodboard',
    'One round of feedback before anything is filmed',
    'It goes live, and I send you the results [after X days]',
  ],

  cta: 'Tell me about your _launch_',
};
