import "./globals.css";

export const metadata = {
  title: "熹贵妃 AI 对话 · 碎玉轩",
  description: "打开即聊的熹贵妃 AI 虚拟人设聊天应用"
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
