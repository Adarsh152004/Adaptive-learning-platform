import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import axios from "axios";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const res = await axios.post("http://localhost:8001/auth/login", {
            email: credentials?.email,
            password: credentials?.password,
          });

          if (res.data && res.data.token) {
            return {
              id: res.data.user.email,
              name: res.data.user.name,
              email: res.data.user.email,
              image: res.data.token, // Storing token in image field for simplicity or custom session
            };
          }
          return null;
        } catch (error) {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.image = token.accessToken as string;
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "supersecret",
});

export { handler as GET, handler as POST };
