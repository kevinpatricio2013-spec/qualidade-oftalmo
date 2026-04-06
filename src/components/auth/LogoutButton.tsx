"use client";

import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function LogoutButton() {
  const router = useRouter();

  async function sair() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={sair}
      className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
    >
      Sair
    </button>
  );
}