import { fallbackReply } from "../../../lib/fallback";
import { PERSONA_PROMPT } from "../../../lib/persona";
import { getAttitudeFor, getIdentityById, getRelationshipName, getRelationshipNote } from "../../../lib/scenes";

export const runtime = "nodejs";

const MAX_MESSAGES = 12;

function buildTranscript(messages, identity) {
  return messages
    .slice(-MAX_MESSAGES)
    .map((message) => {
      const role = message.role === "assistant" ? "熹贵妃" : identity.label;
      return `${role}：${message.content}`;
    })
    .join("\n");
}

function extractOutputText(data) {
  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  const output = Array.isArray(data.output) ? data.output : [];
  for (const item of output) {
    const content = Array.isArray(item.content) ? item.content : [];
    for (const part of content) {
      if (typeof part.text === "string" && part.text.trim()) {
        return part.text.trim();
      }
    }
  }

  return "";
}

function sanitizeMemory(memory, identity, relationship) {
  const source = memory && typeof memory === "object" ? memory : {};
  const userTitle = typeof source.userTitle === "string" && source.userTitle.trim()
    ? source.userTitle.trim().slice(0, 16)
    : identity.label;
  const lastTopic = typeof source.lastTopic === "string" && source.lastTopic.trim()
    ? source.lastTopic.trim().slice(0, 80)
    : "暂无";
  const attitude = typeof source.attitude === "string" && source.attitude.trim()
    ? source.attitude.trim().slice(0, 40)
    : getAttitudeFor(identity.id, relationship);

  return {
    userTitle,
    lastTopic,
    attitude,
    relationship
  };
}

export async function POST(request) {
  let body;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "请求格式不正确" }, { status: 400 });
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  const identity = getIdentityById(body.identityId);
  const relationship = getRelationshipName(body.relationship || identity.initialRelationship);
  const memory = sanitizeMemory(body.memory, identity, relationship);
  const lastUserMessage = [...messages]
    .reverse()
    .find((message) => message.role === "user" && message.content?.trim());

  if (!lastUserMessage) {
    return Response.json({ error: "请先说一句话" }, { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return Response.json({
      reply: fallbackReply(lastUserMessage.content, identity.id, relationship, memory),
      mode: "fallback"
    });
  }

  const transcript = buildTranscript(messages, identity);
  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
  const scenePrompt = [
    `【当前来客身份】${identity.label}`,
    `【当前场景】${identity.sceneTitle}：${identity.description}`,
    `【身份话术】${identity.promptRule}`,
    `【关系状态】${relationship}：${getRelationshipNote(relationship)}`,
    `【长期记忆】称呼对方为“${memory.userTitle}”；上次聊过“${memory.lastTopic}”；甄嬛对对方的态度是“${memory.attitude}”。`,
    "使用长期记忆自然延续关系和称呼；不要直接说“根据记忆”或“系统记录”。若记忆与当前输入冲突，以当前输入为准。",
    "关系状态只用于调整语气，不要在回复中直说“关系状态”。"
  ].join("\n");

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      instructions: `${PERSONA_PROMPT}\n\n${scenePrompt}`,
      input: `以下是当前对话。请严格以熹贵妃甄嬛的身份，只回复最后一位来客。\n\n${transcript}`,
      temperature: 0.85,
      max_output_tokens: 220
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("OpenAI API error:", errorText);
    return Response.json({ error: "娘娘此刻不便回话，请稍后再试" }, { status: 502 });
  }

  const data = await response.json();
  const reply = extractOutputText(data);

  if (!reply) {
    return Response.json({ error: "未能生成回复" }, { status: 502 });
  }

  return Response.json({ reply });
}
