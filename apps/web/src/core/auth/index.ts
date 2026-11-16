import "server-only";
import NextAuth, { type DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";
import Discord from "next-auth/providers/discord";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Adapter, AdapterUser } from "next-auth/adapters";
import { prisma } from "@/core/db/prisma";
import { emit } from "@/core/events";
import { generateReferralCode } from "./referral-code";
import type { Role } from "@/generated/prisma/client";
import "@/modules";

declare module "next-auth" {
  interface Session {
    user: { id: string; role: Role; referralCode: string } & DefaultSession["user"];
  }
}

const baseAdapter = PrismaAdapter(prisma) as Adapter;

/** User.referralCode is required, so fill it in when Auth.js creates a user. */
const adapter: Adapter = {
  ...baseAdapter,
  async createUser(data: AdapterUser) {
    const { id: _ignored, ...rest } = data;
    void _ignored;
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const user = await prisma.user.create({
          data: { ...rest, referralCode: generateReferralCode() },
        });
        return user as AdapterUser;
      } catch (err) {
        // Retry only on a referralCode collision
        if ((err as { code?: string }).code !== "P2002" || attempt === 4) throw err;
      }
    }
    throw new Error("unreachable");
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter,
  session: { strategy: "database" },
  providers: [
    Google,
    Discord({
      // guilds.join lets the bot add the player to our Discord server (week 2)
      authorization: { params: { scope: "identify email guilds.join" } },
    }),
  ],
  // Linking Discord to a Google account = signing in with Discord while
  // already signed in; Auth.js attaches the new Account to the current user.
  pages: { signIn: "/th/login" },
  callbacks: {
    async session({ session, user }) {
      const u = user as AdapterUser & { role: Role; referralCode: string };
      session.user.id = u.id;
      session.user.role = u.role;
      session.user.referralCode = u.referralCode;
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (user.id) await emit("user.registered", { userId: user.id, provider: "oauth" });
    },
  },
});
