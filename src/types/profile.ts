export type UserRole = "QUALIDADE" | "LIDERANCA";

export type Profile = {
  id: string;
  nome: string | null;
  email: string | null;
  role: UserRole | null;
  setor: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};