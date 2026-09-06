export interface Film {
  id: string;
  title: string;
  originalTitle?: string;
  year: number;
  director: string;
  cinematographer: string;
  runtime: number; // in minutes
  rating: number; // e.g. 4.6
  ratingCount: number;
  genres: string[];
  aspectRatio: string;
  filmStock: string;
  distribution: string;
  tagline: string;
  synopsis: string;
  posterUrl: string;
  backdropUrl: string;
  moods: string[];
  certifiedMasterwork?: boolean;
  scoreDistribution: number[]; // 10 bins: 0.5 to 5.0
  logsCount: number;
  lovesCount: number;
  cast: { name: string; role: string }[];
}

export interface Review {
  id: string;
  filmId: string;
  filmTitle: string;
  filmYear: number;
  filmPoster: string;
  authorName: string;
  authorRole: string;
  authorAvatar: string;
  rating: number;
  date: string;
  formatWatched: string;
  isRewatch: boolean;
  isFavorite: boolean;
  content: string;
  pullQuote?: string;
  likes: number;
  replies: number;
  hasSpoilers?: boolean;
}

export interface CuratedList {
  id: string;
  title: string;
  description: string;
  curator: string;
  curatorAvatar: string;
  filmCount: number;
  likesCount: number;
  films: Film[];
}

export interface Essay {
  id: string;
  title: string;
  subtitle: string;
  author: string;
  authorRole: string;
  authorAvatar: string;
  readTime: string;
  publishedDate: string;
  coverImage: string;
  filmSubject: string;
  leadParagraph: string;
  bodySections: {
    heading?: string;
    text: string;
    pullQuote?: string;
    stillImage?: string;
    caption?: string;
  }[];
}

export interface UserProfile {
  name: string;
  username: string;
  role: string;
  location: string;
  bio: string;
  avatarUrl: string;
  headerBackdropUrl: string;
  stats: {
    filmsLogged: number;
    hoursWatched: number;
    listsCreated: number;
    reviewsWritten: number;
    averageRating: number;
    favoriteDirector: string;
  };
  topFourFilms: Film[];
  recentLogs: {
    filmId: string;
    filmTitle: string;
    filmYear: number;
    filmPoster: string;
    rating: number;
    date: string;
    format: string;
    isFavorite: boolean;
  }[];
}

