import Image from "next/image";

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
    <Card className="w-full max-w-[502px] rounded-[20px] border-[#dfdfdf] bg-[#f4f4f4] shadow-none">
      <CardContent className="space-y-5 p-6 sm:p-8">
        <div className="flex justify-center">
          <Image src="/logo-rss.png" alt="RSS" width={108} height={132} priority />
        </div>

        <div className="space-y-1 text-center">
          <h1 className="text-[24px] font-semibold text-[#242424]">{title}</h1>
          {subtitle ? <p className="text-sm text-[#acacac]">{subtitle}</p> : null}
        </div>

        {children}
      </CardContent>
    </Card>
  );
}