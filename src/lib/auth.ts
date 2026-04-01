import { supabase } from "./supabase";

export type Profile = {
  id: string;
  nome: string | null;
  email: string | null;
  role: "qualidade" | "lider" | "diretoria" | "colaborador";
  setor: string | null;
};

export async function getUsuarioLogado() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error("Erro ao buscar usuário logado:", error);
    return null;
  }

  return user;
}

export async function getProfileAtual(): Promise<Profile | null> {
  const user = await getUsuarioLogado();

  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, nome, email, role, setor")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("Erro ao buscar profile:", error);
    return null;
  }

  return data as Profile;
}

export async function signIn(email: string, password: string) {
  return await supabase.auth.signInWithPassword({
    email,
    password,
  });
}

export async function signOut() {
  return await supabase.auth.signOut();
}