// Curated cinematic dataset
export const FILMS: Film[] = [
  {
    id: "past-lives",
    title: "Past Lives",
    originalTitle: "인연 (In-Yun)",
    year: 2023,
    director: "Celine Song",
    cinematographer: "Shabier Kirchner",
    runtime: 106,
    rating: 4.6,
    ratingCount: 38412,
    genres: ["Drama", "Romance"],
    aspectRatio: "1.85:1",
    filmStock: "35mm Kodak Vision3 500T",
    distribution: "A24 / CJ ENM",
    tagline: "Destiny is a bridge between who we were and who we become.",
    synopsis:
      "Nora and Hae Sung, two deeply connected childhood friends, are wrest apart after Nora's family emigrates from South Korea. Two decades later, they are reunited in New York for one fateful week as they confront notions of destiny, love, and the choices that make a life.",
    posterUrl:
      "https://image.tmdb.org/t/p/w780/k3waqVXSnvCZWfJYNtdamTgTtTA.jpg",
    backdropUrl:
      "https://image.tmdb.org/t/p/w1280/7HR38hMBl23lf38MAN63y4pKsHz.jpg",
    moods: ["trending", "melancholy", "golden-hour"],
    certifiedMasterwork: true,
    scoreDistribution: [184, 320, 680, 1420, 3100, 5820, 8900, 11400, 16200, 24800],
    logsCount: 14280,
    lovesCount: 8940,
    cast: [
      { name: "Greta Lee", role: "Nora Moon" },
      { name: "Teo Yoo", role: "Hae Sung" },
      { name: "John Magaro", role: "Arthur Zaturansky" },
      { name: "Ji Hye Yoon", role: "Nora's Mother" },
    ],
  },
  {
    id: "perfect-days",
    title: "Perfect Days",
    originalTitle: "PERFECT DAYS",
    year: 2023,
    director: "Wim Wenders",
    cinematographer: "Franz Lustig",
    runtime: 124,
    rating: 4.8,
    ratingCount: 29540,
    genres: ["Drama"],
    aspectRatio: "1.33:1 (4:3 Academy)",
    filmStock: "Sony Venice (Vintage Zeiss Superspeeds)",
    distribution: "Neon / Master Mind",
    tagline: "Komorebi: the sunlight filtering through leaves in the wind.",
    synopsis:
      "Hirayama works as a cleaner of public toilets in Tokyo. He seems entirely content with his simple, structured everyday life. Beyond his structured routine, he cherishes his passion for music on cassette tapes, classic literature in paperbacks, and photographing trees.",
    posterUrl:
      "https://image.tmdb.org/t/p/w780/tvUHVSTJV9ITON3oyHaWp7oaAc8.jpg",
    backdropUrl:
      "https://image.tmdb.org/t/p/w1280/hjWxngV6tidwDkfJDEgMjHD2KEz.jpg",
    moods: ["trending", "cozy", "gems"],
    certifiedMasterwork: true,
    scoreDistribution: [80, 150, 420, 980, 2100, 4500, 7200, 9800, 14500, 21300],
    logsCount: 18450,
    lovesCount: 12400,
    cast: [
      { name: "Koji Yakusho", role: "Hirayama" },
      { name: "Tokio Emoto", role: "Takashi" },
      { name: "Arisa Nakano", role: "Niko" },
      { name: "Sayuri Ishikawa", role: "Mama" },
    ],
  },
  {
    id: "portrait-of-a-lady-on-fire",
    title: "Portrait of a Lady on Fire",
    originalTitle: "Portrait de la jeune fille en feu",
    year: 2019,
    director: "Céline Sciamma",
    cinematographer: "Claire Mathon",
    runtime: 122,
    rating: 4.7,
    ratingCount: 42100,
    genres: ["Drama", "Romance", "History"],
    aspectRatio: "1.85:1",
    filmStock: "RED Monstro 8K (Custom 18th-century LUTs)",
    distribution: "Pyramide / Neon",
    tagline: "Do all lovers feel like they are inventing something?",
    synopsis:
      "On an isolated island in Brittany at the end of the eighteenth century, Marianne, a painter, is commissioned to do the wedding portrait of Héloïse, a young woman who has just left the convent. Marianne must paint her without her knowing.",
    posterUrl:
      "https://image.tmdb.org/t/p/w780/rUDuOKpkKBHxx41BScqKej72iT3.jpg",
    backdropUrl:
      "https://image.tmdb.org/t/p/w1280/ivJ5UzT6IzucLVfbZwCCwiJJoBz.jpg",
    moods: ["melancholy", "golden-hour"],
    certifiedMasterwork: true,
    scoreDistribution: [110, 210, 500, 1100, 2800, 5200, 8400, 12600, 18900, 29000],
    logsCount: 22100,
    lovesCount: 16800,
    cast: [
      { name: "Noémie Merlant", role: "Marianne" },
      { name: "Adèle Haenel", role: "Héloïse" },
      { name: "Luàna Bajrami", role: "Sophie" },
      { name: "Valeria Golino", role: "The Countess" },
    ],
  },
  {
    id: "in-the-mood-for-love",
    title: "In the Mood for Love",
    originalTitle: "花樣年華",
    year: 2000,
    director: "Wong Kar-wai",
    cinematographer: "Christopher Doyle & Mark Lee Ping-bin",
    runtime: 98,
    rating: 4.8,
    ratingCount: 54200,
    genres: ["Drama", "Romance"],
    aspectRatio: "1.66:1",
    filmStock: "35mm Kodak Vision 500T",
    distribution: "Block 2 Pictures / Criterion",
    tagline: "He remembers those vanished years. As though looking through a dusty window pane, the past something he could see, but not touch.",
    synopsis:
      "In 1962 Hong Kong, two neighbors, a journalist and a shipping company secretary, form a bond after discovering their respective spouses are having an extramarital affair together. They agree to keep their bond platonic so as not to commit the same wrong.",
    posterUrl:
      "https://image.tmdb.org/t/p/w780/iYypPT4bhqXfq1b6EnmxvRt6b2Y.jpg",
    backdropUrl:
      "https://image.tmdb.org/t/p/w1280/ffQFnAUm2Uu4RU0nijpjPRf9TBT.jpg",
    moods: ["cozy", "melancholy"],
    certifiedMasterwork: true,
    scoreDistribution: [90, 140, 310, 840, 1800, 3900, 6800, 11200, 19500, 34000],
    logsCount: 31200,
    lovesCount: 24900,
    cast: [
      { name: "Tony Leung Chiu-wai", role: "Chow Mo-wan" },
      { name: "Maggie Cheung", role: "Su Li-zhen" },
      { name: "Rebecca Pan", role: "Mrs. Suen" },
      { name: "Lai Chin", role: "Mr. Koo" },
    ],
  },
  {
    id: "before-sunrise",
    title: "Before Sunrise",
    year: 1995,
    director: "Richard Linklater",
    cinematographer: "Lee Daniel",
    runtime: 101,
    rating: 4.7,
    ratingCount: 39800,
    genres: ["Drama", "Romance"],
    aspectRatio: "1.85:1",
    filmStock: "35mm Eastman EXR 500T",
    distribution: "Columbia Pictures",
    tagline: "Can the greatest romance of your life last only one night?",
    synopsis:
      "A young man and an ambitious French student meet on a train in Europe, and wind up spending one evening together in Vienna. Unfortunately, both know that this will probably be their only night together.",
    posterUrl:
      "https://image.tmdb.org/t/p/w780/kf1Jb1c2JAOqjuzA3H4oDM263uB.jpg",
    backdropUrl:
      "https://image.tmdb.org/t/p/w1280/qA2TyqPldTtoTVY3LKrNIG5g6bH.jpg",
    moods: ["cozy", "golden-hour"],
    certifiedMasterwork: true,
    scoreDistribution: [120, 190, 480, 1200, 2600, 5100, 8200, 11800, 17200, 26400],
    logsCount: 24500,
    lovesCount: 18900,
    cast: [
      { name: "Ethan Hawke", role: "Jesse" },
      { name: "Julie Delpy", role: "Céline" },
      { name: "Andrea Eckert", role: "Wife on Train" },
      { name: "Hanno Pöschl", role: "Husband on Train" },
    ],
  },
  {
    id: "aftersun",
    title: "Aftersun",
    year: 2022,
    director: "Charlotte Wells",
    cinematographer: "Gregory Oke",
    runtime: 102,
    rating: 4.6,
    ratingCount: 31200,
    genres: ["Drama"],
    aspectRatio: "1.85:1 (with MiniDV archival inserts)",
    filmStock: "35mm Arricam LT & MiniDV",
    distribution: "A24 / MUBI",
    tagline: "Memory is an ocean of reflections you can never quite touch.",
    synopsis:
      "Sophie reflects on the shared joy and private melancholy of a holiday she took with her father twenty years earlier. Memories real and imagined fill the gaps between MiniDV footage as she tries to reconcile the father she knew with the man she didn't.",
    posterUrl:
      "https://image.tmdb.org/t/p/w780/evKz85EKouVbIr51zy5fOtpNRPg.jpg",
    backdropUrl:
      "https://image.tmdb.org/t/p/w1280/4jdduww9j5RyzO4ITRcuBFhqNN1.jpg",
    moods: ["melancholy", "gems"],
    certifiedMasterwork: true,
    scoreDistribution: [140, 220, 510, 1180, 2400, 4800, 7600, 10900, 15800, 23400],
    logsCount: 16800,
    lovesCount: 12900,
    cast: [
      { name: "Paul Mescal", role: "Calum Paterson" },
      { name: "Frankie Corio", role: "Young Sophie" },
      { name: "Celia Rowlson-Hall", role: "Adult Sophie" },
    ],
  },
  {
    id: "decision-to-leave",
    title: "Decision to Leave",
    originalTitle: "헤어질 결심",
    year: 2022,
    director: "Park Chan-wook",
    cinematographer: "Kim Ji-yong",
    runtime: 138,
    rating: 4.5,
    ratingCount: 27900,
    genres: ["Mystery", "Drama", "Crime"],
    aspectRatio: "2.39:1 Anamorphic",
    filmStock: "Arri Alexa LF (Cooke Anamorphic /i)",
    distribution: "CJ Entertainment / MUBI",
    tagline: "The moment you said you loved me, your love ended. The moment your love ended, my love began.",
    synopsis:
      "A courteous detective investigates a man's mysterious death in the mountains. When he encounters the dead man's enigmatic wife, Seo-rae, an unsettling psychological obsession begins to pull him beneath the fog.",
    posterUrl:
      "https://image.tmdb.org/t/p/w780/zI8KZ4EdLUymWKX1YEkpZ0gtPUa.jpg",
    backdropUrl:
      "https://image.tmdb.org/t/p/w1280/uUXgaOxPsr0jsBhGnkyIgw0g2ge.jpg",
    moods: ["melancholy", "trending"],
    certifiedMasterwork: true,
    scoreDistribution: [190, 310, 680, 1450, 2900, 5200, 7800, 11400, 15900, 21800],
    logsCount: 15400,
    lovesCount: 11200,
    cast: [
      { name: "Tang Wei", role: "Song Seo-rae" },
      { name: "Park Hae-il", role: "Jang Hae-joon" },
      { name: "Lee Jung-hyun", role: "Jung-an" },
      { name: "Go Kyung-pyo", role: "Soo-wan" },
    ],
  },
  {
    id: "drive-my-car",
    title: "Drive My Car",
    originalTitle: "ドライブ・マイ・カー",
    year: 2021,
    director: "Ryusuke Hamaguchi",
    cinematographer: "Hidetoshi Shinomiya",
    runtime: 179,
    rating: 4.7,
    ratingCount: 34100,
    genres: ["Drama"],
    aspectRatio: "1.85:1",
    filmStock: "Arri Alexa Mini (Zeiss Ultra Primes)",
    distribution: "Bitters End / Janus Films",
    tagline: "The deepest conversations happen in the quiet interior of a moving car.",
    synopsis:
      "An aging theater director directs a multilingual production of Chekhov's Uncle Vanya in Hiroshima. Struggling with unresolved grief over his wife's sudden passing, he forms an unexpected bond with the reserved young chauffeur assigned to drive his red Saab 900.",
    posterUrl:
      "https://image.tmdb.org/t/p/w780/znXps7wPyYq8UDCfeyO2vfEIeRS.jpg",
    backdropUrl:
      "https://image.tmdb.org/t/p/w1280/r6aqhlmJmu8Dv5E7QYEruaEXKYm.jpg",
    moods: ["gems", "melancholy"],
    certifiedMasterwork: true,
    scoreDistribution: [95, 160, 390, 920, 2100, 4300, 7100, 11400, 16800, 25900],
    logsCount: 19800,
    lovesCount: 14700,
    cast: [
      { name: "Hidetoshi Nishijima", role: "Yusuke Kafuku" },
      { name: "Toko Miura", role: "Misaki Watari" },
      { name: "Masaki Okada", role: "Koji Takatsuki" },
      { name: "Reika Kirishima", role: "Oto Kafuku" },
    ],
  },
  {
    id: "chungking-express",
    title: "Chungking Express",
    originalTitle: "重慶森林",
    year: 1994,
    director: "Wong Kar-wai",
    cinematographer: "Christopher Doyle & Andrew Lau",
    runtime: 102,
    rating: 4.7,
    ratingCount: 68900,
    genres: ["Comedy", "Drama", "Romance"],
    aspectRatio: "1.66:1 (Step-printed step frame motion)",
    filmStock: "35mm Kodak 500T",
    distribution: "Rolling Thunder Pictures / Criterion",
    tagline: "If memories could be canned, would they also have an expiry date?",
    synopsis:
      "Two melancholic Hong Kong policemen fall in love: one with a mysterious underworld figure in a blonde wig, the other with a free-spirited server at a late-night diner who secretly cleans his apartment.",
    posterUrl:
      "https://image.tmdb.org/t/p/w780/43I9DcNoCzpyzK8JCkJYpHqHqGG.jpg",
    backdropUrl:
      "https://image.tmdb.org/t/p/w1280/vuglA60RqvpHK9rIcG8sXaiWw1L.jpg",
    moods: ["golden-hour", "cozy"],
    certifiedMasterwork: true,
    scoreDistribution: [110, 180, 450, 1100, 2600, 5800, 9400, 14200, 22100, 36800],
    logsCount: 38400,
    lovesCount: 29800,
    cast: [
      { name: "Takeshi Kaneshiro", role: "Cop 223 / He Qiwu" },
      { name: "Brigitte Lin", role: "Woman in Blonde Wig" },
      { name: "Tony Leung Chiu-wai", role: "Cop 663" },
      { name: "Faye Wong", role: "Faye" },
    ],
  },
  {
    id: "paris-texas",
    title: "Paris, Texas",
    year: 1984,
    director: "Wim Wenders",
    cinematographer: "Robby Müller",
    runtime: 145,
    rating: 4.8,
    ratingCount: 39500,
    genres: ["Drama"],
    aspectRatio: "1.66:1",
    filmStock: "35mm Eastmancolor 100T",
    distribution: "Road Movies / Criterion",
    tagline: "A disheveled man wanders out of the desert into the open arms of memory.",
    synopsis:
      "A man wanders out of the desert after having been missing for four years. Reunited with his brother and seven-year-old son, he sets out to track down his estranged wife in Houston, culminating in an indelible confession across a one-way mirror.",
    posterUrl:
      "https://image.tmdb.org/t/p/w780/sP27Qm4THyRZyHjHYMfIDtJP6YE.jpg",
    backdropUrl:
      "https://image.tmdb.org/t/p/w1280/fWrq3u16gaBJ6nYNWcR3XaOhQPq.jpg",
    moods: ["gems", "golden-hour"],
    certifiedMasterwork: true,
    scoreDistribution: [85, 130, 310, 790, 1900, 4200, 7100, 11800, 18500, 31400],
    logsCount: 22400,
    lovesCount: 18100,
    cast: [
      { name: "Harry Dean Stanton", role: "Travis Henderson" },
      { name: "Nastassja Kinski", role: "Jane Henderson" },
      { name: "Dean Stockwell", role: "Walt Henderson" },
      { name: "Hunter Carson", role: "Hunter Henderson" },
    ],
  },
];

