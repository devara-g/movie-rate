import { createClient } from '@supabase/supabase-js';
import {
  MovieLog,
  Profile,
  CustomList,
  CustomListFilm,
  ReviewComment,
  AppNotification,
  DirectMessage,
  FilmAttachment,
  ChatConversation,
  JournalEssay,
} from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-project') &&
  supabaseUrl.startsWith('http')
);

// Client instance with full TypeScript compatibility
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export interface UserProfile {
  id: string;
  email?: string;
  username: string;
  name: string;
  avatar_url: string;
  bio: string;
  location: string;
  role: string;
  banner_url?: string;
}

export function generateCinemaAvatar(name: string = 'Cinephile'): string {
  const initial = (name.trim()[0] || 'C').toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
    <defs>
      <linearGradient id="cineBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1e2730"/>
        <stop offset="100%" stop-color="#14181c"/>
      </linearGradient>
      <linearGradient id="cineGreen" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#00e054"/>
        <stop offset="100%" stop-color="#00aa40"/>
      </linearGradient>
    </defs>
    <circle cx="60" cy="60" r="58" fill="url(#cineBg)" stroke="#333f4d" stroke-width="2.5"/>
    <circle cx="60" cy="60" r="49" fill="none" stroke="#2c3642" stroke-width="1.5" stroke-dasharray="5 4"/>
    <circle cx="60" cy="60" r="38" fill="url(#cineGreen)" fill-opacity="0.16"/>
    <text x="60" y="74" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="44" font-weight="900" fill="#00e054" text-anchor="middle" letter-spacing="-1">${initial}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function getSafeAvatar(avatarUrl?: string, name: string = 'Cinephile'): string {
  if (!avatarUrl || avatarUrl.includes('photo-1534528741775-53994a69daeb') || avatarUrl.includes('placeholder')) {
    return generateCinemaAvatar(name);
  }
  return avatarUrl;
}

export const DEFAULT_AVATAR = generateCinemaAvatar('Cinephile');

/**
 * Register a new user with Supabase Auth & create their profile
 */
export async function signUpUser(
  email: string,
  password: string,
  name: string,
  username: string
): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  if (!supabase) {
    const initialAvatar = generateCinemaAvatar(name || username);
    // Local fallback for offline simulation
    const mockUser: UserProfile = {
      id: `local-${Date.now()}`,
      email,
      username: username.toLowerCase().replace(/\s+/g, ''),
      name,
      avatar_url: initialAvatar,
      bio: 'Pencinta sinema dan penikmat film celluloid.',
      location: 'Indonesia',
      role: 'Cinephile',
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem('cinehearth_user', JSON.stringify(mockUser));
    }
    return { success: true, user: mockUser };
  }

  try {
    const cleanUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, '');
    const initialAvatar = generateCinemaAvatar(name || cleanUsername);
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          username: cleanUsername,
          avatar_url: initialAvatar,
        },
      },
    });

    if (authError) return { success: false, error: authError.message };
    if (!authData.user) return { success: false, error: 'Gagal membuat akun' };

    const newProfile: UserProfile = {
      id: authData.user.id,
      email: authData.user.email,
      name: name || 'Cinema Lover',
      username: cleanUsername || 'cinephile',
      avatar_url: initialAvatar,
      bio: 'Pencinta sinema dan penikmat film bioskop.',
      location: 'Indonesia',
      role: 'Cinephile',
    };

    // Try inserting into profiles table (non-blocking if table not yet created)
    try {
      await supabase.from('profiles').insert([
        {
          id: newProfile.id,
          name: newProfile.name,
          username: newProfile.username,
          avatar_url: newProfile.avatar_url,
          bio: newProfile.bio,
          location: newProfile.location,
          role: newProfile.role,
        },
      ]);
    } catch {
      // Ignore table creation error if RLS or table not ready
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('cinehearth_user', JSON.stringify(newProfile));
    }

    return { success: true, user: newProfile };
  } catch (err: any) {
    return { success: false, error: err.message || 'Terjadi kesalahan saat pendaftaran' };
  }
}

/**
 * Log in an existing user with Supabase Auth
 */
