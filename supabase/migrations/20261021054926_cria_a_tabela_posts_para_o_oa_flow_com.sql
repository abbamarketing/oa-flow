-- OA Flow: tabela de posts
CREATE TABLE IF NOT EXISTS public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  caption text,
  platform text NOT NULL DEFAULT 'instagram'
    CHECK (platform IN ('instagram','facebook','linkedin','x','tiktok')),
  status text NOT NULL DEFAULT 'idea'
    CHECK (status IN ('idea','drafting','scheduled','published')),
  scheduled_for timestamptz,
  ai_generated boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Concede privilégios necessários para a API de dados funcionar com RLS.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT ALL ON public.posts TO service_role;

-- Habilita Row Level Security.
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Policies: cada usuário acessa apenas seus próprios posts.
CREATE POLICY "posts_read_own"
  ON public.posts
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "posts_insert_own"
  ON public.posts
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "posts_update_own"
  ON public.posts
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "posts_delete_own"
  ON public.posts
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Atualiza updated_at automaticamente.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER posts_set_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();