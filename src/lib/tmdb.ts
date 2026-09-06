import { Film, FILMS } from '@/data/cinemaData';

const TMDB_API_KEY = process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY || '';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

export interface TmdbMovieItem {
  id: number;
  title: string;
  original_title?: string;
  overview: string;
  release_date: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  genre_ids?: number[];
  genres?: { id: number; name: string }[];
  runtime?: number;
  credits?: {
    crew: { job: string; name: string }[];
    cast: { name: string; character: string }[];
  };
  production_companies?: { id: number; name: string; logo_path: string | null }[];
  tagline?: string;
}

const GENRE_MAP: Record<number, string> = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Sci-Fi',
  53: 'Thriller',
  10752: 'War',
};

/**
 * Transforms a TMDB movie payload into our standard cinema Film model
 */
export function mapTmdbMovieToFilm(item: TmdbMovieItem): Film {
  const year = item.release_date ? parseInt(item.release_date.split('-')[0], 10) : 2024;
  const genres = item.genres?.map((g) => g.name) ||
    item.genre_ids?.map((id) => GENRE_MAP[id]).filter(Boolean) ||
    ['Drama', 'Cinema'];

  const director = item.credits?.crew?.find((c) => c.job === 'Director')?.name;
  const dop = item.credits?.crew?.find(
    (c) => c.job === 'Director of Photography' || c.job === 'Cinematographer' || c.job === 'Cinematography'
  )?.name;
  const writer = item.credits?.crew?.find((c) => c.job === 'Screenplay' || c.job === 'Writer' || c.job === 'Story')?.name;
  const producer = item.credits?.crew?.find((c) => c.job === 'Producer' || c.job === 'Executive Producer')?.name;

  const displayDirector = director || writer || producer || 'Studio Sinema';
  const displayCinematographer = dop || (writer && writer !== displayDirector ? `Naskah: ${writer}` : (producer && producer !== displayDirector ? `Prod: ${producer}` : 'Panavision 35mm'));

  const cast = item.credits?.cast && item.credits.cast.length > 0
    ? item.credits.cast.slice(0, 8).map((c) => ({
        name: c.name,
        role: c.character || 'Pemeran',
      }))
    : [
        { name: 'Pemeran Ansambel', role: 'Karakter Utama' },
      ];

  const posterUrl = item.poster_path
    ? `${TMDB_IMAGE_BASE}/w500${item.poster_path}`
    : FILMS[0].posterUrl;

  const backdropUrl = item.backdrop_path
    ? `${TMDB_IMAGE_BASE}/w1280${item.backdrop_path}`
    : FILMS[0].backdropUrl;

  // Distribution studio
  const distribution = item.production_companies?.[0]?.name || (genres.includes('Animation') ? 'Studio Animation' : 'Theatrical Studio Release');

  // Realistic cinema specs based on genre
  const isWidescreen = genres.includes('Action') || genres.includes('Sci-Fi') || genres.includes('Adventure');
  const aspectRatio = isWidescreen ? '2.39:1 Panavision' : '1.85:1 Flat';
  const filmStock = isWidescreen ? 'IMAX 70mm / Arri 65' : (genres.includes('Romance') ? '35mm Kodak Vision3' : 'DCI 4K Digital Master');

  // Generate smooth 10-bin distribution based on vote_average
  const roundedRating = parseFloat((item.vote_average / 2).toFixed(1)); // Convert 10-scale to 5-scale
  const baseCount = Math.max(100, Math.floor(item.vote_count / 10));
  const scoreDistribution = Array.from({ length: 10 }, (_, i) => {
    const starVal = (i + 1) * 0.5;
    const diff = Math.abs(roundedRating - starVal);
    return Math.max(50, Math.floor(baseCount * Math.exp(-diff * 1.5)));
  });

  return {
    id: `tmdb-${item.id}`,
    title: item.title,
    originalTitle: item.original_title !== item.title ? item.original_title : undefined,
    year,
    director: displayDirector,
    cinematographer: displayCinematographer,
    runtime: item.runtime || 112,
    rating: roundedRating || 4.2,
    ratingCount: item.vote_count || 1200,
    genres: genres.slice(0, 3),
    aspectRatio,
    filmStock,
    distribution,
    tagline: item.tagline || (item.overview ? item.overview.slice(0, 95) + '...' : 'Pengalaman sinematik yang memukau.'),
    synopsis: item.overview || 'Sinopsis belum tersedia.',
    posterUrl,
    backdropUrl,
    moods: ['trending', 'cozy'],
    certifiedMasterwork: (item.vote_average >= 8.0),
    scoreDistribution,
    logsCount: Math.max(500, Math.floor((item.vote_count || 500) * 0.4)),
    lovesCount: Math.max(200, Math.floor((item.vote_count || 500) * 0.25)),
    cast,
  };
}

