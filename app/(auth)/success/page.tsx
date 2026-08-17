"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export default function SuccessPage() {
  const router = useRouter();

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      router.replace("/login");
    }, 2500);

    return () => window.clearTimeout(timeoutId);
  }, [router]);

  return (
    <Card className="w-full max-w-[360px] rounded-2xl border-border bg-card shadow-lg">
      <CardContent className="flex flex-col items-center space-y-4 p-8 text-center">
        <div className="relative flex size-[100px] items-center justify-center rounded-full bg-emerald-600 shadow-md">
          <ShieldCheck className="size-12 text-white" />
          <span className="absolute -top-2.5 left-2 size-3 rounded-full bg-emerald-500" />
          <span className="absolute -top-1 right-1 size-2 rounded-full bg-emerald-400" />
          <span className="absolute top-3 -left-3 size-2 rounded-full bg-emerald-500" />
          <span className="absolute top-5 -right-3 size-1.5 rounded-full bg-emerald-400" />
        </div>

        <div className="space-y-1.5">
          <h1 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">Successful!</h1>
          <p className="text-xs text-text-secondary">
            Your account is ready to use. You will be redirected to the Dashboard page in a
            few seconds.
          </p>
        </div>

        <Loader2 className="size-6 animate-spin text-emerald-600 dark:text-emerald-400" />
      </CardContent>
    </Card>
  );
}