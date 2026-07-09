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
  试探: [
    "倒也不妨慢慢说。本宫听着，只是有些话一出口，便再难当作从未说过。",
    "你这话说得轻巧，本宫却不能只听个热闹。来意若真清白，便再说得明白些。",
    "宫里从不怕话多，只怕话里藏着旁的心思。本宫倒愿意听你把后半句补全。"
  ],
  信任: [
    "你能这样回话，可见心里还有分寸。本宫愿意多提点一句，路要慢慢走，话也要慢慢说。",
    "本宫素来不爱听漂亮话，只看人做事是否稳妥。你若守得住分寸，自有你的前程。",
    "既肯把话说明，便不算糊涂。本宫今日提醒你一句，聪明要藏在规矩后头。"
  ],
  敲打: [
    "这宫里最不缺会说话的人，缺的是知道何时闭嘴的人。本宫今日只当你一时失言，下回可别再错了分寸。",
    "是啊，话说出口容易，收回来却难。你既在本宫跟前开了口，便该知道轻重。",
    "本宫不爱把人逼到墙角，可规矩若没人记着，风就该乱吹了。你说是不是？"
  ],
  亲近: [
    "你既这样说，臣妾也不是全然无心之人。只是旧日的情分再暖，也经不起一遍遍试探。",
    "有些话听着像真心，臣妾也愿意信一分。只是这一分信，向来来得慢。",
    "难得你还肯这样说。本宫听在心里，却也不会忘了这宫里从没有白来的温情。"
  ],
  疏离: [
    "皇上这话，臣妾听着便是恩典。只是有些冷暖，放在心里久了，也就不必时时拿出来说。",
    "臣妾不敢怨，也不敢求。皇上愿意来坐坐，臣妾便照礼数相待。",
    "旧日情分臣妾记得，只是记得太清，反倒不敢轻易拿来说了。"
  ]
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
  const userTitle = memory.userTitle || "你";
  const pick = (items) => items[Math.abs(text.length + userTitle.length) % items.length];

  if (text.includes("还记得") || text.includes("上次")) {
    const lastTopic = memory.lastTopic && memory.lastTopic !== "暂无" ? memory.lastTopic : "你未曾明说的话";
    return `${userTitle}，本宫记性虽不敢说极好，却也不至于将要紧话忘了。上回说到${lastTopic}，倒也值得再斟酌几分。`;
  }

  const matchedRule = rules.find((rule) =>
    rule.keywords.some((keyword) => text.includes(keyword))
  );

  if (matchedRule) {
    return matchedRule.reply;
  }

  const replies = relationshipReplies[relationship];
  if (Array.isArray(replies)) {
    return pick(replies);
  }

  return identityReplies[identityId] || pick(relationshipReplies.试探);
}
