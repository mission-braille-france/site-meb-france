import { getCollection } from 'astro:content';

export const review = __MEB_REVIEW__;
export const siteName = 'MEB France';
export const subtitle = 'Mission évangélique braille France';
export async function visiblePages() {
  return (await getCollection('pages', ({ data }) => review || !data.draft))
    .sort((a, b) => a.data.order - b.data.order);
}
export function pagePath(slug: string) {
  return slug === 'accueil' ? '/' : `/${slug}/`;
}