export async function signInUser(
  email: string,
  password: string
): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  if (!supabase) {
    // Check local storage fallback
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cinehearth_user');
      if (saved) {
        return { success: true, user: JSON.parse(saved) };
      }
    }
    return { success: false, error: 'Database Supabase belum terkonfigurasi' };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return { success: false, error: error.message };
    if (!data.user) return { success: false, error: 'Pengguna tidak ditemukan' };

    const rawAvatar = data.user.user_metadata?.avatar_url;
    const safeAvatar = (!rawAvatar || rawAvatar.includes('photo-1534528741775-53994a69daeb'))
      ? generateCinemaAvatar(data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'Cinephile')
      : rawAvatar;

    let profile: UserProfile = {
      id: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'Cinephile',
      username: data.user.user_metadata?.username || data.user.email?.split('@')[0] || 'user',
      avatar_url: safeAvatar,
      bio: data.user.user_metadata?.bio || 'Pencinta sinema dan penikmat film bioskop.',
      location: data.user.user_metadata?.location || 'Indonesia',
      role: 'Cinephile',
    };

    // Query profiles table for customized profile data
    try {
      const { data: profileRow } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profileRow) {
        let rowAvatar = profileRow.avatar_url || profile.avatar_url;
        if (!rowAvatar || rowAvatar.includes('photo-1534528741775-53994a69daeb')) {
          rowAvatar = generateCinemaAvatar(profileRow.name || profile.name);
        }
        profile = {
          ...profile,
          name: profileRow.name || profile.name,
          username: profileRow.username || profile.username,
          avatar_url: rowAvatar,
          bio: profileRow.bio || profile.bio,
          location: profileRow.location || profile.location,
          role: profileRow.role || profile.role,
        };
      }
    } catch {
      // Fallback to auth metadata
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('cinehearth_user', JSON.stringify(profile));
    }

    return { success: true, user: profile };
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal masuk ke akun' };
  }
}

/**
 * Sign out current user
 */
export async function signOutUser(): Promise<void> {
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch {}
  }
  if (typeof window !== 'undefined') {
    localStorage.removeItem('cinehearth_user');
  }
}

/**
 * Sign in using Google OAuth provider
 */
export async function signInWithGoogleOAuth(): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Database Supabase belum terkonfigurasi. Silakan lengkapi .env.local.' };
  }
  try {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: origin,
      },
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal memulai autentikasi Google' };
  }
}

/**
 * Get active user session on app launch
 */
export async function getActiveUserProfile(): Promise<UserProfile | null> {
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem('cinehearth_user');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed) {
          if (!parsed.avatar_url || parsed.avatar_url.includes('photo-1534528741775-53994a69daeb')) {
            parsed.avatar_url = generateCinemaAvatar(parsed.name || parsed.username || 'Cinephile');
            localStorage.setItem('cinehearth_user', JSON.stringify(parsed));
          }
          return parsed;
        }
      } catch {}
    }
  }

  if (!supabase) return null;

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session?.user) return null;

    const authUser = sessionData.session.user;
    const authAvatar = authUser.user_metadata?.avatar_url;
    const safeAuthAvatar = (!authAvatar || authAvatar.includes('photo-1534528741775-53994a69daeb'))
      ? generateCinemaAvatar(authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Cinephile')
      : authAvatar;

    let profile: UserProfile = {
      id: authUser.id,
      email: authUser.email,
      name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Cinephile',
      username: authUser.user_metadata?.username || authUser.email?.split('@')[0] || 'user',
      avatar_url: safeAuthAvatar,
      bio: authUser.user_metadata?.bio || 'Pencinta sinema dan penikmat film bioskop.',
      location: authUser.user_metadata?.location || 'Indonesia',
      role: 'Cinephile',
    };

    try {
      const { data: profileRow } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (profileRow) {
        let rowAvatar = profileRow.avatar_url || profile.avatar_url;
        if (!rowAvatar || rowAvatar.includes('photo-1534528741775-53994a69daeb')) {
          rowAvatar = generateCinemaAvatar(profileRow.name || profile.name);
        }
        profile = {
          ...profile,
          name: profileRow.name || profile.name,
          username: profileRow.username || profile.username,
          avatar_url: rowAvatar,
          bio: profileRow.bio || profile.bio,
          location: profileRow.location || profile.location,
        };
      }
    } catch {}

    if (typeof window !== 'undefined') {
      localStorage.setItem('cinehearth_user', JSON.stringify(profile));
    }

    return profile;
  } catch {
    return null;
  }
}

/**
 * Update user profile details
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<UserProfile>
): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  let updatedUser: UserProfile | null = null;

  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem('cinehearth_user');
    if (cached) {
      const current = JSON.parse(cached);
      updatedUser = { ...current, ...updates };
      localStorage.setItem('cinehearth_user', JSON.stringify(updatedUser));
    }
  }

  if (supabase) {
    try {
      const profilePayload: Record<string, any> = { id: userId };
      if (updates.name !== undefined) profilePayload.name = updates.name;
      if (updates.username !== undefined) profilePayload.username = updates.username;
      if (updates.bio !== undefined) profilePayload.bio = updates.bio;
      if (updates.location !== undefined) profilePayload.location = updates.location;
      if (updates.avatar_url !== undefined) profilePayload.avatar_url = updates.avatar_url;
      if (updates.banner_url !== undefined) profilePayload.banner_url = updates.banner_url;

      await supabase.from('profiles').upsert([profilePayload]);
      await supabase.auth.updateUser({
        data: {
          name: updates.name,
          username: updates.username,
          bio: updates.bio,
          location: updates.location,
          banner_url: updates.banner_url,
        },
      });
    } catch {}
  }

  return { success: true, user: updatedUser || undefined };
}

/**
 * Save a new film review / diary log into Supabase
 */
