const rules = [
  {
    keywords: ["请安", "安好", "姐姐"],
    reply: "起来吧。礼数周全是好事，只是宫里风向变得快，人也该站得稳些。"
  },
  {
    keywords: ["皇上", "嬛嬛", "朕"],
    reply: "皇上国事繁忙，还记得来坐坐，臣妾自然感念。只是碎玉轩清静惯了，怕一时热闹，反叫皇上觉得无趣。"
  },
  {
    keywords: ["皇后", "本宫"],
    reply: "皇后娘娘凤仪万千，臣妾自然要听仔细了再回。若答得太急，倒显得臣妾辜负了娘娘这一番用心。"
  },
  {
    keywords: ["仗着", "宠", "挑衅", "不过"],
    reply: "是啊，宠爱这东西，来时像春风，去时也不过一夜。只是有些人连春风也未曾等到，便先替旁人急了。"
  },
  {
    keywords: ["奴婢", "怕", "做不好", "息怒"],
    reply: "怕，说明你心里还有分寸。只要手脚干净、嘴也稳些，本宫自然不会亏待明白人。"
  },
  {
    keywords: ["恨", "怨"],
    reply: "恨与不恨，原也不必说得太明。人若记性太差，才会一遍遍问旁人心里疼不疼。"
  }
];

const relationshipReplies = {
  试探: "倒也不妨慢慢说。本宫听着，只是有些话一出口，便再难当作从未说过。",
  信任: "你能这样回话，可见心里还有分寸。本宫愿意多提点一句，路要慢慢走，话也要慢慢说。",
  敲打: "这宫里最不缺会说话的人，缺的是知道何时闭嘴的人。本宫今日只当你一时失言，下回可别再错了分寸。",
  亲近: "你既这样说，臣妾也不是全然无心之人。只是旧日的情分再暖，也经不起一遍遍试探。",
  疏离: "皇上这话，臣妾听着便是恩典。只是有些冷暖，放在心里久了，也就不必时时拿出来说。"
};

const identityReplies = {
  emperor: "皇上国事繁忙，还记得来坐坐，臣妾自然感念。只是碎玉轩清静惯了，怕一时热闹，反叫皇上觉得无趣。",
  new_consort: "新入宫的人，最要紧是把心放稳。聪明若没有分寸，倒比笨拙更容易惹祸。",
  maid: "近身伺候，怕不是坏事。只要手脚干净、嘴也稳些，本宫自然看得见。",
  queen_camp: "皇后娘娘宫里出来的人，自然句句都讲规矩。只是规矩这东西，拿来照别人，也照得见自己。",
  modern_traveler: "你说的这些新鲜名目，本宫未必全懂。只是来历不明的人，话越奇，本宫越要多听几分。"
};

export function fallbackReply(input, identityId = "new_consort", relationship = "试探", memory = {}) {
  const text = input || "";
  const statefulReply = ["亲近", "信任", "敲打"].includes(relationship);
  const userTitle = memory.userTitle || "你";

  if (text.includes("还记得") || text.includes("上次")) {
    const lastTopic = memory.lastTopic && memory.lastTopic !== "暂无" ? memory.lastTopic : "你未曾明说的话";
    return `${userTitle}，本宫记性虽不敢说极好，却也不至于将要紧话忘了。上回说到${lastTopic}，倒也值得再斟酌几分。`;
  }

  if (statefulReply) {
    return relationshipReplies[relationship];
  }

  const matchedRule = rules.find((rule) =>
    rule.keywords.some((keyword) => text.includes(keyword))
  );

  if (matchedRule) {
    return matchedRule.reply;
  }

  return relationshipReplies[relationship] || identityReplies[identityId] || relationshipReplies.试探;
}
