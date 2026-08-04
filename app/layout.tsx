import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "漫游签 · 随机旅行路线规划",
    template: "%s · 漫游签",
  },
  description: "点亮去过的县城，按预算、日期和旅行预期生成有依据、可调整的个性化路线。",
  applicationName: "漫游签",
  openGraph: {
    title: "漫游签 · 下一程，交给一点灵感",
    description: "点亮中国旅行足迹，生成属于你的随机路线。",
    type: "website",
    locale: "zh_CN",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