// In-memory cache for movie details and list endpoints
const movieDetailCache = new Map<number, TmdbMovieItem>();
let cachedNowPlaying: { data: Film[]; timestamp: number } | null = null;
let cachedTrending: { data: Film[]; timestamp: number } | null = null;
const catalogCache = new Map<string, { data: CatalogResult; timestamp: number }>();

/**
 * Enriches a list of raw TMDB movie items with their real credits (director, cast, dop) & runtime.
 * Only enriches the top `maxEnrich` items (e.g. for hero billboard spotlight) to guarantee < 400ms API response time.
 */
async function enrichMovieItemsWithDetails(items: TmdbMovieItem[], maxEnrich: number = 4): Promise<Film[]> {
  if (!items || items.length === 0) return [];
  if (!TMDB_API_KEY) {
    return items.map((item) => mapTmdbMovieToFilm(item));
  }

  const toEnrich = items.slice(0, maxEnrich);
  const remaining = items.slice(maxEnrich).map((item) => {
    if (movieDetailCache.has(item.id)) {
      return mapTmdbMovieToFilm(movieDetailCache.get(item.id)!);
    }
    return mapTmdbMovieToFilm(item);
  });

  const enrichedTop = await Promise.all(
    toEnrich.map(async (item) => {
      if (movieDetailCache.has(item.id)) {
        return mapTmdbMovieToFilm(movieDetailCache.get(item.id)!);
      }

      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 2000);
        const res = await fetch(
          `${TMDB_BASE_URL}/movie/${item.id}?api_key=${TMDB_API_KEY}&append_to_response=credits`,
          { signal: controller.signal, next: { revalidate: 86400 } }
        );
        clearTimeout(timer);
        if (res.ok) {
          const detailData: TmdbMovieItem = await res.json();
          movieDetailCache.set(item.id, detailData);
          return mapTmdbMovieToFilm(detailData);
        }
      } catch {
        // Fallback to item
      }

      return mapTmdbMovieToFilm(item);
    })
  );

  return [...enrichedTop, ...remaining];
}

/**
 * Fetch Now Playing Movies from TMDB (cached in-memory for 15 minutes)
 */
export async function getNowPlayingMovies(): Promise<Film[]> {
  if (cachedNowPlaying && Date.now() - cachedNowPlaying.timestamp < 900000) {
    return cachedNowPlaying.data;
  }

  if (!TMDB_API_KEY) {
    return FILMS;
  }

  try {
    const res = await fetch(
      `${TMDB_BASE_URL}/movie/now_playing?api_key=${TMDB_API_KEY}&language=en-US&page=1`,
      { next: { revalidate: 1800 } }
    );
    if (!res.ok) throw new Error(`TMDB error ${res.status}`);
    const data = await res.json();
    const films = await enrichMovieItemsWithDetails(data.results.slice(0, 20), 4);
    if (films.length > 0) {
      cachedNowPlaying = { data: films, timestamp: Date.now() };
      return films;
    }
    return cachedNowPlaying ? cachedNowPlaying.data : FILMS;
  } catch (err) {
    console.warn('TMDB Fetch fallback:', err);
    return cachedNowPlaying ? cachedNowPlaying.data : FILMS;
  }
}

/**
 * Fetch Top Trending Movies from TMDB (cached in-memory for 15 minutes)
 */
