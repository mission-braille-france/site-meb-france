import { defineCollection, z } from 'astro:content';

const pages = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    navTitle: z.string(),
    description: z.string(),
    lead: z.string().optional(),
    order: z.number(),
    draft: z.boolean().default(true),
    nav: z.boolean().default(true),
    source: z.string(),
    notice: z.enum(['documents', 'newsletter', 'contact', 'brochure']).optional()
  })
});
export const collections = { pages };
