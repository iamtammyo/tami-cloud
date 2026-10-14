import { getCollection } from 'astro:content';

export const caseStudies = async () =>
  (await getCollection('caseStudies', (c) => !c.data.draft)).sort((a, b) => a.data.order - b.data.order);
