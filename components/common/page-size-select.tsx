"use client";

import { cn } from "@/lib/utils";

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

type PageSizeSelectProps = {
  value: number;
  onChange: (value: number) => void;
  options?: number[];
  className?: string;
};

export function PageSizeSelect({
  value,
  onChange,
  options = DEFAULT_PAGE_SIZE_OPTIONS,
  className,
}: PageSizeSelectProps) {
  return (
    <label className={cn("flex items-center gap-1.5 text-xs text-text-tertiary", className)}>
      Rows per page
      <select
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-8 rounded-md border border-border bg-card px-2 text-xs font-medium text-text-primary outline-none transition-colors hover:bg-secondary-bg focus:border-primary"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
