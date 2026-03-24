-- ===========================================
-- Migration: Add field_guides table
-- ===========================================
CREATE TABLE public.field_guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  name TEXT NOT NULL,
  description TEXT,
  date DATE,
  color TEXT NOT NULL DEFAULT '#A3C4F3',
  image_url TEXT,
  notes TEXT DEFAULT '',
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_field_guides_user_id ON public.field_guides USING btree (user_id);

-- Auto-update updated_at on row modification
CREATE TRIGGER field_guides_updated_at
  BEFORE UPDATE ON public.field_guides
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ===========================================
-- RLS Policies: field_guides
-- ===========================================
ALTER TABLE public.field_guides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own field guides"
  ON public.field_guides FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert their own field guides"
  ON public.field_guides FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own field guides"
  ON public.field_guides FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own field guides"
  ON public.field_guides FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- ===========================================
-- Add field_guide_id FK to bookmarks
-- ===========================================
ALTER TABLE public.bookmarks ADD COLUMN field_guide_id UUID REFERENCES public.field_guides(id) ON DELETE CASCADE;

CREATE INDEX idx_bookmarks_field_guide_id ON public.bookmarks USING btree (field_guide_id);

-- ===========================================
-- Migrate existing data: create default field guide per user
-- ===========================================
INSERT INTO public.field_guides (name, description, date, color, user_id)
SELECT DISTINCT
  'PNW Trip',
  'Bear and Chickadee do the PNW',
  '2026-10-15'::date,
  '#A3C4F3',
  user_id
FROM public.bookmarks;

-- Also create for users who have no bookmarks yet but may exist
-- (uses auth.users directly — adjust if needed)
INSERT INTO public.field_guides (name, description, date, color, user_id)
SELECT
  'PNW Trip',
  'Bear and Chickadee do the PNW',
  '2026-10-15'::date,
  '#A3C4F3',
  id
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.field_guides fg WHERE fg.user_id = u.id
);

-- Assign all existing bookmarks to their user's field guide
UPDATE public.bookmarks b
SET field_guide_id = fg.id
FROM public.field_guides fg
WHERE b.user_id = fg.user_id
  AND b.field_guide_id IS NULL;

-- Make field_guide_id NOT NULL after migration
ALTER TABLE public.bookmarks ALTER COLUMN field_guide_id SET NOT NULL;