export async function saveMovieLogInDb(
  log: {
    filmId: string | number;
    filmTitle: string;
    filmYear: number;
    filmPoster: string;
    rating: number;
    reviewText?: string;
    watchedDate?: string;
    watchFormat?: string;
    isRewatch?: boolean;
    isFavorite?: boolean;
  },
  userId?: string
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    return { success: true };
  }

  try {
    const cleanTmdbId = typeof log.filmId === 'string'
      ? parseInt(log.filmId.replace('tmdb-', ''), 10) || 0
      : log.filmId;

    const payload = {
      user_id: userId || 'guest-user',
      tmdb_id: cleanTmdbId,
      film_title: log.filmTitle,
      film_year: log.filmYear,
      film_poster: log.filmPoster,
      rating: log.rating,
      review_text: log.reviewText || null,
      watched_date: log.watchedDate || new Date().toISOString().split('T')[0],
      watch_format: log.watchFormat || 'Digital',
      is_rewatch: Boolean(log.isRewatch),
      is_favorite: Boolean(log.isFavorite),
    };

    const { error } = await supabase.from('movie_logs').insert([payload]);

    if (error) {
      console.warn('Supabase log insert notice:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Sanitize movie poster URLs to official studio TMDB paths
 */
export function cleanPosterUrl(poster?: string, filmTitle?: string): string {
  if (!poster || poster.includes('aida-public') || poster.includes('lh3.googleusercontent.com')) {
    const titleLower = (filmTitle || '').toLowerCase();
    if (titleLower.includes('past lives')) {
      return 'https://image.tmdb.org/t/p/w780/k3waqVXSnvCZWfJYNtdamTgTtTA.jpg';
    } else if (titleLower.includes('perfect days')) {
      return 'https://image.tmdb.org/t/p/w780/tvUHVSTJV9ITON3oyHaWp7oaAc8.jpg';
    } else if (titleLower.includes('portrait')) {
      return 'https://image.tmdb.org/t/p/w780/rUDuOKpkKBHxx41BScqKej72iT3.jpg';
    } else if (titleLower.includes('mood for love')) {
      return 'https://image.tmdb.org/t/p/w780/iYypPT4bhqXfq1b6EnmxvRt6b2Y.jpg';
    } else if (titleLower.includes('before sunrise')) {
      return 'https://image.tmdb.org/t/p/w780/kf1Jb1c2JAOqjuzA3H4oDM263uB.jpg';
    } else if (titleLower.includes('aftersun')) {
      return 'https://image.tmdb.org/t/p/w780/evKz85EKouVbIr51zy5fOtpNRPg.jpg';
    } else if (titleLower.includes('decision to leave')) {
      return 'https://image.tmdb.org/t/p/w780/zI8KZ4EdLUymWKX1YEkpZ0gtPUa.jpg';
    } else if (titleLower.includes('drive my car')) {
      return 'https://image.tmdb.org/t/p/w780/znXps7wPyYq8UDCfeyO2vfEIeRS.jpg';
    } else if (titleLower.includes('chungking')) {
      return 'https://image.tmdb.org/t/p/w780/43I9DcNoCzpyzK8JCkJYpHqHqGG.jpg';
    } else if (titleLower.includes('paris, texas') || titleLower.includes('paris texas')) {
      return 'https://image.tmdb.org/t/p/w780/sP27Qm4THyRZyHjHYMfIDtJP6YE.jpg';
    } else {
      return 'https://image.tmdb.org/t/p/w780/k3waqVXSnvCZWfJYNtdamTgTtTA.jpg';
    }
  }
  return poster;
}

/**
 * Clean legacy poster URLs on logs
 */
function cleanMovieLog(log: MovieLog): MovieLog {
  return { ...log, film_poster: cleanPosterUrl(log.film_poster, log.film_title) };
}

/**
 * Fetch latest community movie logs from Supabase
 */
export async function getRecentLogsFromDb(): Promise<MovieLog[]> {
  if (!supabase) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('movie_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.warn('Supabase fetch logs notice:', error.message);
      return [];
    }
    return ((data as MovieLog[]) || []).map(cleanMovieLog);
  } catch {
    return [];
  }
}

/**
 * Fetch a specific user's movie logs
 */
export async function getUserLogsFromDb(userId: string): Promise<MovieLog[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('movie_logs')
      .select('*')
      .eq('user_id', userId)
      .order('watched_date', { ascending: false });

    if (error) return [];
    return ((data as MovieLog[]) || []).map(cleanMovieLog);
  } catch {
    return [];
  }
}

export interface WatchlistItem {
  id: string;
  user_id: string;
  tmdb_id: number;
  film_title: string;
  film_poster: string;
  created_at: string;
}

/**
 * Fetch a user's watchlist from Supabase (with localStorage caching)
 */
export async function getUserWatchlistFromDb(userId?: string): Promise<WatchlistItem[]> {
  if (userId && supabase) {
    try {
      const { data, error } = await supabase
        .from('watchlists')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        const cleaned = (data as WatchlistItem[]).map((item) => ({
          ...item,
          film_poster: cleanPosterUrl(item.film_poster, item.film_title),
        }));
        if (typeof window !== 'undefined') {
          localStorage.setItem(`cinehearth_watchlist_${userId}`, JSON.stringify(cleaned));
        }
        return cleaned;
      }
    } catch {}
  }

  // Fallback to localStorage
  if (typeof window !== 'undefined') {
    const key = userId ? `cinehearth_watchlist_${userId}` : 'cinehearth_watchlist_guest';
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((item: WatchlistItem) => ({
            ...item,
            film_poster: cleanPosterUrl(item.film_poster, item.film_title),
          }));
        }
      } catch {}
    }
  }

  return [];
}

