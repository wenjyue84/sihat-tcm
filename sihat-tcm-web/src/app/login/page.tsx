import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Login",
  description:
    "Sign in to Sihat TCM to access your personalized Traditional Chinese Medicine health dashboard, track your diagnosis history, and get AI-powered health insights.",
  openGraph: {
    title: "Login | Sihat TCM",
    description: "Sign in to access your personalized TCM health dashboard and diagnosis history.",
    url: "./",
  },
  robots: {
    index: false, // Login pages typically shouldn't be indexed
    follow: true,
  },
};

export default function LoginPage() {
  return <LoginForm />;
}
