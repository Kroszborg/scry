import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Scry — AI Document Scanner",
  description:
    "Scan any document and instantly extract text, generate AI summaries, create flashcards, and export to PDF. The CamScanner alternative powered by Gemini AI.",
  keywords: ["document scanner", "OCR", "AI", "flashcards", "PDF", "study app"],
  openGraph: {
    title: "Scry — AI Document Scanner",
    description: "Scan. Extract. Understand. Powered by Gemini AI.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
