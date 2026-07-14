"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Mail } from "lucide-react";
import { toast } from "sonner";

import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { forgotPassword, getApiMessage } from "@/lib/api";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  const forgotMutation = useMutation({
    mutationFn: forgotPassword,
    onSuccess: (response) => {
      toast.success(response.message || "OTP sent to your email");
      router.push(`/otp-verification?email=${encodeURIComponent(email)}`);
    },
    onError: (error) => {
      toast.error(getApiMessage(error, "Unable to send OTP"));
    },
  });

  return (
    <AuthShell title="Forgot Password">
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          forgotMutation.mutate(email.trim());
        }}
      >
        <div className="relative">
          <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#9a9a9a]" />
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="pl-10"
            required
          />
        </div>

        <Button type="submit" className="h-11 w-full" disabled={forgotMutation.isPending}>
          {forgotMutation.isPending ? "Sending..." : "Send OTP"}
        </Button>
      </form>
    </AuthShell>
  );
}