export const REVIEWS: Review[] = [
  {
    id: "rev-1",
    filmId: "past-lives",
    filmTitle: "Past Lives",
    filmYear: 2023,
    filmPoster: FILMS[0].posterUrl,
    authorName: "clara",
    authorRole: "@clarathorne",
    authorAvatar:
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&q=80",
    rating: 5.0,
    date: "2d ago",
    formatWatched: "35mm",
    isRewatch: true,
    isFavorite: true,
    content:
      "Arthur sitting in that bar booth while Nora and Hae Sung speak Korean across him is the most painful 10 minutes of cinema this year. Man was suffering in silence. 5/5 no notes.",
    likes: 1420,
    replies: 48,
  },
  {
    id: "rev-2",
    filmId: "perfect-days",
    filmTitle: "Perfect Days",
    filmYear: 2023,
    filmPoster: FILMS[1].posterUrl,
    authorName: "julian",
    authorRole: "@julianm",
    authorAvatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80",
    rating: 4.5,
    date: "yesterday",
    formatWatched: "Cinema",
    isRewatch: false,
    isFavorite: true,
    content:
      "A guy cleaning Tokyo public toilets, listening to Lou Reed on cassette tapes, and watering his plants. He figured out life while the rest of us are doomscrolling.",
    likes: 890,
    replies: 23,
  },
  {
    id: "rev-3",
    filmId: "in-the-mood-for-love",
    filmTitle: "In the Mood for Love",
    filmYear: 2000,
    filmPoster: FILMS[3].posterUrl,
    authorName: "david",
    authorRole: "@davidkim",
    authorAvatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80",
    rating: 5.0,
    date: "3d ago",
    formatWatched: "4K Criterion",
    isRewatch: true,
    isFavorite: true,
    content:
      "Wong Kar-wai made an entire masterpiece about two people buying noodles in the rain and brushing shoulders on the stairs. The sexual tension could power an entire city.",
    likes: 2150,
    replies: 64,
  },
  {
    id: "rev-4",
    filmId: "aftersun",
    filmTitle: "Aftersun",
    filmYear: 2022,
    filmPoster: FILMS[5].posterUrl,
    authorName: "Clara Thorne",
    authorRole: "@clarathorne",
    authorAvatar:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=256&q=80",
    rating: 5.0,
    date: "4d ago",
    formatWatched: "Cinema",
    isRewatch: true,
    isFavorite: true,
    content:
      "Under Pressure will never sound the same again. Literally stared at the ceiling for an hour after this ended. Devastating.",
    likes: 1840,
    replies: 51,
  },
];