/**
 * Toggle watchlist entry in Supabase and local cache
 */
export async function toggleWatchlistInDb(
  filmId: number,
  filmTitle: string,
  filmPoster: string,
  currentStatus: boolean,
  userId?: string
): Promise<boolean> {
  const targetUser = userId || 'guest-user';
  const newStatus = !currentStatus;

  // Local storage update for immediate responsiveness
  if (typeof window !== 'undefined') {
    const key = userId ? `cinehearth_watchlist_${userId}` : 'cinehearth_watchlist_guest';
    const saved = localStorage.getItem(key);
    let items: WatchlistItem[] = saved ? JSON.parse(saved) : [];
    if (currentStatus) {
      items = items.filter((item) => item.tmdb_id !== filmId);
    } else {
      items = [
        {
          id: `w-${Date.now()}`,
          user_id: targetUser,
          tmdb_id: filmId,
          film_title: filmTitle,
          film_poster: filmPoster,
          created_at: new Date().toISOString(),
        },
        ...items,
      ];
    }
    localStorage.setItem(key, JSON.stringify(items));
  }

  if (!supabase) return newStatus;

  try {
    if (currentStatus) {
      await supabase
        .from('watchlists')
        .delete()
        .eq('user_id', targetUser)
        .eq('tmdb_id', filmId);
      return false;
    } else {
      await supabase.from('watchlists').upsert([
        {
          user_id: targetUser,
          tmdb_id: filmId,
          film_title: filmTitle,
          film_poster: filmPoster,
        },
      ]);
      return true;
    }
  } catch {
    return newStatus;
  }
}

// =============================================================================
// CUSTOM LISTS (Community & Personal Curated Lists)
// =============================================================================

export async function getCustomLists(userId?: string): Promise<CustomList[]> {
  let localLists: CustomList[] = [];
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem('cinehearth_custom_lists');
      if (cached) {
        localLists = JSON.parse(cached);
      }
    } catch {}
  }

  if (!supabase) {
    if (userId) return localLists.filter((l) => l.user_id === userId);
    return localLists;
  }

  try {
    let query = supabase
      .from('custom_lists')
      .select('*, custom_list_films(*)')
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    } else {
      query = query.eq('is_private', false);
    }

    const { data, error } = await query;
    if (error || !data) return localLists;

    const dbLists: CustomList[] = data.map((item: any) => ({
      id: item.id,
      user_id: item.user_id,
      user_name: item.user_name || 'Kurator Film',
      user_username: item.user_username || 'cinephile',
      user_avatar: getSafeAvatar(item.user_avatar, item.user_name || 'Cinephile'),
      title: item.title,
      description: item.description || '',
      is_private: item.is_private,
      likes_count: item.likes_count || 0,
      created_at: item.created_at,
      films: Array.isArray(item.custom_list_films)
        ? item.custom_list_films.map((f: any) => ({
            id: f.id,
            list_id: f.list_id,
            tmdb_id: f.tmdb_id,
            film_title: f.film_title,
            film_year: f.film_year,
            film_poster: cleanPosterUrl(f.film_poster, f.film_title),
            film_rating: Number(f.film_rating || 4.0),
          }))
        : [],
    }));

    // Merge and deduplicate with localLists
    const map = new Map<string, CustomList>();
    for (const l of [...dbLists, ...localLists]) {
      if (!map.has(l.id)) map.set(l.id, l);
    }
    return Array.from(map.values());
  } catch {
    return localLists;
  }
}

