"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { fallbackReply } from "../lib/fallback";
import { IDENTITIES, getAttitudeFor, getIdentityById } from "../lib/scenes";

const MEMORY_KEY = "zhenhuan_memory_v1";
const RECENT_MESSAGE_LIMIT = 10;
const CHAT_API_URL =
  process.env.NEXT_PUBLIC_CHAT_API_URL ||
  "https://tt1-d2gfab46g22e748ed.service.tcloudbase.com/api/chat";

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

function sanitizeMessages(messages) {
  if (!Array.isArray(messages)) return [];
  return messages
    .filter((message) => ["assistant", "user"].includes(message.role) && typeof message.content === "string")
    .map((message) => ({
      role: message.role,
      content: message.content.slice(0, 500)
    }))
    .slice(-RECENT_MESSAGE_LIMIT);
}

function readMemory() {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(MEMORY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const identity = getIdentityById(parsed.identityId);

    return {
      version: 1,
      identityId: identity.id,
      identityLabel: identity.label,
      userTitle: typeof parsed.userTitle === "string" && parsed.userTitle.trim()
        ? parsed.userTitle.trim().slice(0, 16)
        : identity.label,
      relationship: parsed.relationship || identity.initialRelationship,
      attitude: parsed.attitude || getAttitudeFor(identity.id, parsed.relationship || identity.initialRelationship),
      lastTopic: typeof parsed.lastTopic === "string" ? parsed.lastTopic.slice(0, 80) : "",
      messages: sanitizeMessages(parsed.messages),
      updatedAt: parsed.updatedAt || ""
    };
  } catch {
    return null;
  }
}

function summarizeTopic(text) {
  const compact = text.replace(/\s+/g, " ").trim();
  if (!compact) return "";
  return compact.length > 42 ? `${compact.slice(0, 42)}...` : compact;
}

function detectUserTitle(text) {
  const match = text.match(/(?:我叫|叫我|唤我|称我为|名唤)([^，。,.！!？?\s]{1,10})/);
  return match?.[1]?.trim() || "";
}

function formatMemoryDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
}

