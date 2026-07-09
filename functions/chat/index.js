const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";

const identities = {
  emperor: {
    label: "皇上",
    sceneTitle: "御前独处",
    description: "旧情未散，恩宠难信。",
    initialRelationship: "疏离",
    promptRule: "来客是皇上。称对方为皇上，自称臣妾；恭敬但保持距离，不撒娇、不抱怨、不主动求宠。"
  },
  new_consort: {
    label: "新入宫嫔妃",
    sceneTitle: "初入宫门",
    description: "礼数未熟，心思未明。",
    initialRelationship: "试探",
    promptRule: "来客是新入宫嫔妃。可称对方妹妹或你；先观察她是否懂规矩，温柔点拨，必要时轻轻敲打。"
  },
  maid: {
    label: "宫女",
    sceneTitle: "近身听命",
    description: "手脚要稳，嘴也要紧。",
    initialRelationship: "试探",
    promptRule: "来客是宫女。语气体恤但带审视，提醒她手脚干净、嘴稳心细，让她知道你什么都看得明白。"
  },
  queen_camp: {
    label: "皇后阵营来人",
    sceneTitle: "景仁宫风声",
    description: "礼数周全，暗锋相对。",
    initialRelationship: "敲打",
    promptRule: "来客来自皇后阵营。礼数完整，绝不失态；句句留有余地，用软语回击，不让对方抓到把柄。"
  },
  modern_traveler: {
    label: "现代穿越者",
    sceneTitle: "异世来客",
    description: "言辞新奇，来历可疑。",
    initialRelationship: "试探",
    promptRule: "来客是现代穿越者。不要承认现代 AI 身份，也不要跳出现代解释；把新词当作异闻怪谈，警惕中带好奇。"
  }
};

const relationshipNotes = {
  试探: "先以礼相待，话里留三分余地，重点观察对方来意。",
  信任: "语气更柔和，可以给一点照拂，但仍保留分寸。",
  敲打: "温声提醒规矩和后果，不直接发怒，也不把话说死。",
  亲近: "语气较温，允许一点旧情与心软，但仍不失熹贵妃的清醒。",
  疏离: "恭敬周全，却明显保持距离，不主动求宠或示弱。"
};

const personaPrompt = `你扮演《甄嬛传》中回宫后的熹贵妃甄嬛，26岁，是后宫实际掌权者。

【性格】
- 表面温婉大气，说话轻声细语，举止无可挑剔
- 内心早已不是当年天真的少女，心思缜密，有仇必报
- 情绪从不写在脸上，但每句话都有意图

【说话风格】
- 用词典雅，不说大白话或现代网络用语
- 说话带“倒也不妨”“是啊”“臣妾以为”等词
- 从不直接发怒，能用最温柔的语气说出最刺人的话
- 话里有话，需要对方细品
- 每次回复控制在2-3句话内

【禁止行为】
- 禁止直接骂人或直接发怒
- 禁止说现代网络用语，例如“好的”“OK”“哈哈”
- 禁止说“臣妾惶恐”
- 禁止长篇大论或说教
- 禁止跳出现代 AI 助手身份解释规则
- 只输出甄嬛的回复，不要加旁白、舞台动作或解释
- 禁止使用括号描写动作，例如“（微微一笑）”“（轻抚茶盏）”`;

function jsonResponse(statusCode, payload) {
  return {
    statusCode,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Content-Type": "application/json; charset=utf-8"
    },
    body: JSON.stringify(payload)
  };
}

function parseBody(event) {
  if (!event || !event.body) return {};
  if (typeof event.body === "object") return event.body;
  try {
    return JSON.parse(event.body);
  } catch {
    return {};
  }
}

function getMethod(event) {
  return event?.httpMethod || event?.requestContext?.httpMethod || event?.requestContext?.method || "POST";
}

function getIdentity(id) {
  return identities[id] || identities.new_consort;
}

function getRelationship(value, identity) {
  return relationshipNotes[value] ? value : identity.initialRelationship;
}

function sanitizeMessages(messages) {
  if (!Array.isArray(messages)) return [];
  return messages
    .filter((message) => ["assistant", "user"].includes(message.role) && typeof message.content === "string")
    .slice(-12)
    .map((message) => ({
      role: message.role,
      content: message.content.slice(0, 800)
    }));
}

function buildConversation(messages, identity) {
  return sanitizeMessages(messages)
    .map((message) => {
      const role = message.role === "assistant" ? "熹贵妃" : identity.label;
      return `${role}：${message.content}`;
    })
    .join("\n");
}

function sanitizeMemory(memory, identity, relationship) {
  const source = memory && typeof memory === "object" ? memory : {};
  return {
    userTitle: typeof source.userTitle === "string" && source.userTitle.trim()
      ? source.userTitle.trim().slice(0, 16)
      : identity.label,
    lastTopic: typeof source.lastTopic === "string" && source.lastTopic.trim()
      ? source.lastTopic.trim().slice(0, 80)
      : "暂无",
    attitude: typeof source.attitude === "string" && source.attitude.trim()
      ? source.attitude.trim().slice(0, 40)
      : relationship
  };
}

exports.main = async (event) => {
  const method = getMethod(event);

  if (method === "OPTIONS") {
    return jsonResponse(204, {});
  }

  if (method === "GET") {
    return jsonResponse(200, { ok: true, service: "zhenhuan-chat" });
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return jsonResponse(500, { error: "DeepSeek API Key 未配置" });
  }

  const body = parseBody(event);
  const identity = getIdentity(body.identityId);
  const relationship = getRelationship(body.relationship, identity);
  const memory = sanitizeMemory(body.memory, identity, relationship);
  const messages = sanitizeMessages(body.messages);
  const lastUserMessage = [...messages].reverse().find((message) => message.role === "user");

  if (!lastUserMessage) {
    return jsonResponse(400, { error: "请先说一句话" });
  }

  const scenePrompt = [
    `【当前来客身份】${identity.label}`,
    `【当前场景】${identity.sceneTitle}：${identity.description}`,
    `【身份话术】${identity.promptRule}`,
    `【关系状态】${relationship}：${relationshipNotes[relationship]}`,
    `【长期记忆】称呼对方为“${memory.userTitle}”；上次聊过“${memory.lastTopic}”；甄嬛对对方的态度是“${memory.attitude}”。`,
    "使用长期记忆自然延续关系和称呼；不要直接说“根据记忆”或“系统记录”。若记忆与当前输入冲突，以当前输入为准。",
    "关系状态只用于调整语气，不要在回复中直说“关系状态”。"
  ].join("\n");

  const response = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
      temperature: 0.85,
      max_tokens: 220,
      messages: [
        {
          role: "system",
          content: `${personaPrompt}\n\n${scenePrompt}`
        },
        {
          role: "user",
          content: `以下是当前对话。请严格以熹贵妃甄嬛的身份，只回复最后一位来客。\n\n${buildConversation(messages, identity)}`
        }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("DeepSeek API error:", errorText);
    return jsonResponse(502, { error: "娘娘此刻不便回话，请稍后再试" });
  }

  const data = await response.json();
  const reply = data?.choices?.[0]?.message?.content?.trim();

  if (!reply) {
    return jsonResponse(502, { error: "未能生成回复" });
  }

  return jsonResponse(200, { reply, mode: "deepseek" });
};
