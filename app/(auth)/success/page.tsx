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
    <Card className="w-full max-w-[330px] rounded-[20px] border-[#dfdfdf] bg-[#f4f4f4] shadow-none">
      <CardContent className="flex flex-col items-center space-y-4 p-8 text-center">
        <div className="relative flex size-[110px] items-center justify-center rounded-full bg-[#a79663]">
          <ShieldCheck className="size-12 text-white" />
          <span className="absolute -top-3 left-2 size-3 rounded-full bg-[#a79663]" />
          <span className="absolute -top-1 right-1 size-2 rounded-full bg-[#a79663]" />
          <span className="absolute top-3 -left-4 size-2 rounded-full bg-[#a79663]" />
          <span className="absolute top-5 -right-4 size-1.5 rounded-full bg-[#a79663]" />
        </div>

        <div className="space-y-1">
          <h1 className="text-4xl font-semibold text-[#a79663]">Successful!</h1>
          <p className="text-sm text-[#2f2f2f]">
            Your account is ready to use. You will be redirected to the Dashboard page in a
            few seconds.
          </p>
        </div>

        <Loader2 className="size-6 animate-spin text-[#a79663]" />
      </CardContent>
    </Card>
  );
}