-- ===========================================
-- Table: bookmarks
-- ===========================================
CREATE TABLE public.bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  weight INTEGER NOT NULL DEFAULT 0,
  name TEXT NOT NULL,
  description TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  color TEXT NOT NULL DEFAULT '#000000',
  thumbnail_url TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_bookmarks_user_id ON public.bookmarks USING btree (user_id);
CREATE INDEX idx_bookmarks_weight_created ON public.bookmarks (user_id, weight ASC, created_at ASC);

-- Auto-update updated_at on row modification
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bookmarks_updated_at
  BEFORE UPDATE ON public.bookmarks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ===========================================
-- Table: bookmark_tags
-- ===========================================
CREATE TABLE public.bookmark_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bookmark_id UUID NOT NULL REFERENCES public.bookmarks(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  UNIQUE (bookmark_id, tag)
);

CREATE INDEX idx_bookmark_tags_bookmark_id ON public.bookmark_tags USING btree (bookmark_id);
CREATE INDEX idx_bookmark_tags_tag ON public.bookmark_tags USING btree (tag);

-- ===========================================
-- RLS Policies: bookmarks
-- ===========================================
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own bookmarks"
  ON public.bookmarks FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert their own bookmarks"
  ON public.bookmarks FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own bookmarks"
  ON public.bookmarks FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own bookmarks"
  ON public.bookmarks FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- ===========================================
-- RLS Policies: bookmark_tags
-- ===========================================
ALTER TABLE public.bookmark_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tags for their bookmarks"
  ON public.bookmark_tags FOR SELECT
  TO authenticated
  USING (
    bookmark_id IN (
      SELECT id FROM public.bookmarks WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can insert tags for their bookmarks"
  ON public.bookmark_tags FOR INSERT
  TO authenticated
  WITH CHECK (
    bookmark_id IN (
      SELECT id FROM public.bookmarks WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update tags for their bookmarks"
  ON public.bookmark_tags FOR UPDATE
  TO authenticated
  USING (
    bookmark_id IN (
      SELECT id FROM public.bookmarks WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can delete tags for their bookmarks"
  ON public.bookmark_tags FOR DELETE
  TO authenticated
  USING (
    bookmark_id IN (
      SELECT id FROM public.bookmarks WHERE user_id = (SELECT auth.uid())
    )
  );