export async function createCustomList(
  listData: {
    title: string;
    description: string;
    is_private?: boolean;
    films: {
      tmdb_id: number;
      film_title: string;
      film_year: number;
      film_poster: string;
      film_rating: number;
    }[];
  },
  user: UserProfile
): Promise<{ success: boolean; list?: CustomList; error?: string }> {
  const listId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `list-${Date.now()}`;
  const now = new Date().toISOString();

  const newList: CustomList = {
    id: listId,
    user_id: user.id,
    user_name: user.name,
    user_username: user.username,
    user_avatar: getSafeAvatar(user.avatar_url, user.name),
    title: listData.title,
    description: listData.description,
    is_private: Boolean(listData.is_private),
    likes_count: 0,
    created_at: now,
    films: listData.films.map((f, idx) => ({
      id: `${listId}-${idx}`,
      list_id: listId,
      tmdb_id: f.tmdb_id,
      film_title: f.film_title,
      film_year: f.film_year,
      film_poster: cleanPosterUrl(f.film_poster, f.film_title),
      film_rating: f.film_rating,
    })),
  };

  // Cache in localStorage
  if (typeof window !== 'undefined') {
    try {
      const existing = localStorage.getItem('cinehearth_custom_lists');
      const parsed: CustomList[] = existing ? JSON.parse(existing) : [];
      localStorage.setItem('cinehearth_custom_lists', JSON.stringify([newList, ...parsed]));
    } catch {}
  }

  if (supabase) {
    try {
      await supabase.from('custom_lists').insert([
        {
          id: listId,
          user_id: user.id,
          title: listData.title,
          description: listData.description,
          is_private: Boolean(listData.is_private),
          likes_count: 0,
        },
      ]);

      if (listData.films.length > 0) {
        await supabase.from('custom_list_films').insert(
          listData.films.map((f) => ({
            list_id: listId,
            tmdb_id: f.tmdb_id,
            film_title: f.film_title,
            film_year: f.film_year,
            film_poster: f.film_poster,
            film_rating: f.film_rating,
          }))
        );
      }
    } catch (e) {
      console.warn('Supabase custom list save error:', e);
    }
  }

  return { success: true, list: newList };
}

export async function deleteCustomList(listId: string): Promise<boolean> {
  if (typeof window !== 'undefined') {
    try {
      const existing = localStorage.getItem('cinehearth_custom_lists');
      if (existing) {
        const parsed: CustomList[] = JSON.parse(existing);
        localStorage.setItem(
          'cinehearth_custom_lists',
          JSON.stringify(parsed.filter((l) => l.id !== listId))
        );
      }
    } catch {}
  }

  if (supabase) {
    try {
      await supabase.from('custom_lists').delete().eq('id', listId);
    } catch {}
  }
  return true;
}

// =============================================================================
// REVIEW COMMENTS & DISCUSSIONS
// =============================================================================

export async function getReviewComments(reviewId: string): Promise<ReviewComment[]> {
  let localComments: ReviewComment[] = [];
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(`cinehearth_comments_${reviewId}`);
      if (cached) localComments = JSON.parse(cached);
    } catch {}
  }

  if (!supabase) return localComments;

  try {
    const { data, error } = await supabase
      .from('review_comments')
      .select('*')
      .eq('review_id', reviewId)
      .order('created_at', { ascending: true });

    if (error || !data) return localComments;

    const dbComments: ReviewComment[] = data.map((c: any) => ({
      id: c.id,
      review_id: c.review_id,
      user_id: c.user_id,
      user_name: c.user_name,
      user_username: c.user_username,
      user_avatar: getSafeAvatar(c.user_avatar, c.user_name),
      comment_text: c.comment_text,
      created_at: c.created_at,
    }));

    // Merge and deduplicate
    const map = new Map<string, ReviewComment>();
    for (const c of [...localComments, ...dbComments]) {
      map.set(c.id, c);
    }
    return Array.from(map.values());
  } catch {
    return localComments;
  }
}

export async function addReviewComment(
  commentData: { review_id: string; comment_text: string },
  user: UserProfile
): Promise<{ success: boolean; comment?: ReviewComment }> {
  const commentId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `comment-${Date.now()}`;
  const now = new Date().toISOString();

  const newComment: ReviewComment = {
    id: commentId,
    review_id: commentData.review_id,
    user_id: user.id,
    user_name: user.name,
    user_username: user.username,
    user_avatar: getSafeAvatar(user.avatar_url, user.name),
    comment_text: commentData.comment_text,
    created_at: now,
  };

  // Cache in localStorage
  if (typeof window !== 'undefined') {
    try {
      const existing = localStorage.getItem(`cinehearth_comments_${commentData.review_id}`);
      const parsed: ReviewComment[] = existing ? JSON.parse(existing) : [];
      localStorage.setItem(
        `cinehearth_comments_${commentData.review_id}`,
        JSON.stringify([...parsed, newComment])
      );
    } catch {}
  }

  if (supabase) {
    try {
      await supabase.from('review_comments').insert([
        {
          id: commentId,
          review_id: commentData.review_id,
          user_id: user.id,
          user_name: user.name,
          user_username: user.username,
          user_avatar: user.avatar_url,
          comment_text: commentData.comment_text,
        },
      ]);
    } catch {}
  }

  return { success: true, comment: newComment };
}

