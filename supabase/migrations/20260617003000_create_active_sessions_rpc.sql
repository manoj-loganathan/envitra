-- Migration: Create Secure RPCs for Native User Sessions Management
-- Date: 2026-06-17

-- 1. Get active sessions for a user
CREATE OR REPLACE FUNCTION public.get_user_sessions(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  user_agent TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT s.id, s.created_at, s.updated_at, s.user_agent
  FROM auth.sessions s
  WHERE s.user_id = p_user_id
  ORDER BY s.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Revoke public execute
REVOKE EXECUTE ON FUNCTION public.get_user_sessions(UUID) FROM public;
GRANT EXECUTE ON FUNCTION public.get_user_sessions(UUID) TO service_role;

-- 2. Disconnect a single session for a user
CREATE OR REPLACE FUNCTION public.delete_user_session(p_session_id UUID, p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  DELETE FROM auth.sessions
  WHERE id = p_session_id AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Revoke public execute
REVOKE EXECUTE ON FUNCTION public.delete_user_session(UUID, UUID) FROM public;
GRANT EXECUTE ON FUNCTION public.delete_user_session(UUID, UUID) TO service_role;

-- 3. Disconnect all other sessions (all except the current one) for a user
CREATE OR REPLACE FUNCTION public.delete_other_user_sessions(p_current_session_id UUID, p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  DELETE FROM auth.sessions
  WHERE user_id = p_user_id AND id != p_current_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Revoke public execute
REVOKE EXECUTE ON FUNCTION public.delete_other_user_sessions(UUID, UUID) FROM public;
GRANT EXECUTE ON FUNCTION public.delete_other_user_sessions(UUID, UUID) TO service_role;

-- 4. Disconnect all sessions for a user
CREATE OR REPLACE FUNCTION public.delete_all_user_sessions(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  DELETE FROM auth.sessions
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Revoke public execute
REVOKE EXECUTE ON FUNCTION public.delete_all_user_sessions(UUID) FROM public;
GRANT EXECUTE ON FUNCTION public.delete_all_user_sessions(UUID) TO service_role;
