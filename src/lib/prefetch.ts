// Smart in-memory cache of already prefetched asset URLs
const prefetchedUrls = new Set<string>();

/**
 * Prefetches an image into the browser's memory cache
 */
export function prefetchImage(url: string | null | undefined): void {
  if (!url || typeof window === 'undefined') return;
  if (prefetchedUrls.has(url)) return;

  prefetchedUrls.add(url);
  const img = new Image();
  img.src = url;
}

/**
 * Prefetches all primary assets for a movie card on hover
 */
export function prefetchMovieCard(posterUrl?: string, backdropUrl?: string): void {
  if (posterUrl) prefetchImage(posterUrl);
  if (backdropUrl) prefetchImage(backdropUrl);
}
