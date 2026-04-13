import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async signIn({ user }: { user: any }) {
      const allowedEmails = [
        "pranayagrawal382@gmail.com",
        "pranayagarwal382@gmail.com",
      ];
      
      if (user.email && allowedEmails.includes(user.email.toLowerCase())) {
        return true;
      }
      return false; // Return false to deny access
    },
    async session({ session, token }: { session: any; token: any }) {
      // Add custom info to session if needed
      return session;
    },
  },
  pages: {
    signIn: "/pitchside-manage-x7k9", // Match the admin path
    error: "/pitchside-manage-x7k9", // Error goes back to the login area
  },
  secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || "fallback_secret_for_local_dev",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
