"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from "react";
import {
  countyPoints,
  defaultVisited,
  destinations,
  travelTags,
  type CountyPoint,
  type Destination,
  type TravelTag,
} from "./travel-data";

type Tab = "footprint" | "plan" | "saved";
type CostBreakdown = {
  transport: number;
  stay: number;
  food: number;
  tickets: number;
  local: number;
  buffer: number;
};
type ItineraryDay = {
  day: number;
  date: string;
  title: string;
  activities: string[];
  note: string;
};
type RouteCandidate = {
  id: string;
  destination: Destination;
  title: string;
  score: number;
  days: number;
  nights: number;
  estimated: number;
  breakdown: CostBreakdown;
  itinerary: ItineraryDay[];
  pace: string;
  transport: string;
};
type ChatMessage = { role: "assistant" | "user"; text: string; sources?: string[] };

const formatMoney = (value: number) => `¥${Math.round(value).toLocaleString("zh-CN")}`;

function dateInput(daysFromNow: number) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function tripDays(start: string, end: string) {
  const diff = new Date(`${end}T00:00:00`).getTime() - new Date(`${start}T00:00:00`).getTime();
  return Math.max(1, Math.floor(diff / 86400000) + 1);
}

function shortDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function addDate(value: string, amount: number) {
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + amount);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function buildRoute(
  destination: Destination,
  start: string,
  days: number,
  people: number,
  selectedTags: TravelTag[],
  transport: string,
  budget: number,
  revision: number,
): RouteCandidate {
  const nights = Math.max(0, days - 1);
  const transportFactor = transport === "自驾" ? 1.12 : transport === "飞机优先" ? 1.35 : transport === "公共交通" ? 0.86 : 1;
  const transportCost = destination.travelBase * people * transportFactor;
  const stay = destination.basePerDay * 0.42 * nights * Math.max(1, Math.ceil(people / 2));
  const food = destination.basePerDay * 0.22 * days * people;
  const tickets = destination.basePerDay * 0.15 * days * people;
  const local = destination.basePerDay * 0.13 * days * people;
  const subtotal = transportCost + stay + food + tickets + local;
  const breakdown: CostBreakdown = {
    transport: Math.round(transportCost),
    stay: Math.round(stay),
    food: Math.round(food),
    tickets: Math.round(tickets),
    local: Math.round(local),
    buffer: Math.round(subtotal * 0.08),
  };
  const estimated = Object.values(breakdown).reduce((sum, item) => sum + item, 0);
  const pace = selectedTags.includes("特种兵") ? "高密度" : selectedTags.includes("休闲游") ? "松弛" : "均衡";
  const activitiesPerDay = pace === "高密度" ? 4 : pace === "松弛" ? 2 : 3;
  const itinerary = Array.from({ length: days }, (_, index) => {
    const activityCount = days === 1 ? activitiesPerDay : index === 0 || index === days - 1 ? Math.max(1, activitiesPerDay - 1) : activitiesPerDay;
    const activities = Array.from({ length: activityCount }, (_, offset) =>
      destination.activities[(index * activitiesPerDay + offset + revision) % destination.activities.length],
    );
    return {
      day: index + 1,
      date: addDate(start, index),
      title: index === 0 ? `抵达 · ${activities[0]}` : index === days - 1 ? `${activities[0]} · 从容返程` : activities.slice(0, 2).join(" · "),
      activities,
      note:
        pace === "高密度"
          ? "优先步行与公共交通衔接，建议提前确认预约时段。"
          : pace === "松弛"
            ? "只安排少量主要活动，午后保留休息和自由探索时间。"
            : "上午与下午各设重点，晚间根据体力自由安排。",
    };
  });
  const tagHits = selectedTags.filter((tag) => destination.tags.includes(tag)).length;
  const budgetFit = estimated <= budget ? 24 : Math.max(0, 24 - ((estimated - budget) / Math.max(1, budget)) * 40);
  const score = Math.min(98, Math.round(58 + tagHits * 9 + budgetFit + ((revision + destination.id.length) % 5)));
  return {
    id: `${destination.id}-${revision}`,
    destination,
    title: destination.name,
    score,
    days,
    nights,
    estimated,
    breakdown,
    itinerary,
    pace,
    transport,
  };
}