export const CURATED_LISTS: CuratedList[] = [
  {
    id: "list-1",
    title: "Late-Night Rain in Asian Metropolises",
    description: "Saturated neon reflections on asphalt, quiet noodle counters, dan keindahan sunyi sinema perkotaan malam hari.",
    curator: "CineHearth Editorial",
    curatorAvatar: "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Ccircle cx='60' cy='60' r='58' fill='%2314181c' stroke='%23333f4d' stroke-width='2'/%3E%3Ccircle cx='60' cy='60' r='40' fill='%2300e054' fill-opacity='0.16'/%3E%3Ctext x='60' y='74' font-family='sans-serif' font-size='42' font-weight='900' fill='%2300e054' text-anchor='middle'%3ECE%3C/text%3E%3C/svg%3E",
    filmCount: 8,
    likesCount: 142,
    films: [FILMS[3], FILMS[8], FILMS[6], FILMS[7]],
  },
  {
    id: "list-2",
    title: "Tender Melancholy & 35mm Sunsets",
    description: "Karya seluloid 35mm yang menangkap kepedihan lembut berlalunya waktu, kehangatan senja golden hour, dan perpisahan abadi.",
    curator: "David Kim",
    curatorAvatar: "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Ccircle cx='60' cy='60' r='58' fill='%2314181c' stroke='%23333f4d' stroke-width='2'/%3E%3Ccircle cx='60' cy='60' r='40' fill='%2340bcf4' fill-opacity='0.16'/%3E%3Ctext x='60' y='74' font-family='sans-serif' font-size='42' font-weight='900' fill='%2340bcf4' text-anchor='middle'%3ED%3C/text%3E%3C/svg%3E",
    filmCount: 12,
    likesCount: 289,
    films: [FILMS[0], FILMS[2], FILMS[4], FILMS[5], FILMS[9]],
  },
  {
    id: "list-3",
    title: "Quiet Monastic Revelations in Modern Cinema",
    description: "Sinema kontemplatif yang merayakan martabat rutinitas bersahaja dan ritual hening kehidupan sehari-hari.",
    curator: "Julian Mercer",
    curatorAvatar: "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Ccircle cx='60' cy='60' r='58' fill='%2314181c' stroke='%23333f4d' stroke-width='2'/%3E%3Ccircle cx='60' cy='60' r='40' fill='%23ff8000' fill-opacity='0.16'/%3E%3Ctext x='60' y='74' font-family='sans-serif' font-size='42' font-weight='900' fill='%23ff8000' text-anchor='middle'%3EJ%3C/text%3E%3C/svg%3E",
    filmCount: 6,
    likesCount: 94,
    films: [FILMS[1], FILMS[7], FILMS[9]],
  },
];

