-- OA Flow: papéis de usuário (admin) + função has_role + regras de admin em posts

DO $$
BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Privilégios: apenas usuários autenticados leiam; service_role faz tudo.
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Cada usuário lê apenas suas próprias atribuições de papel.
DROP POLICY IF EXISTS "user_roles_read_own" ON public.user_roles;
CREATE POLICY "user_roles_read_own"
  ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Função security definer para checar papel sem recursão em policies.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Administradores enxergam e gerenciam posts de TODOS os usuários
-- (somado às regras por-usuário já existentes; não-usuários-admin continuam
-- vendo apenas os próprios posts porque has_role retorna false para eles).
DROP POLICY IF EXISTS "posts_read_admin" ON public.posts;
CREATE POLICY "posts_read_admin"
  ON public.posts
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "posts_update_admin" ON public.posts;
CREATE POLICY "posts_update_admin"
  ON public.posts
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "posts_delete_admin" ON public.posts;
CREATE POLICY "posts_delete_admin"
  ON public.posts
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));