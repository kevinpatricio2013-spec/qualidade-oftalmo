export type PerfilUsuario = "qualidade" | "lideranca" | "diretoria";

export type UsuarioSessao = {
  nome: string;
  email: string;
  perfil: PerfilUsuario;
};

const SESSION_KEY = "hospital_app_usuario";

export function salvarSessao(usuario: UsuarioSessao) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(usuario));
}

export function obterSessao(): UsuarioSessao | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as UsuarioSessao;
  } catch {
    return null;
  }
}

export function removerSessao() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
}