export const ESSAYS: Essay[] = [
  {
    id: "essay-1",
    title: "The Geometry of In-Yun: Celine Song and the Weight of Unlived Lives",
    subtitle: "Bagaimana Past Lives mentransformasikan konsep takdir Korea menjadi elegi imigran yang mengharukan.",
    author: "CineHearth Editorial",
    authorRole: "Cinema Archivist & Essayist",
    authorAvatar: "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Ccircle cx='60' cy='60' r='58' fill='%2314181c' stroke='%23333f4d' stroke-width='2'/%3E%3Ccircle cx='60' cy='60' r='40' fill='%2300e054' fill-opacity='0.16'/%3E%3Ctext x='60' y='74' font-family='sans-serif' font-size='42' font-weight='900' fill='%2300e054' text-anchor='middle'%3ECE%3C/text%3E%3C/svg%3E",
    readTime: "8 min read",
    publishedDate: "28 Agustus 2026",
    coverImage:
      "https://image.tmdb.org/t/p/w1280/7HR38hMBl23lf38MAN63y4pKsHz.jpg",
    filmSubject: "Past Lives",
    leadParagraph:
      "Dalam filosofi Korea, in-yun meyakini bahwa sentuhan lengan yang tidak sengaja antara dua orang asing di jalan lahir dari ribuan lapisan takdir yang terakumulasi melintasi rentang kehidupan masa lalu. Dalam karya debut Celine Song, takdir bukanlah magnet kosmik yang memaksakan dua jiwa bersatu melawan kenyataan; melainkan sebuah rekonsiliasi damai atas jalan hidup yang tak bisa kita lalui bersama.",
    bodySections: [
      {
        heading: "The Architecture of Restraint",
        text: "Song membingkai Nora (Greta Lee) dan Hae Sung (Teo Yoo) dengan batas arsitektur yang sengaja dihadirkan: palang pintu kereta bawah tanah, tiang gerbong komuter, dan pagar feri New York. Keduanya selalu berada dalam jarak dekat—cukup dekat untuk merasakan hembusan napas masing-masing—namun tertahan oleh gravitasi tak kasat mata dari dua dekade evolusi kehidupan yang terpisah samudera.",
        pullQuote: "“Mencintai seseorang melintasi samudera waktu yang telah berlalu bukanlah hasrat untuk memiliki, melainkan menjadi saksi bagi jiwa masa kecil yang pernah menggenggam tangan Anda.”",
      },
      {
        heading: "A Trio Free of Melodrama",
        text: "Yang membuat Past Lives begitu istimewa dibanding romansa konvensional adalah karakter Arthur (John Magaro). Alih-alih dijadikan penghalang klise bagi cinta sejati, Song memberikan Arthur keanggunan emosional yang luar biasa. Ia diberi ruang untuk mengakui kerentanannya di tempat tidur: rasa cemas mencintai seseorang yang bahasa mimpi masa kecilnya diucapkan dalam kata-kata yang tak pernah bisa ia terjemahkan sepenuhnya.",
      },
    ],
  },
  {
    id: "essay-2",
    title: "Celluloid as Memory: The Tactile Light of Wim Wenders' Tokyo",
    subtitle: "Mendalami ritme kontemplatif dan desis pita kaset tape analog dalam mahakarya Perfect Days.",
    author: "Clara Thorne",
    authorRole: "Sight & Sound Critic",
    authorAvatar: "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Ccircle cx='60' cy='60' r='58' fill='%2314181c' stroke='%23333f4d' stroke-width='2'/%3E%3Ccircle cx='60' cy='60' r='40' fill='%2300e054' fill-opacity='0.16'/%3E%3Ctext x='60' y='74' font-family='sans-serif' font-size='42' font-weight='900' fill='%2300e054' text-anchor='middle'%3EC%3C/text%3E%3C/svg%3E",
    readTime: "6 min read",
    publishedDate: "15 Agustus 2026",
    coverImage:
      "https://image.tmdb.org/t/p/w1280/hjWxngV6tidwDkfJDEgMjHD2KEz.jpg",
    filmSubject: "Perfect Days",
    leadParagraph:
      "There is an old Japanese word, komorebi, which describes the flickering dance of light and shadow created by leaves swaying in the breeze. It exists only once, for that singular instant. Wim Wenders grounds his latest masterpiece in this quiet philosophy, creating a work that functions less like narrative cinema and more like a gentle spiritual retreat.",
    bodySections: [
      {
        heading: "The Monastic Discipline of the Everyday",
        text: "Koji Yakusho's Hirayama does not speak for the first twelve minutes of the film. We watch his morning ritual unfold with religious reverence: the rolling up of his futon, the misting of maple saplings, the purchase of canned BOSS coffee from a street vending machine. In an age dominated by frenetic digital stimulation, Wenders reminds us that peace is an intentional discipline.",
      },
    ],
  },
];

export const CURRENT_USER: UserProfile = {
  name: "Cinephile Member",
  username: "cinephile",
  role: "Film Lover & Cinema Enthusiast",
  location: "Indonesia",
  bio: "Pencinta sinema, penikmat film bioskop, dan pemburu rilisan 35mm celluloid.",
  avatarUrl:
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&q=80",
  headerBackdropUrl:
    "https://image.tmdb.org/t/p/w1280/7HR38hMBl23lf38MAN63y4pKsHz.jpg",
  stats: {
    filmsLogged: 0,
    hoursWatched: 0,
    listsCreated: 0,
    reviewsWritten: 0,
    averageRating: 0.0,
    favoriteDirector: "-",
  },
  topFourFilms: [],
  recentLogs: [],
};
