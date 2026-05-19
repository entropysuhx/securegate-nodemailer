import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

import { loginRatelimit } from "./ratelimit";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        const headers = req?.headers && typeof req.headers.get === 'function'
          ? req.headers
          : {
              get: (name: string) => {
                if (!req?.headers) return null;
                const normalized = name.toLowerCase();
                const key = Object.keys(req.headers).find(k => k.toLowerCase() === normalized);
                return key ? (req.headers[key] as string) : null;
              }
            };

        const ip = headers.get('x-forwarded-for') ??
                   headers.get('x-real-ip') ??
                   '127.0.0.1';

        const { success } = await loginRatelimit.limit(ip);
        if (!success) {
          throw new Error("TooManyRequests");
        }

        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user) {
          throw new Error("CredentialsSignin");
        }

        if (!user.emailVerified) {
          throw new Error("EmailNotVerified");
        }

        const passwordMatch = await bcrypt.compare(credentials.password, user.password);

        if (!passwordMatch) {
          throw new Error("WrongPassword");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified,
        };
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.emailVerified = user.emailVerified;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.emailVerified = token.emailVerified as Date | null;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
  }
};