// =============================================================================
// ACTIVITY NOTIFICATIONS
// =============================================================================

export async function getUserNotifications(userId?: string): Promise<AppNotification[]> {
  const targetId = userId || 'guest';
  let localNotifs: AppNotification[] = [];

  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(`cinehearth_notifs_${targetId}`);
      if (cached) {
        localNotifs = JSON.parse(cached);
      } else {
        // Seed default initial welcome activity
        localNotifs = [
          {
            id: 'init-1',
            user_id: targetId,
            title: 'Selamat Datang di CineHearth',
            message: 'Mulai catat film favorit, kumpulkan karcis bioskop, dan bagikan ulasan Anda ke komunitas.',
            type: 'system',
            is_read: false,
            created_at: new Date().toISOString(),
          },
          {
            id: 'init-2',
            user_id: targetId,
            title: 'Katalog Bioskop 2026 Tersedia',
            message: 'Jelajahi film-film terbaru dan film festival pilihan di tab Discover.',
            type: 'system',
            is_read: false,
            created_at: new Date(Date.now() - 3600000).toISOString(),
          },
        ];
        localStorage.setItem(`cinehearth_notifs_${targetId}`, JSON.stringify(localNotifs));
      }
    } catch {}
  }

  if (!supabase || targetId === 'guest') return localNotifs;

  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', targetId)
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) return localNotifs;

    const dbNotifs: AppNotification[] = data.map((n: any) => ({
      id: n.id,
      user_id: n.user_id,
      title: n.title,
      message: n.message,
      type: n.type,
      is_read: n.is_read,
      created_at: n.created_at,
    }));

    const map = new Map<string, AppNotification>();
    for (const n of [...dbNotifs, ...localNotifs]) {
      map.set(n.id, n);
    }
    return Array.from(map.values());
  } catch {
    return localNotifs;
  }
}

export async function markNotificationsAsRead(userId?: string): Promise<void> {
  const targetId = userId || 'guest';
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(`cinehearth_notifs_${targetId}`);
      if (cached) {
        const parsed: AppNotification[] = JSON.parse(cached);
        const updated = parsed.map((n) => ({ ...n, is_read: true }));
        localStorage.setItem(`cinehearth_notifs_${targetId}`, JSON.stringify(updated));
      }
    } catch {}
  }

  if (supabase && targetId !== 'guest') {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', targetId);
    } catch {}
  }
}

export async function addNotification(notif: {
  user_id: string;
  title: string;
  message: string;
  type?: 'like' | 'comment' | 'watchlist' | 'system';
}): Promise<void> {
  const notifId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `notif-${Date.now()}`;
  const newNotif: AppNotification = {
    id: notifId,
    user_id: notif.user_id,
    title: notif.title,
    message: notif.message,
    type: notif.type || 'system',
    is_read: false,
    created_at: new Date().toISOString(),
  };

  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(`cinehearth_notifs_${notif.user_id}`);
      const parsed: AppNotification[] = cached ? JSON.parse(cached) : [];
      localStorage.setItem(
        `cinehearth_notifs_${notif.user_id}`,
        JSON.stringify([newNotif, ...parsed])
      );
    } catch {}
  }

  if (supabase && notif.user_id !== 'guest') {
    try {
      await supabase.from('notifications').insert([
        {
          id: notifId,
          user_id: notif.user_id,
          title: notif.title,
          message: notif.message,
          type: notif.type || 'system',
          is_read: false,
        },
      ]);
    } catch {}
  }
}

// =============================================================================
// PUBLIC MEMBER PROFILE QUERY
// =============================================================================

