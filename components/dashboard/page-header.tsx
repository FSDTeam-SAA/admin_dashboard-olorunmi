import { ChevronRight } from "lucide-react";

export function PageHeader({
  title,
  subtitle,
  description,
}: {
  title: string;
  subtitle?: string;
  description?: string;
}) {
  return (
    <div className="space-y-1">
      <h1 className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
        {title}
      </h1>
      {description ? (
        <p className="text-sm text-text-tertiary">{description}</p>
      ) : subtitle ? (
        <div className="flex items-center gap-1.5 text-xs font-medium text-text-tertiary">
          <span>Dashboard</span>
          <ChevronRight className="size-3.5" />
          <span className="text-text-secondary">{subtitle}</span>
        </div>
      ) : null}
    </div>
  );
}