function MapLine({ from, to, color, dashed = false }: { from: CountyPoint; to: { x: number; y: number }; color: string; dashed?: boolean }) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  return (
    <span
      className={`route-line ${dashed ? "route-line--dashed" : ""}`}
      style={{ left: `${from.x}%`, top: `${from.y}%`, width: `${length}%`, transform: `rotate(${angle}deg)`, backgroundColor: color } as CSSProperties}
    />
  );
}

function downloadCanvas(canvas: HTMLCanvasElement, filename: string) {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }, "image/png");
}

function wrapCanvasText(context: CanvasRenderingContext2D, text: string, x: number, y: number, width: number, lineHeight: number) {
  let line = "";
  let cursorY = y;
  for (const character of text) {
    const test = line + character;
    if (context.measureText(test).width > width && line) {
      context.fillText(line, x, cursorY);
      line = character;
      cursorY += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) context.fillText(line, x, cursorY);
  return cursorY + lineHeight;
}

export default function TravelPlanner() {
  const [tab, setTab] = useState<Tab>("footprint");
  const [visited, setVisited] = useState<string[]>(defaultVisited);
  const [search, setSearch] = useState("");
  const [zoom, setZoom] = useState(1);
  const [originId, setOriginId] = useState("330106");
  const [budget, setBudget] = useState(4200);
  const [people, setPeople] = useState(1);
  const [startDate, setStartDate] = useState(() => dateInput(10));
  const [endDate, setEndDate] = useState(() => dateInput(12));
  const [selectedTags, setSelectedTags] = useState<TravelTag[]>(["休闲游", "看海"]);
  const [transport, setTransport] = useState("智能选择");
  const [k, setK] = useState(5);
  const [revision, setRevision] = useState(0);
  const [routes, setRoutes] = useState<RouteCandidate[]>([]);
  const [activeRouteId, setActiveRouteId] = useState("");
  const [activeDay, setActiveDay] = useState(1);
  const [savedRouteIds, setSavedRouteIds] = useState<string[]>([]);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatBusy, setChatBusy] = useState(false);
  const [pendingChange, setPendingChange] = useState<"economy" | "relax" | "refresh" | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", text: "你好，我已经读到当前路线。你可以问我：预算还能再省吗、第二天会不会太赶，或者帮我替换一个景点。" },
  ]);
  const resultsRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const storedVisited = localStorage.getItem("wanderlit-visited");
    const storedSaved = localStorage.getItem("wanderlit-saved");
    if (storedVisited) setVisited(JSON.parse(storedVisited));
    if (storedSaved) setSavedRouteIds(JSON.parse(storedSaved));
  }, []);

  useEffect(() => {
    localStorage.setItem("wanderlit-visited", JSON.stringify(visited));
  }, [visited]);

  useEffect(() => {
    localStorage.setItem("wanderlit-saved", JSON.stringify(savedRouteIds));
  }, [savedRouteIds]);

  const days = tripDays(startDate, endDate);
  const origin = countyPoints.find((item) => item.id === originId) ?? countyPoints[0];
  const activeRoute = routes.find((route) => route.id === activeRouteId) ?? routes[0];
  const visitedPoints = countyPoints.filter((point) => visited.includes(point.id));
  const filteredCounties = useMemo(() => {
    const query = search.trim();
    if (!query) return [];
    return countyPoints.filter((item) => `${item.province}${item.city}${item.name}`.includes(query)).slice(0, 6);
  }, [search]);

  function toggleVisited(id: string) {
    setVisited((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function toggleTag(tag: TravelTag) {
    setSelectedTags((current) => (current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]));
  }

  function generateRoutes(event?: FormEvent) {
    event?.preventDefault();
    const nextRevision = revision + 1;
    setRevision(nextRevision);
    const ranked = destinations
      .map((destination) => buildRoute(destination, startDate, days, people, selectedTags, transport, budget, nextRevision))
      .sort((a, b) => {
        const aAffordable = a.estimated <= budget ? 1 : 0;
        const bAffordable = b.estimated <= budget ? 1 : 0;
        return bAffordable - aAffordable || b.score - a.score || a.estimated - b.estimated;
      });
    const offset = nextRevision % Math.min(3, ranked.length);
    const next = [...ranked.slice(offset), ...ranked.slice(0, offset)].slice(0, Math.min(k, ranked.length));
    setRoutes(next);
    setActiveRouteId(next[0]?.id ?? "");
    setActiveDay(1);
    setTab("plan");
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  }

  function selectRoute(id: string) {
    setActiveRouteId(id);
    setActiveDay(1);
  }

  function toggleSaved() {
    if (!activeRoute) return;
    setSavedRouteIds((current) =>
      current.includes(activeRoute.id) ? current.filter((item) => item !== activeRoute.id) : [...current, activeRoute.id],
    );
  }

  async function askAssistant(event: FormEvent) {
    event.preventDefault();
    const question = chatInput.trim();
    if (!question || !activeRoute || chatBusy) return;
    setChatInput("");
    setMessages((current) => [...current, { role: "user", text: question }]);
    setChatBusy(true);
    const action = /省|便宜|预算/.test(question) ? "economy" : /松|少|赶|累/.test(question) ? "relax" : "refresh";
    setPendingChange(action);
    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question, route: activeRoute }),
      });
      const result = (await response.json()) as { answer: string; sources?: string[] };
      setMessages((current) => [...current, { role: "assistant", text: result.answer, sources: result.sources }]);
    } catch {
      setMessages((current) => [
        ...current,
        { role: "assistant", text: "我建议先保留核心体验，把住宿区域或每日活动密度做一次调整。当前是演示模式，正式联网信息需要配置模型与搜索服务后启用。" },
      ]);
    } finally {
      setChatBusy(false);
    }
  }

  function applyAssistantChange() {
    if (!activeRoute || !pendingChange) return;
    setRoutes((current) =>
      current.map((route) => {
        if (route.id !== activeRoute.id) return route;
        if (pendingChange === "economy") {
          const breakdown = {
            ...route.breakdown,
            stay: Math.round(route.breakdown.stay * 0.78),
            food: Math.round(route.breakdown.food * 0.9),
            buffer: Math.round(route.breakdown.buffer * 0.9),
          };
          return { ...route, breakdown, estimated: Object.values(breakdown).reduce((sum, item) => sum + item, 0), title: `${route.destination.name} · 省钱版` };
        }
        if (pendingChange === "relax") {
          return {
            ...route,
            pace: "松弛",
            itinerary: route.itinerary.map((day) => ({ ...day, activities: day.activities.slice(0, 2), note: "已减少主要活动，保留午休和自由探索时间。" })),
            title: `${route.destination.name} · 慢游版`,
          };
        }
        return {
          ...route,
          itinerary: route.itinerary.map((day, index) =>
            index === Math.min(1, route.itinerary.length - 1)
              ? { ...day, activities: [...day.activities.slice(0, -1), route.destination.activities[(revision + 4) % route.destination.activities.length]], note: "已替换一个同区域活动，交通顺序保持不变。" }
              : day,
          ),
          title: `${route.destination.name} · 调整版`,
        };
      }),
    );
    setMessages((current) => [...current, { role: "assistant", text: "修改已应用，日程、预算和地图状态已经同步。你还可以继续告诉我哪里不合适。" }]);
    setPendingChange(null);
  }

  function exportRoute(mode: "long" | "day") {
    if (!activeRoute) return;
    const itinerary = mode === "day" ? [activeRoute.itinerary[activeDay - 1]] : activeRoute.itinerary;
    const canvas = document.createElement("canvas");
    canvas.width = 1120;
    canvas.height = 560 + itinerary.length * 250;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.fillStyle = "#f3efe6";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#173d34";
    context.fillRect(0, 0, canvas.width, 255);
    context.fillStyle = "#d9ff78";
    context.font = "700 28px sans-serif";
    context.fillText("漫游签 · WANDERLIT", 70, 72);
    context.fillStyle = "#ffffff";
    context.font = "700 58px sans-serif";
    context.fillText(activeRoute.title, 70, 145);
    context.font = "400 25px sans-serif";
    context.fillStyle = "#d8e7df";
    context.fillText(`${activeRoute.days}天${activeRoute.nights}晚  ·  ${origin.city}${origin.name}出发  ·  ${formatMoney(activeRoute.estimated)}`, 72, 202);
    context.fillStyle = "#173d34";
    context.font = "700 28px sans-serif";
    context.fillText("路线概览", 70, 315);
    context.font = "400 23px sans-serif";
    context.fillStyle = "#44564e";
    wrapCanvasText(context, activeRoute.destination.summary, 70, 355, 940, 36);
    let y = 455;
    itinerary.forEach((day) => {
      context.fillStyle = "#ffffff";
      context.roundRect(60, y - 42, 1000, 205, 24);
      context.fill();
      context.fillStyle = activeRoute.destination.accent;
      context.beginPath();
      context.arc(105, y + 10, 28, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = "#ffffff";
      context.font = "700 21px sans-serif";
      context.fillText(String(day.day), 98, y + 18);
      context.fillStyle = "#173d34";
      context.font = "700 28px sans-serif";
      context.fillText(`DAY ${day.day}  ${shortDate(day.date)}  ${day.title}`, 155, y + 5);
      context.font = "400 22px sans-serif";
      context.fillStyle = "#52645c";
      wrapCanvasText(context, day.activities.join("  →  "), 155, y + 46, 820, 32);
      context.font = "400 19px sans-serif";
      context.fillStyle = "#7a877f";
      wrapCanvasText(context, day.note, 155, y + 112, 820, 28);
      y += 250;
    });
    context.fillStyle = "#65736c";
    context.font = "400 18px sans-serif";
    context.fillText(`预算为演示估算，请在出发前核对票价与开放状态 · 生成于 ${new Date().toLocaleString("zh-CN")}`, 70, canvas.height - 45);
    downloadCanvas(canvas, mode === "day" ? `${activeRoute.destination.name}-第${activeDay}天.png` : `${activeRoute.destination.name}-完整路线.png`);
  }

  const mapRoute = activeRoute ? activeRoute.destination : null;
  const activeRouteDay = activeRoute?.itinerary[activeDay - 1];

  return (
    <main className="site-shell">
      <header className="topbar">
        <button className="brand" onClick={() => setTab("footprint")} aria-label="回到足迹地图">
          <span className="brand-mark">游</span>
          <span><strong>漫游签</strong><small>WANDERLIT</small></span>
        </button>
        <nav aria-label="主导航">
          <button className={tab === "footprint" ? "active" : ""} onClick={() => setTab("footprint")}>足迹地图</button>
          <button className={tab === "plan" ? "active" : ""} onClick={() => setTab("plan")}>路线灵感</button>
          <button className={tab === "saved" ? "active" : ""} onClick={() => setTab("saved")}>收藏行程 <span>{savedRouteIds.length}</span></button>
        </nav>
        <button className="assistant-trigger" onClick={() => setAssistantOpen(true)}><span>✦</span> 问问路线助手</button>
      </header>

      <section className="hero-copy">
        <p className="eyebrow">把去过的地方点亮，把下一程交给一点灵感</p>
        <h1>{tab === "footprint" ? "你的中国旅行足迹" : tab === "plan" ? "从一个县城出发，遇见下一段旅程" : "值得再打开一次的路线"}</h1>
      </section>

      <section className="workspace">
        <div className="map-card">
          <div className="map-toolbar">
            <div className="map-title"><span className="live-dot" /> 中国旅行地图 <small>交互演示底图</small></div>
            <div className="zoom-control">
              <span>省级</span>
              <input aria-label="地图缩放" type="range" min="0.9" max="1.45" step="0.05" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} />
              <span>县级</span>
            </div>
          </div>
          <div className="map-viewport">
            <div className="map-grid" style={{ transform: `scale(${zoom})` }}>
              <div className="terrain terrain-a" /><div className="terrain terrain-b" /><div className="terrain terrain-c" />
              <span className="region-label north">华北</span><span className="region-label east">华东</span><span className="region-label south">华南</span><span className="region-label west">西部</span><span className="region-label central">华中</span>
              {mapRoute && <MapLine from={origin} to={mapRoute} color={mapRoute.accent} dashed />}
              {countyPoints.map((point) => {
                const isVisited = visited.includes(point.id);
                const isOrigin = point.id === origin.id && tab === "plan";
                return (
                  <button
                    key={point.id}
                    className={`map-point ${isVisited ? "visited" : ""} ${isOrigin ? "origin" : ""}`}
                    style={{ left: `${point.x}%`, top: `${point.y}%` }}
                    onClick={() => toggleVisited(point.id)}
                    title={`${point.city}${point.name} · ${isVisited ? "已到访" : "未到访"}`}
                    aria-label={`${point.city}${point.name}，${isVisited ? "已到访，点击取消" : "未到访，点击点亮"}`}
                  ><span />{(isVisited || isOrigin || zoom > 1.2) && <b>{point.name}</b>}</button>
                );
              })}
              {mapRoute && (
                <button className="destination-pin" style={{ left: `${mapRoute.x}%`, top: `${mapRoute.y}%`, "--pin": mapRoute.accent } as CSSProperties}>
                  <span>{activeDay}</span><b>{mapRoute.county}</b>
                </button>
              )}
            </div>
            <div className="map-note">DEMO MAP · 正式版接入腾讯位置服务后加载合规底图与县级行政边界</div>
          </div>
          <div className="map-footer">
            <div><strong>{visited.length}</strong><span>已点亮县区</span></div>
            <div><strong>{new Set(visitedPoints.map((item) => item.province)).size}</strong><span>到访省份</span></div>
            <div><strong>{Math.round((visited.length / countyPoints.length) * 100)}%</strong><span>演示地图进度</span></div>
            <div className="legend"><i className="legend-on" /> 已到访 <i /> 待探索</div>
          </div>
        </div>

        <aside className="control-card">
          {tab === "footprint" && (
            <>
              <div className="panel-heading"><div><p>MY FOOTPRINT</p><h2>手动点亮足迹</h2></div><span className="step-badge">县级</span></div>
              <label className="search-box"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索城市、区县或县级市" /></label>
              {filteredCounties.length > 0 && <div className="search-results">{filteredCounties.map((point) => <button key={point.id} onClick={() => { toggleVisited(point.id); setSearch(""); }}><span>{point.city} · {point.name}</span><b>{visited.includes(point.id) ? "取消" : "+ 点亮"}</b></button>)}</div>}
              <div className="mini-section-title"><span>最近点亮</span><button onClick={() => setVisited([])}>清空演示记录</button></div>
              <div className="visited-list">
                {visitedPoints.slice(-6).reverse().map((point, index) => (
                  <button key={point.id} onClick={() => toggleVisited(point.id)}>
                    <span className="visit-index">{String(visitedPoints.length - index).padStart(2, "0")}</span>
                    <span><strong>{point.city} · {point.name}</strong><small>{point.province} · 点击取消点亮</small></span>
                    <i>✓</i>
                  </button>
                ))}
                {visitedPoints.length === 0 && <div className="empty-state">从搜索或地图上点亮你的第一个县区。</div>}
              </div>
              <button className="primary-action" onClick={() => setTab("plan")}>开始规划下一程 <span>→</span></button>
              <p className="privacy-note">足迹仅保存在当前浏览器，可随时清除。</p>
            </>
          )}

          {tab === "plan" && (
            <form onSubmit={generateRoutes}>
              <div className="panel-heading"><div><p>ROUTE GENERATOR</p><h2>告诉我这次怎么走</h2></div><span className="step-badge">智能推荐</span></div>
              <div className="field-row">
                <label><span>出发县区</span><select value={originId} onChange={(event) => setOriginId(event.target.value)}>{countyPoints.map((point) => <option key={point.id} value={point.id}>{point.city} · {point.name}</option>)}</select></label>
                <label><span>同行人数</span><input type="number" min="1" max="12" value={people} onChange={(event) => setPeople(Number(event.target.value))} /></label>
              </div>
              <label className="budget-field"><span>总预算（含往返交通）</span><div><b>¥</b><input type="number" min="500" step="100" value={budget} onChange={(event) => setBudget(Number(event.target.value))} /></div></label>
              <div className="field-row dates">
                <label><span>出发日期</span><input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label>
                <label><span>返程日期</span><input type="date" min={startDate} value={endDate} onChange={(event) => setEndDate(event.target.value < startDate ? startDate : event.target.value)} /></label>
              </div>
              <div className="trip-duration"><strong>{days}天{Math.max(0, days - 1)}晚</strong><span>{shortDate(startDate)} — {shortDate(endDate)}</span></div>
              <fieldset><legend>旅行预期（可多选）</legend><div className="tag-grid">{travelTags.map((tag) => <button type="button" key={tag} className={selectedTags.includes(tag) ? "selected" : ""} onClick={() => toggleTag(tag)}>{tag}</button>)}</div></fieldset>
              <div className="field-row">
                <label><span>交通偏好</span><select value={transport} onChange={(event) => setTransport(event.target.value)}><option>智能选择</option><option>公共交通</option><option>自驾</option><option>铁路优先</option><option>飞机优先</option></select></label>
                <label><span>推荐数量 K</span><input type="number" min="1" max="10" value={k} onChange={(event) => setK(Number(event.target.value))} /></label>
              </div>
              <button className="primary-action" type="submit">生成 {k} 条路线 <span>✦</span></button>
              <p className="privacy-note">结果为演示估算，正式版会检索实时开放与交通信息。</p>
            </form>
          )}

          {tab === "saved" && (
            <>
              <div className="panel-heading"><div><p>SAVED TRIPS</p><h2>收藏行程</h2></div><span className="step-badge">{savedRouteIds.length} 条</span></div>
              <div className="saved-list">
                {routes.filter((route) => savedRouteIds.includes(route.id)).map((route) => <button key={route.id} onClick={() => { selectRoute(route.id); setTab("plan"); }}><span style={{ background: route.destination.accent }} /><div><strong>{route.title}</strong><small>{route.days}天{route.nights}晚 · {formatMoney(route.estimated)}</small></div><b>→</b></button>)}
                {savedRouteIds.length === 0 && <div className="empty-state large"><b>还没有收藏路线</b><span>生成路线后，点击“收藏此行程”即可保存在当前设备。</span></div>}
              </div>
              <button className="primary-action" onClick={() => setTab("plan")}>去发现路线 <span>→</span></button>
            </>
          )}
        </aside>
      </section>

      {routes.length > 0 && (
        <section className="route-results" ref={resultsRef}>
          <div className="results-heading"><div><p>CURATED FOR YOU</p><h2>为你找到 {routes.length} 条路线</h2><span>预算、节奏与偏好已经一起计算</span></div><button onClick={() => generateRoutes()}>↻ 换一批灵感</button></div>
          <div className="route-tabs">{routes.map((route, index) => <button key={route.id} className={activeRoute?.id === route.id ? "active" : ""} onClick={() => selectRoute(route.id)}><span>0{index + 1}</span><strong>{route.destination.county}</strong><small>{route.score}% 匹配</small></button>)}</div>
          {activeRoute && (
            <div className="route-detail">
              <div className="route-summary">
                <div className="route-kicker"><span style={{ background: activeRoute.destination.accent }} /> {activeRoute.destination.province} · {activeRoute.destination.county}</div>
                <h2>{activeRoute.title}</h2>
                <p>{activeRoute.destination.summary}</p>
                <div className="route-tags">{activeRoute.destination.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div>
                <div className="metric-grid"><div><span>总预算估算</span><strong>{formatMoney(activeRoute.estimated)}</strong><small className={activeRoute.estimated <= budget ? "within" : "over"}>{activeRoute.estimated <= budget ? `预算内余 ${formatMoney(budget - activeRoute.estimated)}` : `预计超出 ${formatMoney(activeRoute.estimated - budget)}`}</small></div><div><span>行程节奏</span><strong>{activeRoute.pace}</strong><small>{activeRoute.transport}</small></div><div><span>匹配度</span><strong>{activeRoute.score}%</strong><small>基于当前偏好</small></div></div>
                <div className="budget-bars">{Object.entries({ 往返交通: activeRoute.breakdown.transport, 住宿: activeRoute.breakdown.stay, 餐饮: activeRoute.breakdown.food, 门票: activeRoute.breakdown.tickets, 市内交通: activeRoute.breakdown.local, 机动: activeRoute.breakdown.buffer }).map(([label, value]) => <div key={label}><span>{label}</span><i><b style={{ width: `${Math.max(8, (value / activeRoute.estimated) * 100)}%`, background: activeRoute.destination.accent }} /></i><strong>{formatMoney(value)}</strong></div>)}</div>
                <div className="route-actions"><button className="primary-action" onClick={toggleSaved}>{savedRouteIds.includes(activeRoute.id) ? "✓ 已收藏" : "收藏此行程"}</button><button className="secondary-action" onClick={() => setAssistantOpen(true)}>✦ 让助手改路线</button></div>
              </div>
              <div className="daily-plan">
                <div className="daily-heading"><div><p>DAILY PLAN</p><h3>{activeRoute.days}天{activeRoute.nights}晚 · 每日安排</h3></div><div><button onClick={() => exportRoute("day")}>导出当日图</button><button onClick={() => exportRoute("long")}>导出长图</button></div></div>
                <div className="day-selector">{activeRoute.itinerary.map((day) => <button key={day.day} className={activeDay === day.day ? "active" : ""} onClick={() => setActiveDay(day.day)}><span>D{day.day}</span><small>{shortDate(day.date)}</small></button>)}</div>
                {activeRouteDay && <article className="day-card"><div className="day-number"><span>DAY</span><strong>{String(activeRouteDay.day).padStart(2, "0")}</strong></div><div><p>{shortDate(activeRouteDay.date)} · {activeRoute.destination.county}</p><h3>{activeRouteDay.title}</h3><ol>{activeRouteDay.activities.map((activity, index) => <li key={`${activity}-${index}`}><span>{index + 1}</span><div><strong>{activity}</strong><small>{index === 0 ? "建议上午开始" : index === activeRouteDay.activities.length - 1 ? "当天最后一站" : "同区域顺路衔接"}</small></div></li>)}</ol><div className="day-note"><b>节奏提示</b>{activeRouteDay.note}</div></div></article>}
                <div className="source-note"><span>i</span><p><strong>信息新鲜度</strong>当前为产品测试数据，费用和开放状态不是实时结果。接入正式地图、搜索和模型服务后，这里会显示来源链接与检索时间。</p></div>
              </div>
            </div>
          )}
        </section>
      )}

      <footer><div><span className="brand-mark small">游</span><strong>漫游签</strong></div><p>让每一次出发，都有一点随机，也有足够把握。</p><span>公开测试版 · 数据保存在当前设备</span></footer>

      {assistantOpen && <div className="assistant-backdrop" onClick={() => setAssistantOpen(false)} />}
      <aside className={`assistant-panel ${assistantOpen ? "open" : ""}`} aria-hidden={!assistantOpen}>
        <div className="assistant-header"><div><span>✦</span><div><strong>路线小助手</strong><small>{activeRoute ? `正在阅读：${activeRoute.title}` : "先生成一条路线，我会更懂你"}</small></div></div><button onClick={() => setAssistantOpen(false)} aria-label="关闭助手">×</button></div>
        <div className="assistant-status"><i /> 演示模式 · 配置模型密钥后启用真实大模型</div>
        <div className="chat-stream">{messages.map((message, index) => <div key={index} className={`chat-message ${message.role}`}><span>{message.role === "assistant" ? "✦" : "你"}</span><div><p>{message.text}</p>{message.sources?.length ? <small>来源：{message.sources.join(" · ")}</small> : null}</div></div>)}{chatBusy && <div className="chat-message assistant"><span>✦</span><div><p className="typing">正在核对路线<span>...</span></p></div></div>}</div>
        {pendingChange && !chatBusy && <div className="change-card"><div><span>建议修改</span><strong>{pendingChange === "economy" ? "降低住宿与餐饮预算" : pendingChange === "relax" ? "每天最多保留两个主要活动" : "替换第二天的一个活动"}</strong></div><button onClick={applyAssistantChange}>确认应用</button></div>}
        <form className="chat-form" onSubmit={askAssistant}><div className="quick-prompts"><button type="button" onClick={() => setChatInput("预算还能再省一点吗？")}>再省一点</button><button type="button" onClick={() => setChatInput("第二天会不会太赶？")}>会太赶吗</button><button type="button" onClick={() => setChatInput("替换一个景点")}>替换景点</button></div><label><textarea value={chatInput} onChange={(event) => setChatInput(event.target.value)} placeholder="问问天气、预算，或直接说想怎么调整…" rows={3} /><button disabled={!activeRoute || chatBusy} aria-label="发送问题">↑</button></label></form>
      </aside>
    </main>
  );
}
