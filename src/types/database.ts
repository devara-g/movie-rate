export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          name: string;
          avatar_url: string | null;
          bio: string | null;
          location: string | null;
          role: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          username: string;
          name: string;
          avatar_url?: string | null;
          bio?: string | null;
          location?: string | null;
          role?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          name?: string;
          avatar_url?: string | null;
          bio?: string | null;
          location?: string | null;
          role?: string | null;
          created_at?: string;
        };
      };
      movie_logs: {
        Row: {
          id: string;
          user_id: string;
          tmdb_id: number;
          film_title: string;
          film_year: number;
          film_poster: string;
          rating: number;
          review_text: string | null;
          watched_date: string;
          watch_format: string;
          is_rewatch: boolean;
          is_favorite: boolean;
          likes_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tmdb_id: number;
          film_title: string;
          film_year: number;
          film_poster: string;
          rating: number;
          review_text?: string | null;
          watched_date?: string;
          watch_format?: string;
          is_rewatch?: boolean;
          is_favorite?: boolean;
          likes_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          tmdb_id?: number;
          film_title?: string;
          film_year?: number;
          film_poster?: string;
          rating?: number;
          review_text?: string | null;
          watched_date?: string;
          watch_format?: string;
          is_rewatch?: boolean;
          is_favorite?: boolean;
          likes_count?: number;
          created_at?: string;
        };
      };
      watchlists: {
        Row: {
          id: string;
          user_id: string;
          tmdb_id: number;
          film_title: string;
          film_poster: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tmdb_id: number;
          film_title: string;
          film_poster: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          tmdb_id?: number;
          film_title?: string;
          film_poster?: string;
          created_at?: string;
        };
      };
    };
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type MovieLog = Database['public']['Tables']['movie_logs']['Row'];
export type WatchlistEntry = Database['public']['Tables']['watchlists']['Row'];

export interface CustomList {
  id: string;
  user_id: string;
  user_name?: string;
  user_username?: string;
  user_avatar?: string;
  title: string;
  description: string;
  is_private: boolean;
  likes_count: number;
  created_at: string;
  films?: CustomListFilm[];
}

export interface CustomListFilm {
  id: string;
  list_id: string;
  tmdb_id: number;
  film_title: string;
  film_year: number;
  film_poster: string;
  film_rating: number;
  created_at?: string;
}

export interface ReviewComment {
  id: string;
  review_id: string;
  user_id: string;
  user_name: string;
  user_username: string;
  user_avatar?: string;
  comment_text: string;
  created_at: string;
}

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'like' | 'comment' | 'watchlist' | 'system';
  is_read: boolean;
  created_at: string;
}

export interface WatchProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
  display_priority?: number;
}

export interface WatchProviderResults {
  link?: string;
  flatrate?: WatchProvider[];
  rent?: WatchProvider[];
  buy?: WatchProvider[];
}

export interface FilmAttachment {
  tmdb_id: number;
  film_title: string;
  film_poster: string;
  film_year?: string | number;
  rating?: number;
}

export interface DirectMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar?: string;
  receiver_id: string;
  receiver_name: string;
  receiver_avatar?: string;
  message: string;
  film_attachment?: FilmAttachment | null;
  is_read?: boolean;
  created_at: string;
  sender_profile?: {
    display_name: string;
    username: string;
    avatar_url: string;
  };
  recipient_id?: string;
}

export interface ChatConversation {
  userId: string;
  userName: string;
  userAvatar?: string;
  userUsername?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export interface JournalEssay {
  id: string;
  user_id: string;
  author_name: string;
  author_avatar?: string;
  author_username?: string;
  author_role?: string;
  title: string;
  subtitle: string;
  film_subject: string;
  read_time: string;
  lead_paragraph: string;
  body_text: string;
  body_sections?: {
    heading?: string;
    text: string;
    pullQuote?: string;
  }[];
  pull_quote?: string;
  cover_image?: string;
  created_at: string;
}
