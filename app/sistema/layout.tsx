"use client";

import { ReactNode, useEffect, useState } from "react";
import BarraSistema from "../../src/components/BarraSistema";
import { supabase } from "../../src/lib/supabase";

type Profile = {
  nome: string | null;
  role: string | null;
};

export default function SistemaLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    async function carregarPerfil() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("nome, role")
        .eq("id", user.id)
        .single();

      if (data) {
        setProfile(data);
      }
    }

    carregarPerfil();
  }, []);

  return (
    <div className="min-h-screen bg-emerald-50/40">
      <BarraSistema nome={profile?.nome || ""} role={profile?.role || ""} />
      {children}
    </div>
  );
}