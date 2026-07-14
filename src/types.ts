export interface Video {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: string;
  views: string;
  likes: string;
  channelId: string;
  channelTitle: string;
  channelAvatar?: string;
  publishedAt: string;
  isShort?: boolean;
}

export interface Comment {
  id: string;
  authorName: string;
  authorAvatar: string;
  text: string;
  publishedAt: string;
  likes: number;
}

export interface Channel {
  id: string;
  title: string;
  avatar: string;
  subscribers: string;
  videosCount?: string;
}

export interface UserState {
  history: string[]; // video IDs
  likedVideos: string[]; // video IDs
  subscribedChannels: string[]; // channel IDs
}
