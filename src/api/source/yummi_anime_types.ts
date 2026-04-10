interface AnimeStatus {
  title: string;
  class: string;
  alias: string;
  value: number;
}


interface Poster {
  big: string;
  fullsize: string;
  huge: string;
  medium: string;
  small: string;
}

interface Rating {
  average: number;
  kp_rating: number;
  anidub_rating: number;
  counters: number;
  myanimelist_rating: number;
  shikimori_rating: number;
  worldart_rating: number;
}

interface AnimeType {
  name: string;
  value: number;
  shortname: string;
}

interface MinAge {
  value: number;
  title: string;
  titleLong: string;
}

interface RemoteIds {
  worldart_id: number;
  worldart_type: string;
  kp_id: number;
  anidb_id: number;
  sr_id: number;
  anilibria_alias: string;
  shikimori_id: number;
  myanimelist_id: number;
}

interface Creator {
  title: string;
  id: number;
  url: string;
}

interface Studio {
  title: string;
  id: number;
  url: string;
}

interface SkipData {
  time: string;
  length: string;
}

interface Skips {
  opening: SkipData;
  ending: SkipData;
}

interface VideoData {
  dubbing: string;
  player: string;
}

interface VideoInfo {
  video_id: number;
  iframe_url: string;
  data: VideoData;
  number: string;
  date: number;
  index: number;
  skips: Skips;
}

interface Genre {
  title: string;
  id: number;
  alias: string;
  url: string;
}

interface Translates {
  title: string;
  href: string;
  value: string;
}

interface Episodes {
  aired: number;
  count: number;
  next_date: number;
}

interface ScreenshotSizes {
  small: string;
  full: string;
}

interface RandomScreenshot {
  sizes: ScreenshotSizes;
  id: number;
  time: number;
  episode: number;
}

interface Top {
  category: number;
  global: number;
}

interface ViewingOrder {
  title: string;
  anime_id: number;
  type: AnimeType;
  anime_url: string;
  anime_status: AnimeStatus;
  description: string;
  poster: Poster;
  year: number;
  date: number;
}


interface FeedRating {
  counters: number;
  average: number;
}

interface FeedMinAge {
  value: number;
  title: string;
  title_long: string;
}

interface FeedUserListInfo {
  title: string;
  href: string;
  id: number;
}

interface FeedUserList {
  is_fav: boolean;
  list?: FeedUserListInfo;
}

interface FeedUser {
  list?: FeedUserList;
  rating?: number;
}

interface FeedRemoteIds {
  worldart_id: number;
  worldart_type: string;
  kp_id: number;
  anidub_id: number;
  sr_id: number;
  anilibria_alias: string;
  shikimori_id: number;
  myanimelist_id: number;
}

interface FeedAnimeItem {
  anime_id: number;
  anime_status: AnimeStatus;
  anime_url: string;
  poster: Poster;
  rating: FeedRating;
  title: string;
  type: AnimeType;
  year: number;
  description: string;
  views: number;
  season: number;
  min_age: FeedMinAge;
  user?: FeedUser;
  remote_ids: FeedRemoteIds;
  top: Top;
  blocked_in: string[];
}

interface FeedVideoItem {
  title: string;
  date: number;
  description: string;
  ep_title: string;
  player_title: string;
  poster: Poster;
  anime_url: string;
  dub_title: string;
  anime_id: number;
  video_id: number;
}

interface FeedTopCarousel {
  season: number;
  year: number;
  items: FeedAnimeItem[];
}

interface FeedLastWatchScreenshot {
  id: number;
  time: number;
  episode: string;
  sizes: {
    small: string;
    full: string;
  };
}

interface FeedLastWatchItem {
  date: number;
  end_time: number;
  anime_url: string;
  poster: Poster;
  video_id: number;
  description: string;
  title: string;
  anime_id: number;
  do_not_recommend: boolean;
  ep_title: string;
  duration: number;
  screenshot: FeedLastWatchScreenshot;
}

interface FeedScheduleEpisodes {
  aired: number;
  count: number;
  next_date: number;
  prev_date: number;
}

interface FeedScheduleItem {
  title: string;
  description: string;
  poster: Poster;
  anime_url: string;
  anime_id: number;
  episodes: FeedScheduleEpisodes;
}

interface FeedUserIds {
  shikimori?: {
    id: number;
    nickname: string;
  };
  tg_nickname?: string;
  vk?: number;
}

interface FeedUserAvatars {
  big: string;
  full: string;
  small: string;
}

interface FeedUserBanner {
  cropped: string;
  full: string;
}

interface FeedUserTexts {
  color: number;
  left: string;
  right: string;
}

