import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

import { dbConnect } from "../../../db/connect";
import User from "../../../db/models/User";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],

  session: { strategy: "jwt" },

  callbacks: {

    async jwt({ token, account, profile }) {
      // этот блок с account/profile приходит в момент логина
      if (account?.provider === "google" && profile?.email) {
        await dbConnect();

        const email = profile.email;
        const name = profile.name || "User";
        const avatarUrl = profile.picture || "";

        const dbUser = await User.findOneAndUpdate(
          { email },
          {
            $set: {
              name,
              avatarUrl,
              provider: "google",
              providerAccountId: profile.sub || "",
            },
          },
          { new: true, upsert: true }
        );

        // ложу id пользователя из монго в token
        token.dbUserId = String(dbUser._id);
        token.email = dbUser.email;
      }

      return token;
    },

    // пробрасываю в session то что удобно использовать на фронте
    async session({ session, token }) {
      if (session?.user) {
        session.user.dbUserId = token.dbUserId || null;
        session.user.email = token.email || session.user.email || null;
      }
      return session;
    },
  },
};

export default NextAuth(authOptions);
