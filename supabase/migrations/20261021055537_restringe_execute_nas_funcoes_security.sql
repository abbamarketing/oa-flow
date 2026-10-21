-- Apenas triggers/policies chamam estas funcoes; revoga EXECUTE dos
-- roles que nao precisam. Mantem EXECUTE em `authenticated` para `has_role`
-- porque as policies de admin em posts sao `TO authenticated` e a chamam.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM anon, public, authenticated;