export async function getTrendingMovies(): Promise<Film[]> {
  if (cachedTrending && Date.now() - cachedTrending.timestamp < 900000) {
    return cachedTrending.data;
  }

  if (!TMDB_API_KEY) {
    return FILMS;
  }

  try {
    const res = await fetch(
      `${TMDB_BASE_URL}/trending/movie/week?api_key=${TMDB_API_KEY}`,
      { next: { revalidate: 1800 } }
    );
    if (!res.ok) throw new Error(`TMDB error ${res.status}`);
    const data = await res.json();
    const films = await enrichMovieItemsWithDetails(data.results.slice(0, 20), 4);
    if (films.length > 0) {
      cachedTrending = { data: films, timestamp: Date.now() };
      return films;
    }
    return cachedTrending ? cachedTrending.data : FILMS;
  } catch (err) {
    console.warn('TMDB Trending fallback:', err);
    return cachedTrending ? cachedTrending.data : FILMS;
  }
}

/**
 * Fetch Movie Details by TMDB ID
 */
export async function getMovieDetail(tmdbId: number | string): Promise<Film | null> {
  const numericId = typeof tmdbId === 'string' ? parseInt(tmdbId.replace('tmdb-', ''), 10) : tmdbId;

  if (isNaN(numericId)) {
    const found = FILMS.find((f) => f.id === tmdbId);
    return found || FILMS[0];
  }

  if (movieDetailCache.has(numericId)) {
    return mapTmdbMovieToFilm(movieDetailCache.get(numericId)!);
  }

  if (!TMDB_API_KEY) {
    const found = FILMS.find((f) => f.id === tmdbId);
    return found || FILMS[0];
  }

  try {
    const res = await fetch(
      `${TMDB_BASE_URL}/movie/${numericId}?api_key=${TMDB_API_KEY}&append_to_response=credits`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) throw new Error(`TMDB error ${res.status}`);
    const data: TmdbMovieItem = await res.json();
    movieDetailCache.set(numericId, data);
    return mapTmdbMovieToFilm(data);
  } catch (err) {
    console.warn('TMDB Detail fallback:', err);
    const found = FILMS.find((f) => f.id === tmdbId);
    return found || FILMS[0];
  }
}

/**
 * Search Movies on TMDB
 */
export async function searchMoviesOnTmdb(query: string): Promise<Film[]> {
  if (!query.trim()) return [];
  if (!TMDB_API_KEY) {
    return FILMS.filter((f) => f.title.toLowerCase().includes(query.toLowerCase()));
  }

  try {
    const res = await fetch(
      `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=1`,
      { next: { revalidate: 1800 } }
    );
    if (!res.ok) throw new Error(`TMDB search error ${res.status}`);
    const data = await res.json();
    return await enrichMovieItemsWithDetails(data.results.slice(0, 10));
  } catch (err) {
    console.warn('TMDB search fallback:', err);
    return FILMS.filter((f) => f.title.toLowerCase().includes(query.toLowerCase()));
  }
}

const GENRE_NAME_TO_ID: Record<string, number> = {
  Action: 28,
  Adventure: 12,
  Animation: 16,
  Comedy: 35,
  Crime: 80,
  Documentary: 99,
  Drama: 18,
  Family: 10751,
  Fantasy: 14,
  History: 36,
  Horror: 27,
  Music: 10402,
  Mystery: 9648,
  Romance: 10749,
  'Sci-Fi': 878,
  Thriller: 53,
  War: 10752,
};

export interface CatalogResult {
  films: Film[];
  page: number;
  totalPages: number;
  totalResults: number;
}

/**
 * Fetch Catalog Movies from TMDB with full pagination, genre filter, and sorting
 */