export async function getPublicUserProfile(userIdOrUsername: string): Promise<{
  profile: UserProfile;
  logs: MovieLog[];
  favorites: any[];
} | null> {
  // If it matches active user in localStorage
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem('cinehearth_user');
      if (cached) {
        const user: UserProfile = JSON.parse(cached);
        if (user.id === userIdOrUsername || user.username === userIdOrUsername) {
          const logs = await getUserLogsFromDb(user.id);
          const rawTop4 = localStorage.getItem(`cinehearth_top4_${user.id}`);
          const top4 = rawTop4 ? JSON.parse(rawTop4) : [];
          return { profile: user, logs, favorites: top4 };
        }
      }
    } catch {}
  }

  if (supabase) {
    try {
      const isUuid = userIdOrUsername.includes('-');
      const query = supabase.from('profiles').select('*');
      const { data: profileRow } = isUuid
        ? await query.eq('id', userIdOrUsername).maybeSingle()
        : await query.eq('username', userIdOrUsername).maybeSingle();

      if (profileRow) {
        const profile: UserProfile = {
          id: profileRow.id,
          username: profileRow.username,
          name: profileRow.name,
          avatar_url: getSafeAvatar(profileRow.avatar_url, profileRow.name),
          bio: profileRow.bio || 'Pencinta sinema di CineHearth.',
          location: profileRow.location || 'Indonesia',
          role: profileRow.role || 'Cinephile',
        };
        const logs = await getUserLogsFromDb(profile.id);
        return { profile, logs, favorites: [] };
      }
    } catch {}
  }

  // Fallback profile representation for anonymous community reviews
  return {
    profile: {
      id: userIdOrUsername,
      name: 'Penikmat Sinema',
      username: userIdOrUsername.replace(/[^a-z0-9]/gi, '').toLowerCase() || 'cinephile',
      avatar_url: generateCinemaAvatar(userIdOrUsername),
      bio: 'Anggota komunitas CineHearth penikmat film bioskop.',
      location: 'Indonesia',
      role: 'Cinephile',
    },
    logs: [],
    favorites: [],
  };
}

// =============================================================================
// REALTIME WEBSOCKET DIRECT MESSAGES / CHAT
// =============================================================================

function getChatKey(userA: string, userB: string): string {
  return `cinehearth_dm_${[userA, userB].sort().join('_')}`;
}

/**
 * Fetch messages between two users (from local cache and Supabase)
 */
export async function getDirectMessages(
  currentUserId: string,
  targetUserId: string
): Promise<DirectMessage[]> {
  const chatKey = getChatKey(currentUserId, targetUserId);
  let localMessages: DirectMessage[] = [];

  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(chatKey);
      if (saved) localMessages = JSON.parse(saved);
    } catch {}
  }

  if (!supabase) return localMessages;

  try {
    const { data, error } = await supabase
      .from('direct_messages')
      .select('*')
      .or(
        `and(sender_id.eq.${currentUserId},receiver_id.eq.${targetUserId}),and(sender_id.eq.${targetUserId},receiver_id.eq.${currentUserId})`
      )
      .order('created_at', { ascending: true });

    if (error || !data) return localMessages;

    const dbMessages: DirectMessage[] = data.map((m: any) => ({
      id: m.id,
      sender_id: m.sender_id,
      sender_name: m.sender_name,
      sender_avatar: getSafeAvatar(m.sender_avatar, m.sender_name),
      receiver_id: m.receiver_id,
      receiver_name: m.receiver_name,
      receiver_avatar: getSafeAvatar(m.receiver_avatar, m.receiver_name),
      message: m.message,
      film_attachment: m.film_attachment ? (typeof m.film_attachment === 'string' ? JSON.parse(m.film_attachment) : m.film_attachment) : null,
      is_read: m.is_read,
      created_at: m.created_at,
    }));

    // Merge and deduplicate by id
    const map = new Map<string, DirectMessage>();
    for (const m of [...localMessages, ...dbMessages]) {
      map.set(m.id, m);
    }
    const merged = Array.from(map.values()).sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(chatKey, JSON.stringify(merged));
      } catch {}
    }

    return merged;
  } catch {
    return localMessages;
  }
}

/**
 * Send a direct message with optional movie recommendation attachment
 */
export async function sendDirectMessage(params: {
  sender: UserProfile;
  receiver_id: string;
  receiver_name: string;
  receiver_avatar?: string;
  message: string;
  film_attachment?: FilmAttachment | null;
}): Promise<{ success: boolean; message?: DirectMessage; error?: string }> {
  const msgId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `msg-${Date.now()}`;
  const now = new Date().toISOString();

  const newMsg: DirectMessage = {
    id: msgId,
    sender_id: params.sender.id,
    sender_name: params.sender.name,
    sender_avatar: params.sender.avatar_url,
    receiver_id: params.receiver_id,
    receiver_name: params.receiver_name,
    receiver_avatar: params.receiver_avatar,
    message: params.message.trim(),
    film_attachment: params.film_attachment || null,
    is_read: false,
    created_at: now,
  };

  // 1. Local caching and multi-tab broadcast
  if (typeof window !== 'undefined') {
    try {
      const chatKey = getChatKey(params.sender.id, params.receiver_id);
      const saved = localStorage.getItem(chatKey);
      const list: DirectMessage[] = saved ? JSON.parse(saved) : [];
      localStorage.setItem(chatKey, JSON.stringify([...list, newMsg]));

      if ('BroadcastChannel' in window) {
        const bc = new BroadcastChannel('cinehearth_realtime_chat');
        bc.postMessage(newMsg);
        bc.close();
      }
    } catch {}
  }

  // 2. Realtime WebSocket Broadcast & Database Insertion
  if (supabase) {
    try {
      // Broadcast over websocket channel for instant live delivery
      const chatChannel = supabase.channel(`dm_chat_${params.receiver_id}`);
      chatChannel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          chatChannel.send({
            type: 'broadcast',
            event: 'new_message',
            payload: newMsg,
          });
        }
      });

      // Save in PostgreSQL
      await supabase.from('direct_messages').insert([
        {
          id: newMsg.id,
          sender_id: newMsg.sender_id,
          sender_name: newMsg.sender_name,
          sender_avatar: newMsg.sender_avatar,
          receiver_id: newMsg.receiver_id,
          receiver_name: newMsg.receiver_name,
          receiver_avatar: newMsg.receiver_avatar,
          message: newMsg.message,
          film_attachment: newMsg.film_attachment ? JSON.stringify(newMsg.film_attachment) : null,
          is_read: false,
        },
      ]);
    } catch (e) {
      console.warn('Supabase direct message error:', e);
    }
  }

  return { success: true, message: newMsg };
}