export default function Home() {
  const [selectedIdentityId, setSelectedIdentityId] = useState("");
  const [relationship, setRelationship] = useState("试探");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [userTitleInput, setUserTitleInput] = useState("");
  const [savedMemory, setSavedMemory] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef(null);

  const selectedIdentity = useMemo(
    () => (selectedIdentityId ? getIdentityById(selectedIdentityId) : null),
    [selectedIdentityId]
  );
  const activeMemory = selectedIdentity && savedMemory?.identityId === selectedIdentity.id ? savedMemory : null;
  const userTitle = activeMemory?.userTitle || selectedIdentity?.label || "你";
  const attitude = selectedIdentity ? getAttitudeFor(selectedIdentity.id, relationship) : "";

  useEffect(() => {
    const memory = readMemory();
    if (memory) {
      setSavedMemory(memory);
      setUserTitleInput(memory.userTitle);
    }
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  function persistMemory(nextMemory) {
    setSavedMemory(nextMemory);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(MEMORY_KEY, JSON.stringify(nextMemory));
    }
  }

  function forgetMemory() {
    setSavedMemory(null);
    setUserTitleInput("");
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(MEMORY_KEY);
    }
  }

  function buildMemory(identity, overrides = {}) {
    const relationshipName = overrides.relationship || identity.initialRelationship;
    return {
      version: 1,
      identityId: identity.id,
      identityLabel: identity.label,
      userTitle: overrides.userTitle || identity.label,
      relationship: relationshipName,
      attitude: getAttitudeFor(identity.id, relationshipName),
      lastTopic: overrides.lastTopic || "",
      messages: sanitizeMessages(overrides.messages),
      updatedAt: new Date().toISOString()
    };
  }

  function beginScene(identityId, options = {}) {
    const identity = getIdentityById(identityId);
    const nextRelationship = options.relationship || identity.initialRelationship;
    const nextMessages = options.messages?.length
      ? sanitizeMessages(options.messages)
      : [{ role: "assistant", content: identity.opener }];
    const nextUserTitle = (options.userTitle || userTitleInput || identity.label).trim().slice(0, 16);
    const nextMemory = buildMemory(identity, {
      userTitle: nextUserTitle,
      relationship: nextRelationship,
      lastTopic: options.lastTopic || "",
      messages: nextMessages
    });

    setSelectedIdentityId(identity.id);
    setRelationship(nextRelationship);
    setMessages(nextMessages);
    setUserTitleInput(nextUserTitle);
    setInput("");
    setError("");
    persistMemory(nextMemory);
  }

  function resumeMemory() {
    if (!savedMemory) return;
    const identity = getIdentityById(savedMemory.identityId);
    beginScene(identity.id, {
      userTitle: savedMemory.userTitle,
      relationship: savedMemory.relationship || identity.initialRelationship,
      lastTopic: savedMemory.lastTopic,
      messages: savedMemory.messages?.length
        ? savedMemory.messages
        : [{ role: "assistant", content: identity.opener }]
    });
  }

  function resetCurrentScene() {
    if (!selectedIdentity) return;
    beginScene(selectedIdentity.id, {
      userTitle,
      relationship: selectedIdentity.initialRelationship,
      messages: [{ role: "assistant", content: selectedIdentity.opener }]
    });
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

    const detectedTitle = detectUserTitle(trimmed);
    const nextUserTitle = detectedTitle || userTitle;
    const nextMessages = [...messages, { role: "user", content: trimmed }];
    const nextRelationship = getRelationshipAfterTurn(
      selectedIdentity.id,
      relationship,
      nextMessages,
      trimmed
    );
    const nextAttitude = getAttitudeFor(selectedIdentity.id, nextRelationship);
    const memoryPayload = {
      userTitle: nextUserTitle,
      identityLabel: selectedIdentity.label,
      lastTopic: activeMemory?.lastTopic || "",
      attitude: nextAttitude,
      relationship: nextRelationship
    };

    setMessages(nextMessages);
    setRelationship(nextRelationship);
    setInput("");
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch(CHAT_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages,
          identityId: selectedIdentity.id,
          relationship: nextRelationship,
          memory: memoryPayload
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "回复暂不可用");
      }

      const completedMessages = [
        ...nextMessages,
        { role: "assistant", content: data.reply }
      ];
      setMessages(completedMessages);
      setUserTitleInput(nextUserTitle);
      persistMemory(buildMemory(selectedIdentity, {
        userTitle: nextUserTitle,
        relationship: nextRelationship,
        lastTopic: summarizeTopic(trimmed),
        messages: completedMessages
      }));
    } catch (err) {
      const localReply = fallbackReply(trimmed, selectedIdentity.id, nextRelationship, memoryPayload);
      const completedMessages = [
        ...nextMessages,
        { role: "assistant", content: localReply }
      ];
      setMessages(completedMessages);
      setUserTitleInput(nextUserTitle);
      persistMemory(buildMemory(selectedIdentity, {
        userTitle: nextUserTitle,
        relationship: nextRelationship,
        lastTopic: summarizeTopic(trimmed),
        messages: completedMessages
      }));
      setError("当前为本地兜底回复，检查云函数后可恢复动态对话。");
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
            <span>长期记忆</span>
          </div>
          <div className="seal-stamp" aria-hidden="true">
            <span>碎玉轩</span>
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
            {savedMemory && (
              <div className="resume-card">
                <div>
                  <span className="memory-label">上次记忆</span>
                  <strong>{savedMemory.identityLabel} · {savedMemory.userTitle}</strong>
                  <p>
                    {savedMemory.lastTopic
                      ? `上回说到：${savedMemory.lastTopic}`
                      : "还没有留下明确话题。"}
                  </p>
                  <p>{savedMemory.attitude}</p>
                </div>
                <div className="resume-actions">
                  <button type="button" onClick={resumeMemory}>继续上次</button>
                  <button type="button" onClick={forgetMemory}>忘掉</button>
                </div>
              </div>
            )}

            <label className="title-field">
              <span>称呼</span>
              <input
                value={userTitleInput}
                onChange={(event) => setUserTitleInput(event.target.value.slice(0, 16))}
                placeholder="如：小主、苏培盛、阿宁"
              />
            </label>

            <p className="scene-copy">一重宫门，一种说法。来的是谁，话便落在谁身上。</p>
            <div className="divider-ornament" aria-hidden="true">
              <span className="divider-line" />
              <span className="divider-diamond">◆</span>
              <span className="divider-line" />
            </div>
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
              <span>态度</span>
              <strong>{attitude}</strong>
            </div>

            <div className="memory-strip" aria-label="长期记忆">
              <span>称呼：{userTitle}</span>
              <span>
                上次：{activeMemory?.lastTopic || "暂无"}
              </span>
              <span>
                {activeMemory?.updatedAt ? formatMemoryDate(activeMemory.updatedAt) : ""}
              </span>
            </div>

            <div className="messages" role="log" aria-live="polite">
              {messages.map((message, index) => (
                <article
                  className={`message ${message.role}`}
                  key={`${message.role}-${index}`}
                >
                  <span className="speaker">
                    {message.role === "assistant" ? "熹贵妃" : userTitle}
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
