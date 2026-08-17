import { AppLogo } from "@/components/common/app-logo";
import { Card, CardContent } from "@/components/ui/card";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="w-full max-w-[480px] rounded-2xl border-border bg-card shadow-lg">
      <CardContent className="space-y-5 p-6 sm:p-8">
        <div className="flex justify-center">
          <AppLogo width={96} height={116} priority />
        </div>

        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">{title}</h1>
          {subtitle ? <p className="text-xs text-text-tertiary">{subtitle}</p> : null}
        </div>

        {children}
      </CardContent>
    </Card>
  );
}