/**
 * Real-time WebSocket subscription for incoming direct messages
 */
export function subscribeToRealtimeChat(
  currentUserId: string,
  onMessageReceived: (message: DirectMessage) => void
): () => void {
  // 1. Local multi-tab BroadcastChannel fallback
  let bc: BroadcastChannel | null = null;
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    try {
      bc = new BroadcastChannel('cinehearth_realtime_chat');
      bc.onmessage = (event) => {
        const msg = event.data as DirectMessage;
        if (msg && (msg.receiver_id === currentUserId || msg.sender_id === currentUserId)) {
          onMessageReceived(msg);
        }
      };
    } catch {}
  }

  // 2. Supabase Realtime WebSocket channel
  if (!supabase) {
    return () => {
      if (bc) bc.close();
    };
  }

  const channelName = `dm_chat_${currentUserId}`;
  const channel = supabase.channel(channelName, {
    config: {
      broadcast: { self: false },
    },
  });

  channel.on('broadcast', { event: 'new_message' }, (payload) => {
    const msg = payload.payload as DirectMessage;
    if (msg && (msg.receiver_id === currentUserId || msg.sender_id === currentUserId)) {
      onMessageReceived(msg);
    }
  });

  channel.on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'direct_messages',
      filter: `receiver_id=eq.${currentUserId}`,
    },
    (payload) => {
      onMessageReceived(payload.new as DirectMessage);
    }
  );

  channel.subscribe();

  return () => {
    if (channel) supabase.removeChannel(channel);
    if (bc) bc.close();
  };
}

// =============================================================================
// JOURNAL ESSAYS & CRITIQUE
// =============================================================================

export async function getJournalEssays(): Promise<JournalEssay[]> {
  let localEssays: JournalEssay[] = [];
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('cinehearth_journal_essays');
      if (saved) localEssays = JSON.parse(saved);
    } catch {}
  }

  if (!supabase) return localEssays;

  try {
    const { data, error } = await supabase
      .from('journal_essays')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return localEssays;

    const dbEssays: JournalEssay[] = data.map((d: any) => ({
      id: d.id,
      user_id: d.user_id,
      author_name: d.author_name,
      author_avatar: getSafeAvatar(d.author_avatar, d.author_name),
      author_role: d.author_role || 'Cinephile Critic',
      title: d.title,
      subtitle: d.subtitle || '',
      film_subject: d.film_subject,
      read_time: d.read_time || '5 min read',
      lead_paragraph: d.lead_paragraph,
      body_text: d.body_text,
      pull_quote: d.pull_quote,
      cover_image: d.cover_image,
      created_at: d.created_at,
    }));

    const map = new Map<string, JournalEssay>();
    for (const e of [...localEssays, ...dbEssays]) {
      map.set(e.id, e);
    }
    return Array.from(map.values());
  } catch {
    return localEssays;
  }
}

export async function createJournalEssay(
  essayData: Omit<JournalEssay, 'id' | 'created_at'>
): Promise<{ success: boolean; essay?: JournalEssay; error?: string }> {
  const essayId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `essay-${Date.now()}`;
  const now = new Date().toISOString();

  const newEssay: JournalEssay = {
    ...essayData,
    id: essayId,
    created_at: now,
  };

  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('cinehearth_journal_essays');
      const list: JournalEssay[] = saved ? JSON.parse(saved) : [];
      localStorage.setItem('cinehearth_journal_essays', JSON.stringify([newEssay, ...list]));
    } catch {}
  }

  if (supabase) {
    try {
      await supabase.from('journal_essays').insert([newEssay]);
    } catch (e) {
      console.warn('Supabase journal essay save error:', e);
    }
  }

  return { success: true, essay: newEssay };
}


