export interface Bookmark {
  id: string;
  created_at: string;
  updated_at: string;
  weight: number;
  name: string;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  color: string;
  thumbnail_url: string | null;
  user_id: string;
  tags?: BookmarkTag[];
}

export interface BookmarkTag {
  id: string;
  bookmark_id: string;
  tag: string;
}

export interface BookmarkFormData {
  name: string;
  description: string;
  latitude: number | null;
  longitude: number | null;
  color: string;
  thumbnail_url: string;
  weight: number;
  tags: string[];
}
