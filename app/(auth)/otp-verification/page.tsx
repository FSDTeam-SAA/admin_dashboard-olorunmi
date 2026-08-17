"use client";

import { Suspense, useMemo, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { getApiMessage, verifyOtp } from "@/lib/api";

const OTP_LENGTH = 6;

export default function OtpVerificationPage() {
  return (
    <Suspense fallback={<OtpVerificationFallback />}>
      <OtpVerificationContent />
    </Suspense>
  );
}

function OtpVerificationFallback() {
  return (
    <AuthShell title="OTP Verification">
      <div className="space-y-4">
        <div className="flex items-center justify-center gap-3">
          {Array.from({ length: OTP_LENGTH }).map((_, index) => (
            <div key={String(index)} className="h-12 w-12 rounded-xl bg-[#e7e7e7]" />
          ))}
        </div>
        <Button className="h-11 w-full" disabled>
          Verify Now
        </Button>
      </div>
    </AuthShell>
  );
}

function OtpVerificationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const [otpValues, setOtpValues] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const otp = useMemo(() => otpValues.join(""), [otpValues]);

  const verifyMutation = useMutation({
    mutationFn: verifyOtp,
    onSuccess: (response) => {
      toast.success(response.message || "OTP verified");
      router.push(
        `/reset-password?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otp)}`
      );
    },
    onError: (error) => {
      toast.error(getApiMessage(error, "OTP verification failed"));
    },
  });

  const onChangeOtp = (index: number, value: string) => {
    const normalized = value.replace(/\D/g, "").slice(-1);
    setOtpValues((current) => {
      const copy = [...current];
      copy[index] = normalized;
      return copy;
    });

    if (normalized && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const onKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !otpValues[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <AuthShell title="OTP Verification">
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (otp.length !== OTP_LENGTH) {
            toast.error("Please enter all 6 OTP digits");
            return;
          }
          if (!email) {
            toast.error("Email is missing. Restart forgot password flow.");
            return;
          }

          verifyMutation.mutate({ email, otp });
        }}
      >
        <div className="flex items-center justify-center gap-3">
          {Array.from({ length: OTP_LENGTH }).map((_, index) => (
            <input
              key={String(index)}
              ref={(node) => {
                inputRefs.current[index] = node;
              }}
              value={otpValues[index]}
              onChange={(event) => onChangeOtp(index, event.target.value)}
              onKeyDown={(event) => onKeyDown(index, event)}
              inputMode="numeric"
              maxLength={1}
              className="h-12 w-12 rounded-xl border border-border bg-input-bg text-center text-lg font-semibold text-foreground outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
            />
          ))}
        </div>

        <Button type="submit" className="h-11 w-full" disabled={verifyMutation.isPending}>
          {verifyMutation.isPending ? "Verifying..." : "Verify Now"}
        </Button>
      </form>
    </AuthShell>
  );
}