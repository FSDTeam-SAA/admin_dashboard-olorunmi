import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { decodeJwtExpiry } from "@/lib/utils";
import type { ApiResponse, LoginResponse } from "@/types/api";

const baseUrlRaw =
  process.env.NEXTPUBLICBASEURL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  "http://localhost:5000";
const apiBaseUrl = baseUrlRaw.endsWith("/")
  ? `${baseUrlRaw}api/v1`
  : `${baseUrlRaw}/api/v1`;

const refreshAccessToken = async (token: {
  refreshToken?: string;
  role?: string;
  _id?: string;
  user?: {
    name?: string;
    email?: string;
    userId?: string;
    avatar?: {
      url?: string;
    };
  };
}) => {
  try {
    if (!token.refreshToken) {
      return {
        ...token,
        error: "RefreshTokenMissing",
      };
    }

    const response = await fetch(`${apiBaseUrl}/auth/refresh-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken: token.refreshToken }),
    });

    if (!response.ok) {
      throw new Error("Unable to refresh token");
    }

    const body = (await response.json()) as ApiResponse<{
      accessToken: string;
      refreshToken: string;
    }>;

    const expiresAt = decodeJwtExpiry(body.data.accessToken);

    return {
      ...token,
      accessToken: body.data.accessToken,
      refreshToken: body.data.refreshToken,
      accessTokenExpires: expiresAt ?? Date.now() + 10 * 60 * 1000,
    };
  } catch {
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
};

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim();
        const password = credentials?.password;

        if (!email || !password) {
          return null;
        }

        const response = await fetch(`${apiBaseUrl}/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
          return null;
        }

        const body = (await response.json()) as ApiResponse<LoginResponse>;

        if (!body.success || body.data.role !== "admin") {
          return null;
        }

        return {
          id: body.data._id,
          _id: body.data._id,
          accessToken: body.data.accessToken,
          refreshToken: body.data.refreshToken,
          role: body.data.role,
          user: body.data.user,
          name: body.data.user?.name,
          email: body.data.user?.email,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const expiresAt = decodeJwtExpiry(user.accessToken);
        return {
          ...token,
          accessToken: user.accessToken,
          refreshToken: user.refreshToken,
          role: user.role,
          _id: user._id,
          user: user.user,
          accessTokenExpires: expiresAt ?? Date.now() + 10 * 60 * 1000,
        };
      }

      if (token.accessToken && token.accessTokenExpires) {
        const threshold = 60 * 1000;
        if (Date.now() < token.accessTokenExpires - threshold) {
          return token;
        }
      }

      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.refreshToken = token.refreshToken;
      session.role = token.role;
      session.userId = token._id;
      session.error = token.error;
      session.user = {
        ...session.user,
        name: token.user?.name,
        email: token.user?.email,
        userId: token.user?.userId,
        _id: token._id,
        role: token.role,
        avatarUrl: token.user?.avatar?.url,
      };

      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
