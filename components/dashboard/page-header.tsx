import { ChevronRight } from "lucide-react";

export function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="space-y-2">
      <h1 className="text-4xl font-semibold text-[#1f1f1f]">{title}</h1>
      <div className="flex items-center gap-1 text-sm font-semibold text-[#202020]">
        <span>Dashboard</span>
        <ChevronRight className="size-4" />
        <span>{subtitle}</span>
      </div>
    </div>
  );
}