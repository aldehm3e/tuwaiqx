import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TuwaiqX Admin",
  description:
    "A complete standalone self-hosted chatbot solution for NGOs, universities, charities, schools, public organizations, and nonprofits."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
