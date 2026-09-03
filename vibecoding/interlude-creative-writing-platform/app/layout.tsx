import type { Metadata } from "next";
import "./cinematic.css";

export const metadata: Metadata = {
  title: {
    default: "幕间 · 作者的角色剧场",
    template: "%s · 幕间",
  },
  description: "让角色在文字之外继续生活。",
  openGraph: {
    title: "幕间 · 作者的角色剧场",
    description: "让角色在文字之外继续生活。",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "幕间角色记忆星图" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "幕间 · 作者的角色剧场",
    description: "让角色在文字之外继续生活。",
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
