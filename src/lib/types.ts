export interface FieldGuide {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  description: string | null;
  date: string | null;
  color: string;
  image_url: string | null;
  notes: string;
  user_id: string;
}

export interface FieldGuideFormData {
  name: string;
  description: string;
  date: string;
  color: string;
  image_url: string;
  notes: string;
}

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
  field_guide_id: string;
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
