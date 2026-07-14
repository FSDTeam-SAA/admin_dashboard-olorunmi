"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff, Lock } from "lucide-react";
import { toast } from "sonner";

import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getApiMessage, resetPassword } from "@/lib/api";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordFallback() {
  return (
    <AuthShell
      title="Reset Password"
      subtitle="Enter your new password and confirm password"
    >
      <div className="space-y-4">
        <div className="h-11 rounded-xl bg-[#e7e7e7]" />
        <div className="h-11 rounded-xl bg-[#e7e7e7]" />
        <Button className="h-11 w-full" disabled>
          Continue
        </Button>
      </div>
    </AuthShell>
  );
}

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const otp = searchParams.get("otp") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const resetMutation = useMutation({
    mutationFn: resetPassword,
    onSuccess: (response) => {
      toast.success(response.message || "Password reset successfully");
      router.push("/success");
    },
    onError: (error) => {
      toast.error(getApiMessage(error, "Unable to reset password"));
    },
  });

  return (
    <AuthShell
      title="Reset Password"
      subtitle="Enter your new password and confirm password"
    >
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();

          if (!email || !otp) {
            toast.error("Session expired. Restart forgot password flow.");
            return;
          }

          if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
          }

          resetMutation.mutate({ email, otp, password });
        }}
      >
        <div className="relative">
          <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#9a9a9a]" />
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Create Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="pl-10 pr-10"
            required
          />
          <button
            type="button"
            className="absolute top-1/2 right-3 -translate-y-1/2 text-[#8f8f8f]"
            onClick={() => setShowPassword((previous) => !previous)}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>

        <div className="relative">
          <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#9a9a9a]" />
          <Input
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="pl-10 pr-10"
            required
          />
          <button
            type="button"
            className="absolute top-1/2 right-3 -translate-y-1/2 text-[#8f8f8f]"
            onClick={() => setShowConfirmPassword((previous) => !previous)}
          >
            {showConfirmPassword ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        </div>

        <Button type="submit" className="h-11 w-full" disabled={resetMutation.isPending}>
          {resetMutation.isPending ? "Updating..." : "Continue"}
        </Button>
      </form>
    </AuthShell>
  );
}