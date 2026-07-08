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

export function fallbackReply(input) {
  const text = input || "";
  const matchedRule = rules.find((rule) =>
    rule.keywords.some((keyword) => text.includes(keyword))
  );

  if (matchedRule) {
    return matchedRule.reply;
  }

  return "倒也不妨慢慢说。本宫听着，只是有些话一出口，便再难当作从未说过。";
}