interface FeedUserProfile {
  id: number;
  nickname: string;
  about: string;
  banned: boolean;
  ids: FeedUserIds;
  avatars: FeedUserAvatars;
  bdate: number;
  last_online: number;
  sex: number;
  roles: string[];
  register_date: number;
  texts: FeedUserTexts;
  banner: FeedUserBanner;
}

interface FeedPostCategory {
  id: number;
  title: string;
  uri: string;
}

interface FeedPostItem {
  title: string;
  preview_image: string;
  id: number;
  content_preview: string;
  user: FeedUserProfile;
  category: FeedPostCategory;
  created_at: number;
}

interface FeedPostType {
  title: string;
  id: number;
  uri: string;
}

interface FeedPosts {
  items: FeedPostItem[];
  types: FeedPostType[];
}

interface FeedBloggerCategory {
  id: string;
  title: string;
}

interface FeedBloggerVideoDescriptions {
  big: string;
  small: string;
}

interface FeedBloggerVideoPreviews {
  small: string;
  big: string;
}

interface FeedBloggerVideoLikes {
  likes: number;
  dislikes: number;
  vote: number;
}

interface FeedBloggerVideoItem {
  title: string;
  id: number;
  time: number;
  category: FeedBloggerCategory;
  publish_date: number;
  iframe_url: string;
  has_spoiler: boolean;
  descriptions: FeedBloggerVideoDescriptions;
  comments_count: number;
  creator: FeedUserProfile;
  previews: FeedBloggerVideoPreviews;
  likes: FeedBloggerVideoLikes;
  views: number;
  language: string;
}

interface FeedBloggerVideos {
  items: FeedBloggerVideoItem[];
  categories: FeedBloggerCategory[];
}

interface FeedBloggerPeople {
  items: FeedUserProfile[];
  count: number;
}

interface FeedBlogger {
  videos: FeedBloggerVideos;
  people: FeedBloggerPeople;
}

interface FeedCollectionLikes {
  likes: number;
  dislikes: number;
  vote: number;
}

interface FeedCollectionOwner {
  id: number;
  nickname: string;
  avatars: FeedUserAvatars;
}

interface FeedCollection {
  title: string;
  description: string;
  id: number;
  likes: FeedCollectionLikes;
  language: string;
  animes: FeedAnimeItem[];
  owner: FeedCollectionOwner;
  create_date: number;
  views: number;
  public: boolean;
  poster_previews: Poster[];
}

export interface FeedResponse {
  new: FeedAnimeItem[];
  announcements: FeedAnimeItem[];
  recommends: FeedAnimeItem[];
  new_videos: FeedVideoItem[];
  top_carousel: FeedTopCarousel;
  last_watches: FeedLastWatchItem[];
  schedule: FeedScheduleItem[];
  posts: FeedPosts;
  blogger: FeedBlogger;
  collections: FeedCollection[];
}

export interface SearchResult {
  anime_id: number;
  anime_status: AnimeStatus;
  anime_url: string;
  description: string;
  min_age: MinAge;
  poster: Poster;
  rating: Rating;
  remote_ids: RemoteIds;
  season: number;
  title: string;
  top: Top;
  type: AnimeType;
  views: number;
  year: number;
}

export interface AnimeResult {
  anime_id: number;
  anime_status: AnimeStatus;
  anime_url: string;
  poster: Poster;
  rating: Rating;
  title: string;
  type: AnimeType;
  year: number;
  description: string;
  views: number;
  season: number;
  min_age: MinAge;
  remote_ids: RemoteIds;
  original: string;
  other_titles: string[];
  creators: Creator[];
  studios: Studio[];
  videos: VideoInfo[];
  genres: Genre[];
  viewing_order: ViewingOrder[];
  translates: Translates[];
  blocked_in: string[];
  episodes: Episodes;
  comments_count: number;
  reviews_count: number;
  random_screenshots: RandomScreenshot[];
  top: Top;
  posts_count: number;
}

export interface SearchInput {
  studio_ids?: Array<number>;
  query?: string;
  director_ids?: Array<number>;
  worldart_ids?: Array<number>;
  mal_ids?: Array<number>;
  kp_ids?: Array<number>;
  shikimori_ids?: Array<number>;
  min_age?: Array<number>;
  max_rating_counters?: number;
  min_rating_counters?: number;
  ids?: Array<number>;
  season?: Array<string>;
  status?: Array<string>;
  types?: Array<string>;
  exclude_genres?: Array<string>;
  genres?: Array<string>;
  max_rating?: number;
  min_rating?: number;
  ep_to?: number;
  ep_from?: number;
  to_year?: number;
  sort_forward?: boolean;
  sort?: "title" | "year" | "rating" | "rating_counters" | "views" | "top" | "random" | "id";
  offset?: number;
  limit?: number;
}
