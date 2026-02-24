// ---------------- Storage helper ----------------
const store = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

// ---------------- Defaults ----------------
const DEFAULTS = {
  largeText: true,
  escortMode: false,
  emergencyContacts: [{ name: "Family 1", phone: "" }],
  whitelist: ["bank", "usps", "amazon", "paypal"]
};

function applySettings(){
  const s = store.get("settings", DEFAULTS);
  document.documentElement.style.fontSize = s.largeText ? "18px" : "16px";
}
applySettings();

// Sidebar active highlight
function setActiveNav(){
  const path = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll("[data-nav]").forEach(a=>{
    if(a.getAttribute("href") === path) a.classList.add("active");
  });
}
document.addEventListener("DOMContentLoaded", setActiveNav);

// ---------------- Risk scoring (prototype rules) ----------------
const RED_FLAGS = [
  { k: "验证码", w: 25 }, { k: "verification code", w: 25 },
  { k: "转账", w: 30 }, { k: "wire", w: 30 }, { k: "gift card", w: 30 },
  { k: "马上", w: 15 }, { k: "urgent", w: 15 }, { k: "立即", w: 15 },
  { k: "点击链接", w: 20 }, { k: "link", w: 15 }, { k: "http", w: 10 },
  { k: "冻结", w: 20 }, { k: "suspended", w: 20 }, { k: "账户", w: 10 },
  { k: "退款", w: 15 }, { k: "refund", w: 15 },
  { k: "远程", w: 25 }, { k: "remote", w: 25 }, { k: "AnyDesk", w: 30 }, { k: "TeamViewer", w: 30 }
];

function scoreText(text){
  const t = (text || "").toLowerCase();
  let score = 0;
  const hits = [];

  for(const f of RED_FLAGS){
    if(t.includes(f.k.toLowerCase())){
      score += f.w;
      hits.push(f.k);
    }
  }
  score = Math.min(100, score);

  let level = "low";
  if(score >= 70) level = "high";
  else if(score >= 35) level = "medium";

  return {score, level, hits};
}

function riskMeta(level){
  if(level === "high") return {cls:"bad", en:"High Risk", zh:"高度疑似诈骗"};
  if(level === "medium") return {cls:"warn", en:"Suspicious", zh:"存在诈骗特征"};
  return {cls:"good", en:"Low Risk", zh:"低风险（仍建议核实）"};
}

function recommendedActions(level){
  if(level === "high"){
    return [
      "立刻停止：不要转账、不要提供验证码、不要安装远程控制软件",
      "用你自己找到的官方电话核实（不要用对方给的号码）",
      "一键联系家人确认"
    ];
  }
  if(level === "medium"){
    return [
      "先不要点链接，先核实来源",
      "看对方是否制造紧迫感或要求敏感信息",
      "需要时联系家人确认"
    ];
  }
  return [
    "看起来风险较低，但仍建议：不点陌生链接、不透露验证码",
    "如果内容涉及钱或账号，优先官方渠道核实"
  ];
}

// ---------------- One-tap family ask ----------------
function buildFamilyMessage(payload){
  const s = store.get("settings", DEFAULTS);
  const c = s.emergencyContacts?.[0];
  const header = "我收到一条可疑信息，先不点链接/不转账。请帮我看一下：";
  const body = (payload || "").slice(0, 900) || "(无内容)";
  const tail = "\n\n（来自 SafeGuard 原型）";
  return { to: c?.phone || "", text: `${header}\n\n${body}${tail}` };
}

function openSMS(to, text){
  const url = `sms:${encodeURIComponent(to)}?&body=${encodeURIComponent(text)}`;
  window.location.href = url;
}

// ---------------- Link check (prototype) ----------------
function checkUrl(url){
  const s = store.get("settings", DEFAULTS);
  const wl = (s.whitelist || []).map(x => x.toLowerCase());
  const u = (url||"").trim().toLowerCase();

  if(!u) return {score:35, level:"medium", reasons:["请输入链接"]};

  const isHttp = u.startsWith("http://") || u.startsWith("https://");
  const hasIp = /https?:\/\/(\d{1,3}\.){3}\d{1,3}/.test(u);
  const hasShort = /(bit\.ly|t\.co|tinyurl\.com|goo\.gl|ow\.ly)/.test(u);

  let score = 0; const reasons = [];
  if(!isHttp){ score += 20; reasons.push("不是标准 http/https 链接"); }
  if(u.startsWith("http://")){ score += 15; reasons.push("使用 http（非加密）"); }
  if(hasIp){ score += 30; reasons.push("链接使用 IP 地址（常见风险信号）"); }
  if(hasShort){ score += 25; reasons.push("短链接（需要展开核实）"); }

  if(wl.some(k => u.includes(k))){
    score = Math.max(0, score - 20);
    reasons.push("命中白名单关键词（风险降低）");
  }

  score = Math.min(100, score);
  let level="low";
  if(score >= 70) level="high";
  else if(score >= 35) level="medium";

  return {score, level, reasons};
}

// ---------------- Scan history ----------------
function addScanHistory(entry){
  const hist = store.get("scanHistory", []);
  hist.unshift(entry);
  store.set("scanHistory", hist.slice(0, 30)); // keep last 30
}

function getScanHistory(){
  return store.get("scanHistory", []);
}

function fmtTime(ts){
  const d = new Date(ts);
  return d.toLocaleString();
}

// ---------------- Utilities ----------------
function speak(text){
  const t = (text || "").trim();
  if(!t) return;
  const u = new SpeechSynthesisUtterance(t);
  u.rate = 0.95;
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}