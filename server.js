const http = require("http");
const fs = require("fs");
const path = require("path");
const webpush = require("web-push");

const root = __dirname;
const port = Number(process.env.PORT || 4187);
const host = process.env.HOST || "127.0.0.1";
const dataDirectory = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : root;
fs.mkdirSync(dataDirectory, { recursive:true });
const types = { ".html":"text/html; charset=utf-8", ".css":"text/css; charset=utf-8", ".js":"text/javascript; charset=utf-8", ".svg":"image/svg+xml", ".webmanifest":"application/manifest+json; charset=utf-8" };
const configFile = path.join(dataDirectory, "push-config.json");
const dataFile = path.join(dataDirectory, "push-data.json");

function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return fallback; }
}
function writeJson(file, value) { fs.writeFileSync(file, JSON.stringify(value, null, 2), "utf8"); }

let pushConfig = process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY ? { publicKey:process.env.VAPID_PUBLIC_KEY, privateKey:process.env.VAPID_PRIVATE_KEY } : readJson(configFile, null);
if (!pushConfig) {
  pushConfig = webpush.generateVAPIDKeys();
  writeJson(configFile, pushConfig);
}
webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:notifications@teumpyeo.local", pushConfig.publicKey, pushConfig.privateKey);
let subscriptions = readJson(dataFile, []);

function sendJson(response, status, value) {
  response.writeHead(status, { "Content-Type":"application/json; charset=utf-8", "Cache-Control":"no-store" });
  response.end(JSON.stringify(value));
}
function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", chunk => { body += chunk; if (body.length > 1_000_000) reject(new Error("Payload too large")); });
    request.on("end", () => { try { resolve(JSON.parse(body || "{}")); } catch (error) { reject(error); } });
    request.on("error", reject);
  });
}
function saveSubscriptions() { writeJson(dataFile, subscriptions); }

async function handleApi(request, response, url) {
  if (request.method === "GET" && url.pathname === "/api/push/public-key") {
    return sendJson(response, 200, { publicKey:pushConfig.publicKey });
  }
  if (request.method === "POST" && url.pathname === "/api/push/subscribe") {
    try {
      const body = await readBody(request);
      if (!body.subscription?.endpoint || !body.settings) return sendJson(response, 400, { error:"구독 정보가 올바르지 않습니다." });
      const endpoint = body.subscription.endpoint;
      const existing = subscriptions.find(item => item.subscription.endpoint === endpoint);
      const entry = {
        subscription: body.subscription,
        settings: body.settings,
        timezone: body.timezone || "Asia/Seoul",
        delivered: existing?.delivered || {},
        updatedAt: Date.now()
      };
      if (existing) subscriptions[subscriptions.indexOf(existing)] = entry;
      else subscriptions.push(entry);
      saveSubscriptions();
      return sendJson(response, 200, { connected:true });
    } catch (error) { return sendJson(response, 400, { error:error.message }); }
  }
  return sendJson(response, 404, { error:"API not found" });
}

function localParts(date, timezone) {
  try {
    const values = {};
    new Intl.DateTimeFormat("en-CA", { timeZone:timezone, year:"numeric", month:"2-digit", day:"2-digit", weekday:"short", hour:"2-digit", minute:"2-digit", hourCycle:"h23" }).formatToParts(date).forEach(part => values[part.type] = part.value);
    return { date:`${values.year}-${values.month}-${values.day}`, time:`${values.hour}:${values.minute}`, weekday:values.weekday, minutes:Number(values.hour)*60+Number(values.minute) };
  } catch { return localParts(date, "Asia/Seoul"); }
}
function timeMinutes(time = "00:00") { const [hours,minutes] = time.split(":").map(Number); return hours*60+minutes; }
function isQuiet(settings, currentMinutes) {
  const start = timeMinutes(settings.quietStart || "22:00");
  const end = timeMinutes(settings.quietEnd || "07:00");
  return start > end ? currentMinutes >= start || currentMinutes < end : currentMinutes >= start && currentMinutes < end;
}
function dueNotifications(item, now) {
  const settings = item.settings || {};
  const local = localParts(now, item.timezone);
  if (isQuiet(settings, local.minutes)) return [];
  const due = [];
  if (settings.fixed && settings.fixedTime === local.time) due.push({ key:`fixed-${local.date}-${local.time}`, title:"스트레칭할 시간이에요", body:"목과 어깨를 편안하게 움직여볼까요?" });
  if (settings.school && !["Sat","Sun"].includes(local.weekday) && settings.schoolTime === local.time) due.push({ key:`school-${local.date}-${local.time}`, title:"쉬는 시간 스트레칭", body:"자리에서 잠깐 목과 어깨를 풀어주세요." });
  [["study","공부 중 움직일 시간이에요","같은 자세를 풀고 다시 집중해요."],["sitting","오래 앉아 있었어요","일어나거나 자세를 바꿔 몸을 움직여주세요."]].forEach(([type,title,body]) => {
    if (!settings[type]) return;
    const interval = Number(settings[`${type}Interval`]);
    const elapsed = Math.floor((now.getTime()-Number(settings.anchor || now.getTime()))/60000);
    if (interval > 0 && elapsed > 0 && elapsed % interval === 0) due.push({ key:`${type}-${local.date}-${local.time}`, title, body });
  });
  return due.filter(notification => !item.delivered?.[notification.key]);
}

async function runPushScheduler() {
  const now = new Date();
  let changed = false;
  for (const item of [...subscriptions]) {
    for (const notification of dueNotifications(item, now)) {
      try {
        await webpush.sendNotification(item.subscription, JSON.stringify({ ...notification, url:"./?notification=1" }), { TTL:300 });
        item.delivered = { ...(item.delivered || {}), [notification.key]:Date.now() };
        const recent = Object.entries(item.delivered).sort((a,b) => b[1]-a[1]).slice(0,100);
        item.delivered = Object.fromEntries(recent);
        changed = true;
      } catch (error) {
        if (error.statusCode === 404 || error.statusCode === 410) { subscriptions = subscriptions.filter(saved => saved !== item); changed = true; }
        else console.error("푸시 전송 실패:", error.statusCode || error.message);
      }
    }
  }
  if (changed) saveSubscriptions();
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, "http://localhost");
  if (request.method === "GET" && url.pathname === "/health") return sendJson(response, 200, { status:"ok", push:true, subscriptions:subscriptions.length, uptime:Math.round(process.uptime()) });
  if (url.pathname.startsWith("/api/")) return handleApi(request, response, url);
  const requested = url.pathname === "/" ? "index.html" : decodeURIComponent(url.pathname).replace(/^\/+/, "");
  const file = path.resolve(root, requested);
  if (!file.startsWith(root)) { response.writeHead(403); response.end("Forbidden"); return; }
  fs.readFile(file, (error, data) => {
    if (error) { response.writeHead(404); response.end("Not found"); return; }
    const extension = path.extname(file);
    const noCache = [".html",".css",".js",".webmanifest"].includes(extension);
    response.writeHead(200, { "Content-Type":types[extension] || "application/octet-stream", "Cache-Control":noCache ? "no-store" : "public, max-age=300" });
    response.end(data);
  });
});

server.listen(port, host, () => console.log(`틈펴: http://${host}:${port} · 백그라운드 푸시 준비됨`));
setInterval(runPushScheduler, 15000);
runPushScheduler();
