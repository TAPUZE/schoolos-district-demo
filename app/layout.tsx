import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "School Innovation Lab",
  description: "Interactive demos for school operations, adaptive learning, AI grading, educational games and ancient-world 3D learning.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