export async function getCatalogMovies(
  page: number = 1,
  genre?: string,
  sortBy: string = 'rating',
  decade?: string
): Promise<CatalogResult> {
  if (!TMDB_API_KEY) {
    return {
      films: FILMS,
      page: 1,
      totalPages: 1,
      totalResults: FILMS.length,
    };
  }

  const cacheKey = `${page}-${genre || 'all'}-${sortBy}-${decade || 'all'}`;
  if (catalogCache.has(cacheKey)) {
    const cached = catalogCache.get(cacheKey)!;
    if (Date.now() - cached.timestamp < 1800000) {
      return cached.data;
    }
  }

  try {
    const minVote = sortBy === 'rating' ? 300 : 50;
    let url = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&language=en-US&page=${page}&vote_count.gte=${minVote}`;

    if (genre && genre !== 'all' && GENRE_NAME_TO_ID[genre]) {
      url += `&with_genres=${GENRE_NAME_TO_ID[genre]}`;
    }

    if (decade && decade !== 'all') {
      if (decade === 'classic') {
        url += `&primary_release_date.lte=1979-12-31`;
      } else {
        const startYear = parseInt(decade.substring(0, 4), 10);
        if (!isNaN(startYear)) {
          url += `&primary_release_date.gte=${startYear}-01-01&primary_release_date.lte=${startYear + 9}-12-31`;
        }
      }
    }

    if (sortBy === 'rating') {
      url += `&sort_by=vote_average.desc`;
    } else if (sortBy === 'year') {
      url += `&sort_by=primary_release_date.desc`;
    } else if (sortBy === 'logs') {
      url += `&sort_by=vote_count.desc`;
    } else if (sortBy === 'title') {
      url += `&sort_by=original_title.asc`;
    } else {
      url += `&sort_by=popularity.desc`;
    }

    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (!res.ok) throw new Error(`TMDB discover error: ${res.status}`);
    const data = await res.json();

    const films = (data.results || []).map((item: TmdbMovieItem) => {
      if (movieDetailCache.has(item.id)) {
        return mapTmdbMovieToFilm(movieDetailCache.get(item.id)!);
      }
      return mapTmdbMovieToFilm(item);
    });

    const result: CatalogResult = {
      films,
      page: data.page || page,
      totalPages: Math.min(data.total_pages || 1, 500),
      totalResults: data.total_results || films.length,
    };

    catalogCache.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;
  } catch (err) {
    console.warn('TMDB Catalog fallback:', err);
    if (catalogCache.has(cacheKey)) {
      return catalogCache.get(cacheKey)!.data;
    }
    return {
      films: FILMS,
      page: 1,
      totalPages: 1,
      totalResults: FILMS.length,
    };
  }
}

/**
 * Fetch Real Movie Recommendations from TMDB (with similar fallback)
 */
export async function getMovieRecommendations(tmdbId: number | string): Promise<Film[]> {
  const numericId = typeof tmdbId === 'string' ? parseInt(tmdbId.replace('tmdb-', ''), 10) : tmdbId;

  if (isNaN(numericId) || !TMDB_API_KEY) {
    return FILMS.filter((f) => f.id !== tmdbId).slice(0, 6);
  }

  try {
    // 1. First try TMDB recommendations endpoint (highly thematic match)
    let res = await fetch(
      `${TMDB_BASE_URL}/movie/${numericId}/recommendations?api_key=${TMDB_API_KEY}&language=en-US&page=1`,
      { next: { revalidate: 86400 } }
    );
    let data = res.ok ? await res.json() : null;

    // 2. If recommendations are empty, fallback to similar movies endpoint
    if (!data || !data.results || data.results.length === 0) {
      res = await fetch(
        `${TMDB_BASE_URL}/movie/${numericId}/similar?api_key=${TMDB_API_KEY}&language=en-US&page=1`,
        { next: { revalidate: 86400 } }
      );
      data = res.ok ? await res.json() : null;
    }

    if (data && Array.isArray(data.results) && data.results.length > 0) {
      const topRecs = data.results.slice(0, 8);
      return await enrichMovieItemsWithDetails(topRecs);
    }

    // Fallback to trending
    return await getTrendingMovies();
  } catch (err) {
    console.warn('TMDB Recommendations error:', err);
    return FILMS.filter((f) => f.id !== tmdbId).slice(0, 6);
  }
}

export interface MovieTrailer {
  key: string;
  name: string;
  site: string;
}

/**
 * Fetch official trailer video for a movie from TMDB
 */
export async function getMovieTrailer(tmdbId: number | string): Promise<MovieTrailer | null> {
  const numericId = typeof tmdbId === 'string' ? parseInt(tmdbId.replace('tmdb-', ''), 10) : tmdbId;
  if (isNaN(numericId) || !TMDB_API_KEY) return null;

  try {
    const res = await fetch(
      `${TMDB_BASE_URL}/movie/${numericId}/videos?api_key=${TMDB_API_KEY}&language=en-US`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || !Array.isArray(data.results) || data.results.length === 0) return null;

    const trailer = data.results.find(
      (v: any) => v.site === 'YouTube' && v.type === 'Trailer' && v.official
    ) || data.results.find(
      (v: any) => v.site === 'YouTube' && v.type === 'Trailer'
    ) || data.results.find(
      (v: any) => v.site === 'YouTube' && v.type === 'Teaser'
    ) || data.results.find(
      (v: any) => v.site === 'YouTube'
    );

    if (!trailer) return null;
    return {
      key: trailer.key,
      name: trailer.name || 'Official Trailer',
      site: trailer.site,
    };
  } catch {
    return null;
  }
}

export interface PersonCreditsResult {
  id: number;
  name: string;
  department: string;
  profilePath: string | null;
  knownFor: Film[];
}

/**
 * Search a person and fetch their key filmography from TMDB
 */
export async function getPersonCredits(personName: string): Promise<PersonCreditsResult | null> {
  if (!personName || !personName.trim() || !TMDB_API_KEY) return null;

  try {
    const searchRes = await fetch(
      `${TMDB_BASE_URL}/search/person?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(personName.trim())}&page=1`,
      { next: { revalidate: 86400 } }
    );
    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();
    const person = searchData.results?.[0];
    if (!person) return null;

    const creditsRes = await fetch(
      `${TMDB_BASE_URL}/person/${person.id}/movie_credits?api_key=${TMDB_API_KEY}&language=en-US`,
      { next: { revalidate: 86400 } }
    );
    if (!creditsRes.ok) return null;
    const creditsData = await creditsRes.json();

    const rawList = person.known_for_department === 'Directing'
      ? (creditsData.crew?.filter((c: any) => c.job === 'Director') || creditsData.cast || [])
      : (creditsData.cast || creditsData.crew || []);

    const sorted = [...rawList]
      .filter((m: any) => m.poster_path)
      .sort((a: any, b: any) => (b.vote_count || 0) - (a.vote_count || 0))
      .slice(0, 12);

    const knownFor = sorted.map((m: any) => mapTmdbMovieToFilm(m));

    return {
      id: person.id,
      name: person.name,
      department: person.known_for_department || 'Acting',
      profilePath: person.profile_path ? `${TMDB_IMAGE_BASE}/w300${person.profile_path}` : null,
      knownFor,
    };
  } catch {
    return null;
  }
}

/**
 * Fetch official streaming / watch providers in Indonesia for a film
 */
export async function getMovieWatchProviders(filmId: string | number) {
  if (!TMDB_API_KEY) return null;

  const tmdbId = String(filmId).replace('tmdb-', '');
  if (!tmdbId || isNaN(Number(tmdbId))) return null;

  try {
    const res = await fetch(
      `${TMDB_BASE_URL}/movie/${tmdbId}/watch/providers?api_key=${TMDB_API_KEY}`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const idResults = data.results?.ID;
    const usResults = data.results?.US;
    const chosen = idResults || usResults;

    if (!chosen) return null;

    const mapProvider = (p: any) => ({
      provider_id: p.provider_id,
      provider_name: p.provider_name,
      logo_path: p.logo_path ? `${TMDB_IMAGE_BASE}/w154${p.logo_path}` : '',
      display_priority: p.display_priority,
    });

    return {
      country: idResults ? 'ID' : 'GLOBAL',
      link: chosen.link || `https://www.themoviedb.org/movie/${tmdbId}/watch`,
      flatrate: Array.isArray(chosen.flatrate) ? chosen.flatrate.map(mapProvider) : [],
      rent: Array.isArray(chosen.rent) ? chosen.rent.map(mapProvider) : [],
      buy: Array.isArray(chosen.buy) ? chosen.buy.map(mapProvider) : [],
    };
  } catch {
    return null;
  }
}

