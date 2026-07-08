"use client";

import { useEffect, useRef, useState } from "react";

const starterMessages = [
  {
    role: "assistant",
    content: "今儿风静，茶也温着。你既来了，便坐下说话吧。"
  }
];

const quickPrompts = [
  "臣妾给娘娘请安。",
  "嬛嬛，朕今日得空，特意来看看你。",
  "你不过是仗着皇上宠你！",
  "娘娘，奴婢怕做不好……"
];

export default function Home() {
  const [messages, setMessages] = useState(starterMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  async function sendMessage(text) {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const nextMessages = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "回复暂不可用");
      }

      setMessages((current) => [
        ...current,
        { role: "assistant", content: data.reply }
      ]);
    } catch (err) {
      setError(err.message || "回复暂不可用");
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    sendMessage(input);
  }

  return (
    <main className="shell">
      <section className="portrait" aria-label="角色信息">
        <div className="moon" />
        <div className="palace-lines">
          <span />
          <span />
          <span />
        </div>
        <div className="portrait-panel">
          <div className="avatar" aria-hidden="true">
            <span>熹</span>
          </div>
          <p className="eyebrow">回宫后 · 熹贵妃</p>
          <h1>甄嬛</h1>
          <p className="intro">温婉周全，话里有话。开口不动声色，落句自有分寸。</p>
          <div className="traits">
            <span>温柔带刺</span>
            <span>礼数周全</span>
            <span>短句对话</span>
          </div>
        </div>
      </section>

      <section className="chat" aria-label="对话窗口">
        <header className="chat-header">
          <div>
            <p className="eyebrow">AI 虚拟人设</p>
            <h2>与熹贵妃对话</h2>
          </div>
          <button
            className="icon-button"
            type="button"
            aria-label="清空对话"
            title="清空对话"
            onClick={() => {
              setMessages(starterMessages);
              setError("");
            }}
          >
            ↺
          </button>
        </header>

        <div className="messages" role="log" aria-live="polite">
          {messages.map((message, index) => (
            <article
              className={`message ${message.role}`}
              key={`${message.role}-${index}`}
            >
              <span className="speaker">
                {message.role === "assistant" ? "熹贵妃" : "你"}
              </span>
              <p>{message.content}</p>
            </article>
          ))}
          {isLoading && (
            <article className="message assistant">
              <span className="speaker">熹贵妃</span>
              <p>且容本宫想想。</p>
            </article>
          )}
          <div ref={endRef} />
        </div>

        {error && <p className="error">{error}</p>}

        <div className="quick-prompts" aria-label="快捷输入">
          {quickPrompts.map((prompt) => (
            <button
              type="button"
              key={prompt}
              onClick={() => sendMessage(prompt)}
              disabled={isLoading}
            >
              {prompt}
            </button>
          ))}
        </div>

        <form className="composer" onSubmit={handleSubmit}>
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="输入一句话，开始对话"
            aria-label="输入对话内容"
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading || !input.trim()}>
            发送
          </button>
        </form>
      </section>
    </main>
  );
}
