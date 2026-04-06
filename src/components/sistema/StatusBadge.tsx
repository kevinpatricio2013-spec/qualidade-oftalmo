"use client";

type StatusOcorrencia =
  | "Em análise pela Qualidade"
  | "Direcionada para Liderança"
  | "Em tratativa pela Liderança"
  | "Aguardando validação da Qualidade"
  | "Encerrada"
  | string;

interface StatusBadgeProps {
  status: StatusOcorrencia;
}

function getStatusClasses(status: string) {
  switch (status) {
    case "Em análise pela Qualidade":
      return "bg-[#fff4d9] text-[#996b00] border-[#f4d58d]";
    case "Direcionada para Liderança":
      return "bg-[#e8f4ff] text-[#0f5d99] border-[#b9daf7]";
    case "Em tratativa pela Liderança":
      return "bg-[#e7faff] text-[#0077a8] border-[#b7e8f7]";
    case "Aguardando validação da Qualidade":
      return "bg-[#efe9ff] text-[#6d4bb6] border-[#d7c9ff]";
    case "Encerrada":
      return "bg-[#e8f8ef] text-[#1c7c4d] border-[#bfe5cf]";
    default:
      return "bg-[#eef5fb] text-[#5a7590] border-[#d8e9fb]";
  }
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClasses(
        status || "Sem status"
      )}`}
    >
      {status || "Sem status"}
    </span>
  );
}