"use client";

import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    try {
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Erro ao sair:", error);
    }
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded-2xl border border-[#d8e9fb] bg-white px-4 py-2.5 text-sm font-semibold text-[#2d5f8b] transition hover:bg-[#f4faff]"
    >
      Sair
    </button>
  );
}