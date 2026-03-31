import { supabase } from "@/src/lib/supabase";
import type { Profile, UserRole } from "@/src/types/profile";

type AuthUserResult = {
  userId: string | null;
  profile: Profile | null;
  error: string | null;
};

export async function getAuthenticatedProfile(): Promise<AuthUserResult> {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      return {
        userId: null,
        profile: null,
        error: userError.message,
      };
    }

    if (!user) {
      return {
        userId: null,
        profile: null,
        error: "Usuário não autenticado.",
      };
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, nome, email, role, setor, created_at, updated_at")
      .eq("id", user.id)
      .single();

    if (profileError) {
      return {
        userId: user.id,
        profile: null,
        error: profileError.message,
      };
    }

    return {
      userId: user.id,
      profile: profile as Profile,
      error: null,
    };
  } catch (error) {
    return {
      userId: null,
      profile: null,
      error: error instanceof Error ? error.message : "Erro inesperado ao carregar perfil.",
    };
  }
}

export function isQualidade(profile: Profile | null): boolean {
  return profile?.role === "QUALIDADE";
}

export function isLideranca(profile: Profile | null): boolean {
  return profile?.role === "LIDERANCA";
}

export function canAccessQualidade(profile: Profile | null): boolean {
  return isQualidade(profile);
}

export function canAccessLideranca(
  profile: Profile | null,
  setorAtual?: string | null
): boolean {
  if (!profile) return false;

  if (isQualidade(profile)) return true;

  if (isLideranca(profile)) {
    if (!setorAtual) return true;
    return profile.setor === setorAtual;
  }

  return false;
}

export function getSetorPermitido(
  profile: Profile | null,
  setorSelecionado?: string | null
): string | null {
  if (!profile) return null;

  if (isQualidade(profile)) {
    return setorSelecionado ?? null;
  }

  if (isLideranca(profile)) {
    return profile.setor ?? null;
  }

  return null;
}

export function hasRole(profile: Profile | null, role: UserRole): boolean {
  return profile?.role === role;
}