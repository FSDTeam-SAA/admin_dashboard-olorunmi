"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { toast } from "sonner";

import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [email, setEmail] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("rememberedEmail") ?? "" : ""
  );
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(() =>
    typeof window !== "undefined" ? Boolean(localStorage.getItem("rememberedEmail")) : false
  );
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated" && session?.role === "admin") {
      router.replace("/user-management");
    }
  }, [router, session, status]);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setLoading(true);

    const response = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: "/user-management",
    });

    setLoading(false);

    if (!response?.ok) {
      toast.error("Invalid admin credentials");
      return;
    }

    toast.success("Login successful");
    router.push("/user-management");
    router.refresh();

    if (remember) {
      localStorage.setItem("rememberedEmail", email);
    } else {
      localStorage.removeItem("rememberedEmail");
    }
  };

  return (
    <AuthShell title="Login to Your Account">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="relative">
          <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#9a9a9a]" />
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="pl-10"
          />
        </div>

        <div className="relative">
          <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#9a9a9a]" />
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            className="pl-10 pr-10"
          />
          <button
            type="button"
            className="absolute top-1/2 right-3 -translate-y-1/2 text-[#8f8f8f]"
            onClick={() => setShowPassword((previous) => !previous)}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-[#373737]">
            <Checkbox
              checked={remember}
              onCheckedChange={(value) => setRemember(Boolean(value))}
            />
            Remember me
          </label>

          <Link href="/forgot-password" className="text-sm text-[#a79663] hover:underline">
            Forgot Password?
          </Link>
        </div>

        <Button type="submit" className="h-11 w-full" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </Button>
      </form>
    </AuthShell>
  );
}
