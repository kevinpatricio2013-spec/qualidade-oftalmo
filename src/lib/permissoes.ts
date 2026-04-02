export type RoleSistema = "qualidade" | "diretoria" | "lider" | "colaborador";

export function podeVerTudo(role?: string | null) {
  return role === "qualidade" || role === "diretoria";
}

export function ehLider(role?: string | null) {
  return role === "lider";
}

export function podeFiltrarTodosSetores(role?: string | null) {
  return role === "qualidade" || role === "diretoria";
}
