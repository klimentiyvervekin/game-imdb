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
      // 1 в момент логина - создаю и обновляю юзера и кладу mongo _id в token
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
              provider: "google",
              providerAccountId: profile.sub || "",
            },
          },
          { new: true, upsert: true }
        );

        token.dbUserId = String(dbUser._id);
        token.email = dbUser.email;
        return token;
      }

      // 2 страховка: если токен старый/кривой и dbUserId нет,
      // но email есть — достаём юзера из Mongo и кладём _id
      if (!token.dbUserId && token.email) {
        await dbConnect();
        const dbUser = await User.findOne({ email: token.email })
          .select("_id email")
          .lean();
        if (dbUser) {
          token.dbUserId = String(dbUser._id);
          token.email = dbUser.email;
        }
      }

      return token;
    },

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
