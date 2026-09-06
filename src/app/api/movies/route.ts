import { NextRequest, NextResponse } from 'next/server';
import {
  getNowPlayingMovies,
  getTrendingMovies,
  searchMoviesOnTmdb,
  getMovieDetail,
  getMovieRecommendations,
  getCatalogMovies,
  getMovieTrailer,
  getPersonCredits,
  getMovieWatchProviders,
} from '@/lib/tmdb';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'trending';
    const query = searchParams.get('q') || '';
    const filmId = searchParams.get('id') || '';
    const personName = searchParams.get('name') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const genre = searchParams.get('genre') || 'all';
    const sort = searchParams.get('sort') || 'rating';
    const decade = searchParams.get('decade') || 'all';
    let data;

    if (type === 'now_playing') {
      data = await getNowPlayingMovies();
    } else if (type === 'search') {
      data = await searchMoviesOnTmdb(query);
    } else if (type === 'detail') {
      data = await getMovieDetail(filmId);
    } else if (type === 'trailer') {
      const trailer = await getMovieTrailer(filmId);
      data = trailer ? { ...trailer, youtubeKey: trailer.key } : null;
    } else if (type === 'person') {
      data = await getPersonCredits(personName);
    } else if (type === 'recommendations') {
      data = await getMovieRecommendations(filmId);
    } else if (type === 'providers') {
      data = await getMovieWatchProviders(filmId);
    } else if (type === 'catalog') {
      data = await getCatalogMovies(page, genre, sort, decade);
    } else {
      data = await getTrendingMovies();
    }

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch movies' },
      { status: 500 }
    );
  }
}
