import type { Metadata } from "next";
import "../client/src/index.css";

export const metadata: Metadata = {
  title: "SangraH",
  description: "Decorative glass objects for calm, elegant homes."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
