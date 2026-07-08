import "./globals.css";

export const metadata = {
  title: "熹贵妃 AI 对话",
  description: "打开即聊的熹贵妃 AI 虚拟人设聊天应用"
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
