"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { IDENTITIES, getIdentityById } from "../lib/scenes";

function getRelationshipAfterTurn(identityId, currentRelationship, messages, latestText) {
  const text = latestText || "";
  const userTurns = messages.filter((message) => message.role === "user").length;
  const hostile = ["仗着", "恃宠", "凭什么", "不过", "少得意", "恨你", "讨厌", "本宫劝"].some((word) =>
    text.includes(word)
  );
  const deferential = ["请安", "娘娘", "奴婢", "臣妾", "不敢", "谨遵", "谢娘娘", "怕"].some((word) =>
    text.includes(word)
  );
  const affectionate = ["想你", "念你", "冷落", "真心", "陪你", "亏欠", "喜欢"].some((word) =>
    text.includes(word)
  );
  const strange = ["穿越", "现代", "手机", "互联网", "AI", "机器人", "以后"].some((word) =>
    text.includes(word)
  );

  if (hostile) return "敲打";

  if (identityId === "emperor") {
    if (affectionate && userTurns >= 2) return "亲近";
    if (userTurns >= 4 && currentRelationship !== "敲打") return "亲近";
    return "疏离";
  }

  if (identityId === "queen_camp") {
    if (deferential && userTurns >= 4) return "试探";
    return "敲打";
  }

  if (identityId === "maid") {
    if (deferential && userTurns >= 2) return "信任";
    return userTurns >= 4 ? "信任" : "试探";
  }

  if (identityId === "modern_traveler") {
    if (strange) return userTurns >= 3 && deferential ? "信任" : "试探";
    return userTurns >= 4 && deferential ? "信任" : "试探";
  }

  if (identityId === "new_consort") {
    if (deferential && userTurns >= 3) return "信任";
    return userTurns >= 4 ? "信任" : "试探";
  }

  return currentRelationship;
}

export default function Home() {
  const [selectedIdentityId, setSelectedIdentityId] = useState("");
  const [relationship, setRelationship] = useState("试探");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef(null);

  const selectedIdentity = useMemo(
    () => (selectedIdentityId ? getIdentityById(selectedIdentityId) : null),
    [selectedIdentityId]
  );

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  function beginScene(identityId) {
    const identity = getIdentityById(identityId);
    setSelectedIdentityId(identity.id);
    setRelationship(identity.initialRelationship);
    setMessages([{ role: "assistant", content: identity.opener }]);
    setInput("");
    setError("");
  }

  function resetCurrentScene() {
    if (!selectedIdentity) return;
    setRelationship(selectedIdentity.initialRelationship);
    setMessages([{ role: "assistant", content: selectedIdentity.opener }]);
    setInput("");
    setError("");
  }

  function returnToIdentitySelect() {
    setSelectedIdentityId("");
    setRelationship("试探");
    setMessages([]);
    setInput("");
    setError("");
  }

  async function sendMessage(text) {
    const trimmed = text.trim();
    if (!trimmed || isLoading || !selectedIdentity) return;

    const nextMessages = [...messages, { role: "user", content: trimmed }];
    const nextRelationship = getRelationshipAfterTurn(
      selectedIdentity.id,
      relationship,
      nextMessages,
      trimmed
    );

    setMessages(nextMessages);
    setRelationship(nextRelationship);
    setInput("");
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages,
          identityId: selectedIdentity.id,
          relationship: nextRelationship
        })
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
            <span>场景身份</span>
            <span>关系流转</span>
            <span>短句对话</span>
          </div>
        </div>
      </section>

      <section className={`chat ${selectedIdentity ? "" : "setup-mode"}`} aria-label="对话窗口">
        <header className="chat-header">
          <div>
            <p className="eyebrow">
              {selectedIdentity
                ? `${selectedIdentity.sceneTitle} · ${selectedIdentity.label}`
                : "来者身份"}
            </p>
            <h2>{selectedIdentity ? "与熹贵妃对话" : "宫门已开"}</h2>
          </div>
          <div className="header-actions">
            {selectedIdentity && (
              <button
                className="icon-button"
                type="button"
                aria-label="重新选择身份"
                title="重新选择身份"
                onClick={returnToIdentitySelect}
              >
                ⇄
              </button>
            )}
            <button
              className="icon-button"
              type="button"
              aria-label="清空对话"
              title="清空对话"
              onClick={resetCurrentScene}
              disabled={!selectedIdentity}
            >
              ↺
            </button>
          </div>
        </header>

        {!selectedIdentity ? (
          <div className="identity-select">
            <p className="scene-copy">一重宫门，一种说法。来的是谁，话便落在谁身上。</p>
            <div className="identity-grid">
              {IDENTITIES.map((identity) => (
                <button
                  className="identity-card"
                  type="button"
                  key={identity.id}
                  onClick={() => beginScene(identity.id)}
                >
                  <span className="identity-title">{identity.label}</span>
                  <span className="identity-scene">{identity.sceneTitle}</span>
                  <span className="identity-desc">{identity.description}</span>
                  <span className="identity-relation">{identity.initialRelationship}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="status-bar" aria-label="当前关系状态">
              <span>关系</span>
              <strong>{relationship}</strong>
            </div>

            <div className="messages" role="log" aria-live="polite">
              {messages.map((message, index) => (
                <article
                  className={`message ${message.role}`}
                  key={`${message.role}-${index}`}
                >
                  <span className="speaker">
                    {message.role === "assistant" ? "熹贵妃" : selectedIdentity.label}
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
              {selectedIdentity.quickPrompts.map((prompt) => (
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
                placeholder="输入一句话，继续这场局"
                aria-label="输入对话内容"
                disabled={isLoading}
              />
              <button type="submit" disabled={isLoading || !input.trim()}>
                发送
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}
