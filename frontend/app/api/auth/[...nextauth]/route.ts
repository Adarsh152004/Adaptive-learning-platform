import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import axios from "axios";

// Log to see if this file is being loaded by Next.js
console.log("Initializing NextAuth handler...");

const authOptions = {
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
              id: res.data.user.id,
              name: res.data.user.name,
              email: res.data.user.email,
              role: res.data.user.role,
              accessToken: res.data.token,
            };
          }
          return null;
        } catch (error: any) {
          const detail = error.response?.data?.detail;
          if (detail === "EMAIL_NOT_CONFIRMED") {
            throw new Error("EMAIL_NOT_CONFIRMED");
          }
          throw new Error("Invalid email or password");
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.accessToken = user.accessToken;
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        (session.user as any).accessToken = token.accessToken;
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "supersecret",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
