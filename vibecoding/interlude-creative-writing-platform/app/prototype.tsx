"use client";

import {
  Archive,
  ArrowUpRight,
  BookMarked,
  BookOpen,
  Brain,
  Check,
  ChevronDown,
  ChevronLeft,
  CircleDot,
  Eye,
  FileText,
  GitBranch,
  List,
  Lock,
  Map,
  Menu,
  MessageCircle,
  Mic2,
  Moon,
  MoreHorizontal,
  Orbit,
  Pause,
  Pencil,
  Play,
  Plus,
  RotateCcw,
  Search,
  Send,
  Settings2,
  SkipBack,
  SkipForward,
  Sparkles,
  Sun,
  Users,
  WandSparkles,
  X,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type View = "chat" | "reader" | "studio" | "characters" | "memory" | "world";
type Surface = "library" | "workspace";
type Lens = "omniscient" | "linzhi" | "chenyan" | "reader";
type MemoryStatus = "canon" | "candidate" | "temporary" | "archived";
type CharacterId = "linzhi" | "chenyan" | "director" | "radio";
type Theme = "light" | "dark";

type Message = {
  id: string;
  speaker: "author" | CharacterId;
  text: string;
  time?: string;
};

type MemoryRecord = {
  id: string;
  title: string;
  summary: string;
  status: MemoryStatus;
  category: string;
  timeline: string;
  place: string;
  related: CharacterId[];
  source: string;
  locked: boolean;
  perspectives: Record<Lens, string>;
};

type SkillRecord = {
  id: string;
  owner: "linzhi" | "chenyan";
  name: string;
  purpose: string;
  trigger: string;
  rule: string;
  taboo: string;
  priority: "高" | "中" | "低";
  enabled: boolean;
};

type ReaderMode = "novel" | "rehearsal";
type PlaybackState = "idle" | "playing" | "paused" | "ended";

type NovelBeat =
  | { id: string; kind: "prose"; text: string }
  | { id: string; kind: "dialogue"; speaker: CharacterId; text: string; delivery?: string };

type ReaderScene = {
  id: string;
  chapterLabel: string;
  order: number;
  title: string;
  slug: string;
  summary: string;
  stageDirection: string;
  imageSrc: string;
  imageAlt: string;
  sourceRange: string;
  aiConfidence: number;
  beats: NovelBeat[];
};

type ReaderState = {
  mode: ReaderMode;
  sceneId: string;
  cueIndex: number;
};

type ProjectRecord = {
  id: string;
  kicker: string;
  title: string;
  genre: string;
  status: string;
  cover: string;
  summary: string;
  seedText: string;
  ready: boolean;
};

type LibraryBookSelection = {
  book: ProjectRecord;
  instanceKey: string;
  origin: {
    left: number;
    top: number;
    width: number;
    height: number;
    x: number;
    y: number;
    scale: number;
  };
};

const characters = {
  linzhi: {
    name: "林栀",
    initials: "栀",
    color: "coral",
    role: "电台编辑",
    tagline: "嘴硬，敏锐，习惯把在意藏在反问里。",
  },
  chenyan: {
    name: "沈砚",
    initials: "砚",
    color: "ink",
    role: "旧书店老板",
    tagline: "慢热寡言，用行动代替解释。",
  },
  director: {
    name: "编剧 Agent",
    initials: "编",
    color: "sage",
    role: "叙事协调者",
    tagline: "维护世界观、节奏与信息边界。",
  },
  radio: {
    name: "雾港电台",
    initials: "FM",
    color: "blue",
    role: "场景角色",
    tagline: "记录城市里没来得及说出口的话。",
  },
} satisfies Record<CharacterId, { name: string; initials: string; color: string; role: string; tagline: string }>;

const initialMessages: Message[] = [
  { id: "m0", speaker: "director", text: "雨刚停。林栀坐在书店收银台边，沈砚正把门口那把湿伞收起来。", time: "22:17" },
  { id: "m1", speaker: "author", text: "@沈砚 今天有没有跟林栀吵架？", time: "22:18" },
  { id: "m2", speaker: "chenyan", text: "没有。她只是觉得我把纪念日忘了。", time: "22:18" },
  { id: "m3", speaker: "linzhi", text: "哪有，明明是用了一杯桂花乌龙才把我哄好的。", time: "22:19" },
  { id: "m4", speaker: "chenyan", text: "我错了嘛，不是说喝完就翻篇了吗？", time: "22:19" },
  { id: "m5", speaker: "linzhi", text: "我说的是“再考虑”。", time: "22:20" },
];

const initialMemories: MemoryRecord[] = [
  {
    id: "tea",
    title: "桂花乌龙和好",
    summary: "昨晚林栀误以为沈砚忘记纪念日，两人争执；沈砚带着桂花乌龙在楼下等了四十分钟。",
    status: "candidate",
    category: "关系记忆",
    timeline: "正文线 / 第十二章后",
    place: "海边书店",
    related: ["linzhi", "chenyan"],
    source: "群聊「雨夜客厅」 / 第 38 至 43 条消息",
    locked: false,
    perspectives: {
      omniscient: "沈砚因失约向林栀道歉，两人表面翻篇，林栀仍在等一句正式解释。",
      linzhi: "他虽然嘴笨，但还是记得我喜欢桂花乌龙。暂时原谅。",
      chenyan: "我把事情搞砸了。她喝完奶茶，应该已经不生气了。",
      reader: "尚未揭示争执原因，只知道两人昨晚见过面。",
    },
  },
  {
    id: "key",
    title: "书店的第二把钥匙",
    summary: "沈砚把书店备用钥匙交给林栀，却说只是方便她来拿落下的稿子。",
    status: "canon",
    category: "关系记忆",
    timeline: "正文线 / 第九章",
    place: "雾港旧书店",
    related: ["linzhi", "chenyan"],
    source: "原稿《雾港来信》第九章 / 1324 至 1460 字",
    locked: true,
    perspectives: {
      omniscient: "这是沈砚第一次主动为林栀留下一个可以随时回来的位置。",
      linzhi: "她知道这把钥匙意味着信任，但故意不点破。",
      chenyan: "只是备用钥匙。他拒绝承认这像一种邀请。",
      reader: "已在第九章完整揭示。",
    },
  },
  {
    id: "lighthouse",
    title: "灯塔停电的夜晚",
    summary: "两人在灯塔停电时被困到天亮，林栀第一次听见沈砚谈起父亲。",
    status: "canon",
    category: "共同经历",
    timeline: "正文线 / 第六章",
    place: "北岬灯塔",
    related: ["linzhi", "chenyan"],
    source: "原稿《雾港来信》第六章",
    locked: true,
    perspectives: {
      omniscient: "停电并非意外，是港口旧线路被人为切断。角色暂不知情。",
      linzhi: "那是沈砚第一次在她面前承认害怕失去。",
      chenyan: "他记得林栀没有追问，只把手电放在两人中间。",
      reader: "只知道停电是意外，尚不知道幕后原因。",
    },
  },
  {
    id: "broadcast",
    title: "凌晨直播提案",
    summary: "林栀想在周五做一期关于“没有寄出的信”的午夜特别节目。",
    status: "temporary",
    category: "剧情种子",
    timeline: "草稿分支 / 午夜电台",
    place: "雾港电台",
    related: ["linzhi", "radio"],
    source: "作者脑洞 / 2026/08/04",
    locked: false,
    perspectives: {
      omniscient: "这个节目会收到一封与沈砚父亲有关的匿名来信。",
      linzhi: "她只把它当作一次普通策划，尚未意识到来信的指向。",
      chenyan: "尚不知情。",
      reader: "分支内容，对读者隐藏。",
    },
  },
];

const initialSkills: SkillRecord[] = [
  {
    id: "action-apology",
    owner: "chenyan",
    name: "以行动代替道歉",
    purpose: "让沈砚的关心始终落在具体动作里，而不是突然变得善于表白。",
    trigger: "惹林栀生气、意识到自己失约，或对方需要安慰时",
    rule: "先做一件贴合对方习惯的小事，再用不超过两句的解释收尾。",
    taboo: "不要长篇剖白；不要使用油腻昵称；不要替林栀宣布已经原谅。",
    priority: "高",
    enabled: true,
  },
  {
    id: "short-pause",
    owner: "chenyan",
    name: "短句与停顿",
    purpose: "保持克制、慢热的说话节奏。",
    trigger: "任何情绪强烈的对话",
    rule: "优先短句；真正重要的信息放在停顿之后。",
    taboo: "连续三个以上感叹号；网络热梗；过度解释动机。",
    priority: "中",
    enabled: true,
  },
  {
    id: "counter-question",
    owner: "linzhi",
    name: "被戳穿时先反问",
    purpose: "维持林栀嘴硬但不刻薄的情绪防御。",
    trigger: "被指出在意沈砚、吃醋或已经心软时",
    rule: "先反问或纠正一个细节，再泄露一点真实心情。",
    taboo: "不要无端羞辱对方；不要持续否认已经发生的客观事实。",
    priority: "高",
    enabled: true,
  },
  {
    id: "exception",
    owner: "linzhi",
    name: "对沈砚的例外",
    purpose: "让关系中的偏爱可被读者察觉，但不直接说破。",
    trigger: "群聊中沈砚沉默、被误解，或有人要求她评价沈砚",
    rule: "可以拆台，但会替他补充关键背景；用细节证明她一直在观察。",
    taboo: "不要把偏爱写成无条件顺从。",
    priority: "中",
    enabled: true,
  },
];

const initialReaderScenes: ReaderScene[] = [
  {
    id: "lighthouse-blackout",
    chapterLabel: "第六章",
    order: 1,
    title: "灯塔熄灭以后",
    slug: "北岬灯塔 / 夜 / 内",
    summary: "停电把两个人留在灯塔里，沈砚第一次提起父亲。",
    stageDirection: "海风撞着玻璃。手电筒放在两人之间，只照亮半张桌面。",
    imageSrc: "/stills/fog-lighthouse.jpg",
    imageAlt: "海雾中的北岬灯塔与桌上的信",
    sourceRange: "第六章 / 803 至 1260 字",
    aiConfidence: 97,
    beats: [
      { id: "l1", kind: "prose", text: "灯塔熄灭的第三分钟，雾从窗外压了进来。林栀把手电倒扣在桌上，光沿着杯底散开，像一小块没有温度的月亮。" },
      { id: "l2", kind: "dialogue", speaker: "linzhi", text: "你怕黑？", delivery: "故意说得很轻" },
      { id: "l3", kind: "dialogue", speaker: "chenyan", text: "不怕。", delivery: "停顿" },
      { id: "l4", kind: "prose", text: "沈砚望着楼梯口。那里什么也没有，只有旧木板在风里发出缓慢的响声。" },
      { id: "l5", kind: "dialogue", speaker: "chenyan", text: "我父亲最后一次来这里，也停过电。第二天，他就离开了雾港。", delivery: "没有看她" },
      { id: "l6", kind: "dialogue", speaker: "linzhi", text: "那今天我不走。等灯亮，或者等天亮。", delivery: "把手电推到两人中间" },
    ],
  },
  {
    id: "second-key",
    chapterLabel: "第九章",
    order: 2,
    title: "第二把钥匙",
    slug: "雾港旧书店 / 雨后 / 内",
    summary: "沈砚把备用钥匙交给林栀，却拒绝承认它像一种邀请。",
    stageDirection: "雨刚停。卷帘门只拉下一半，柜台上放着一把系红绳的旧钥匙。",
    imageSrc: "/stills/rain-bookstore.jpg",
    imageAlt: "雨夜旧书店里的暖灯与桌面",
    sourceRange: "第九章 / 1324 至 1460 字",
    aiConfidence: 99,
    beats: [
      { id: "k1", kind: "prose", text: "林栀在那串钥匙旁站了很久。红绳褪成了旧砖的颜色，打结的方式却很新，像是刚被人反复拆开又系好。" },
      { id: "k2", kind: "dialogue", speaker: "linzhi", text: "这是什么？", delivery: "明知故问" },
      { id: "k3", kind: "dialogue", speaker: "chenyan", text: "备用钥匙。你总把稿子落在这里，省得半夜敲门。", delivery: "整理收银台" },
      { id: "k4", kind: "dialogue", speaker: "linzhi", text: "只是为了稿子？", delivery: "捏住红绳" },
      { id: "k5", kind: "prose", text: "沈砚把最后一本书推回架上。雨水从屋檐滴下，替他的沉默数了七下。" },
      { id: "k6", kind: "dialogue", speaker: "chenyan", text: "不然呢。你还想把这里当家？", delivery: "声音很低" },
      { id: "k7", kind: "dialogue", speaker: "linzhi", text: "想得美。我只是替你保管。", delivery: "把钥匙收进口袋" },
    ],
  },
  {
    id: "unsigned-letter",
    chapterLabel: "第十一章",
    order: 3,
    title: "凌晨一点的来信",
    slug: "雾港电台 / 凌晨 / 内",
    summary: "匿名来信在直播前送达，内容指向沈砚父亲离开的真相。",
    stageDirection: "ON AIR 灯尚未亮起。雨点密密落在隔音玻璃上，信封没有署名。",
    imageSrc: "/stills/midnight-radio.jpg",
    imageAlt: "午夜电台的麦克风与雨窗",
    sourceRange: "第十一章 / 411 至 986 字",
    aiConfidence: 95,
    beats: [
      { id: "u1", kind: "prose", text: "信封里只有一页纸。开头写着林栀的节目名，结尾却是二十年前的日期。墨迹被潮气晕开，仍能辨认出北岬灯塔四个字。" },
      { id: "u2", kind: "dialogue", speaker: "radio", text: "距离直播还有三分钟。", delivery: "系统提示音" },
      { id: "u3", kind: "dialogue", speaker: "linzhi", text: "沈砚，你现在能来电台吗？", delivery: "拨通电话" },
      { id: "u4", kind: "dialogue", speaker: "chenyan", text: "出什么事了？", delivery: "电话里有开门声" },
      { id: "u5", kind: "dialogue", speaker: "linzhi", text: "有人寄来一封信。和你父亲有关。", delivery: "盯着最后一行" },
      { id: "u6", kind: "prose", text: "电话那头安静下来。隔着一座城的雾，她听见钥匙落在地上的声音。" },
    ],
  },
  {
    id: "tea-reconciliation",
    chapterLabel: "第十二章后",
    order: 4,
    title: "桂花乌龙翻篇了吗",
    slug: "海边书店 / 夜 / 内",
    summary: "一次迟到的和好，被两个人说成了一杯奶茶的事。",
    stageDirection: "书店打烊。两杯桂花乌龙放在窗边，靠外的一杯已经凉了。",
    imageSrc: "/stills/rain-bookstore.jpg",
    imageAlt: "打烊后的海边书店与窗边灯光",
    sourceRange: "第十二章后 / 新增场景 38 至 43 行",
    aiConfidence: 98,
    beats: [
      { id: "t1", kind: "prose", text: "林栀吸管上的牙印叠了一圈。沈砚坐在对面，手边那杯没有动，杯壁上的水珠已经流到桌沿。" },
      { id: "t2", kind: "dialogue", speaker: "chenyan", text: "还生气？", delivery: "把纸巾推过去" },
      { id: "t3", kind: "dialogue", speaker: "linzhi", text: "我什么时候说过生气。", delivery: "没有抬头" },
      { id: "t4", kind: "dialogue", speaker: "chenyan", text: "那算翻篇了？", delivery: "试探" },
      { id: "t5", kind: "dialogue", speaker: "linzhi", text: "我说的是再考虑。桂花乌龙只能抵一半。", delivery: "终于看他" },
      { id: "t6", kind: "dialogue", speaker: "chenyan", text: "另一半呢？", delivery: "顺着她问" },
      { id: "t7", kind: "dialogue", speaker: "linzhi", text: "明天再带一杯。热的。", delivery: "把空杯推回去" },
    ],
  },
];

const initialReaderState: ReaderState = {
  mode: "novel",
  sceneId: initialReaderScenes[0].id,
  cueIndex: 0,
};

const libraryProjects: ProjectRecord[] = [
  {
    id: "fog-harbor",
    kicker: "当前作品",
    title: "雾港来信",
    genre: "长篇小说",
    status: "12 章 / 创作中",
    cover: "/library/cover-fog-harbor.png",
    summary: "终年多雾的海港，一封没有署名的信，把一对恋人带回二十年前的灯塔。",
    seedText: "一个不擅长表达爱意的旧书店老板，和一个嘴硬、爱喝桂花乌龙的电台编辑。他们在终年多雾的海港城市恋爱三年。今天，书店门口多了一封没有署名的信。",
    ready: true,
  },
  {
    id: "lost-moon",
    kicker: "构想稿",
    title: "失物月亮",
    genre: "都市奇谈",
    status: "等待导入正文",
    cover: "/library/cover-midnight-radio.png",
    summary: "一家只在午夜营业的失物招领处，收到了一轮被人遗忘的月亮。",
    seedText: "午夜的失物招领处收到一个没有寄件人的木箱，箱子里装着一小块会随潮汐明暗的月光。管理员必须在天亮前找到忘记它的人。",
    ready: false,
  },
  {
    id: "north-cape",
    kicker: "设定稿",
    title: "北岬灯塔",
    genre: "悬疑中篇",
    status: "世界观已起草",
    cover: "/library/cover-fog-lighthouse.png",
    summary: "灯塔每隔十九年熄灭一次，这一次，守塔人提前收到了自己的讣告。",
    seedText: "北岬灯塔每隔十九年会无故熄灭一夜。新来的守塔人上任第一天，收到一封落款为明年的讣告，死者名字正是自己。",
    ready: false,
  },
  {
    id: "night-train",
    kicker: "新作构想",
    title: "长夜列车",
    genre: "公路小说",
    status: "只有一句话",
    cover: "/library/cover-rain-platform.png",
    summary: "一趟永远晚点的夜车，载着六个都不愿抵达终点的人。",
    seedText: "一趟永远晚点的夜车，载着六个都不愿抵达终点的人。列车员说，只有说出真正想逃离的事，车门才会打开。",
    ready: false,
  },
  {
    id: "glass-greenhouse",
    kicker: "人物草案",
    title: "玻璃花房",
    genre: "女性群像",
    status: "3 个角色待生成",
    cover: "/library/cover-midnight-greenhouse.png",
    summary: "三位多年未见的姐妹，在母亲留下的花房里共同度过最后一个夏天。",
    seedText: "三位多年未见的姐妹回到海边老宅，处理母亲留下的玻璃花房。她们发现每一种花，都对应一段彼此记忆里完全不同的往事。",
    ready: false,
  },
  {
    id: "snow-hotel",
    kicker: "封面构想",
    title: "雪线旅馆",
    genre: "封闭推理",
    status: "等待第一章",
    cover: "/library/cover-snow-hotel.png",
    summary: "暴雪封山后，旅馆里多出一间不存在的客房，以及一位没有登记的住客。",
    seedText: "暴雪封住了山路。旅馆清点房间时发现走廊尽头多出一扇门，门牌写着零号房，而昨夜所有住客都梦见同一个陌生人。",
    ready: false,
  },
];

const initialProjectDrafts: Record<string, string> = Object.fromEntries(libraryProjects.map((project) => [project.id, project.seedText]));

const statusMeta: Record<MemoryStatus, { label: string; className: string }> = {
  canon: { label: "正典", className: "status-canon" },
  candidate: { label: "待确认", className: "status-candidate" },
  temporary: { label: "临时", className: "status-temporary" },
  archived: { label: "废弃", className: "status-archived" },
};

const lensMeta: Record<Lens, { label: string; short: string }> = {
  omniscient: { label: "全知视角", short: "全知" },
  linzhi: { label: "林栀视角", short: "林栀" },
  chenyan: { label: "沈砚视角", short: "沈砚" },
  reader: { label: "读者预览 / 第 12 章", short: "读者" },
};

const navItems: { id: View; label: string; mobileLabel: string; caption: string; icon: typeof MessageCircle }[] = [
  { id: "chat", label: "对话现场", mobileLabel: "对话", caption: "让他们继续生活", icon: MessageCircle },
  { id: "reader", label: "阅读", mobileLabel: "阅读", caption: "正文与场景预演", icon: BookMarked },
  { id: "studio", label: "编剧室", mobileLabel: "编剧", caption: "从文字创造角色", icon: Sparkles },
  { id: "characters", label: "角色档案", mobileLabel: "角色", caption: "人设、Skill 与 Prompt", icon: Users },
  { id: "memory", label: "记忆中枢", mobileLabel: "记忆", caption: "正典与认知差", icon: Brain },
  { id: "world", label: "世界书", mobileLabel: "世界", caption: "设定与时间线", icon: BookOpen },
];

const CINEMATIC_THEME_VERSION = "interlude-cinematic-theme-v1";

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function Avatar({ id, size = "md" }: { id: CharacterId; size?: "sm" | "md" | "lg" }) {
  const character = characters[id];
  return <span className={`avatar avatar-${size} avatar-${character.color}`} aria-hidden="true">{character.initials}</span>;
}

function StatusPill({ status }: { status: MemoryStatus }) {
  const meta = statusMeta[status];
  return <span className={`status-pill ${meta.className}`}><span />{meta.label}</span>;
}

function ProjectLibrary({ books, activeBookId, onOpen, onContinue }: {
  books: ProjectRecord[];
  activeBookId: string;
  onOpen: (book: ProjectRecord) => void;
  onContinue: () => void;
}) {
  const [selection, setSelection] = useState<LibraryBookSelection | null>(null);
  const [selectionPhase, setSelectionPhase] = useState<"opening" | "detail" | "closing">("opening");
  const closeButton = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<number | null>(null);

  const closeSelection = useCallback(() => {
    if (!selection || selectionPhase === "closing") return;
    const projectId = selection.book.id;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setSelectionPhase("closing");
    closeTimer.current = window.setTimeout(() => {
      setSelection(null);
      setSelectionPhase("opening");
      closeTimer.current = null;
      window.requestAnimationFrame(() => {
        document.querySelector<HTMLElement>("[data-project-id=\"" + projectId + "\"]")?.focus();
      });
    }, reduceMotion ? 0 : 980);
  }, [selection, selectionPhase]);

  useEffect(() => {
    if (!selection || selectionPhase !== "opening") return;
    let secondFrame = 0;
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => setSelectionPhase("detail"));
    });
    return () => {
      window.cancelAnimationFrame(firstFrame);
      if (secondFrame) window.cancelAnimationFrame(secondFrame);
    };
  }, [selection, selectionPhase]);

  useEffect(() => {
    if (!selection || selectionPhase !== "detail") return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const focusTimer = window.setTimeout(() => closeButton.current?.focus(), reduceMotion ? 0 : 980);

    function handleDialogKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeSelection();
        return;
      }
      if (event.key !== "Tab") return;
      const dialog = document.getElementById("library-book-detail");
      const focusable = Array.from(
        dialog?.querySelectorAll<HTMLElement>("button:not(:disabled), [href], [tabindex]:not([tabindex='-1'])") ?? [],
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleDialogKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleDialogKeyDown);
    };
  }, [closeSelection, selection, selectionPhase]);

  useEffect(() => () => {
    if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
  }, []);

  function openSelection(book: ProjectRecord, instanceKey: string, trigger: HTMLElement) {
    if (selection) return;
    const rect = trigger.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const compact = viewportWidth <= 760;
    const desiredWidth = compact
      ? Math.min(viewportWidth * 0.5, 252)
      : Math.min(Math.max(viewportWidth * 0.2, 238), 332);
    const maxHeight = compact ? viewportHeight * 0.35 : viewportHeight * 0.62;
    const targetWidth = Math.min(desiredWidth, maxHeight * 0.64);
    const targetHeight = targetWidth / 0.64;
    const targetLeft = compact ? (viewportWidth - targetWidth) / 2 : Math.max(58, viewportWidth * 0.095);
    const targetTop = compact ? Math.max(74, viewportHeight * 0.105) : Math.max(102, viewportHeight * 0.16);
    const originCenterX = rect.left + rect.width / 2;
    const originCenterY = rect.top + rect.height / 2;

    setSelectionPhase("opening");
    setSelection({
      book,
      instanceKey,
      origin: {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        x: targetLeft + targetWidth / 2 - originCenterX,
        y: targetTop + targetHeight / 2 - originCenterY,
        scale: targetWidth / rect.width,
      },
    });
  }

  function selectFromIndex(book: ProjectRecord) {
    if (selection?.book.id === book.id) return;
    const trigger = document.querySelector<HTMLElement>("[data-project-id=\"" + book.id + "\"]");
    if (trigger) openSelection(book, "0-" + book.id, trigger);
  }

  const selectedBook = selection?.book ?? null;
  const extractedStyle = selection
    ? ({
        left: selection.origin.left + "px",
        top: selection.origin.top + "px",
        width: selection.origin.width + "px",
        height: selection.origin.height + "px",
        "--extract-x": selection.origin.x + "px",
        "--extract-y": selection.origin.y + "px",
        "--extract-scale": selection.origin.scale,
      } as React.CSSProperties)
    : undefined;

  return (
    <main className={"work-library " + (selection ? "has-library-selection" : "")} data-theme="dark" tabIndex={-1}>
      <div className="library-atmosphere" aria-hidden="true" />
      <div className="library-film-grain" aria-hidden="true" />

      {selectedBook && (
        <div className="library-selection-backdrop" aria-hidden="true">
          <Image src={selectedBook.cover} alt="" fill sizes="100vw" unoptimized />
        </div>
      )}

      <header className="library-header">
        <div className="library-brand">
          <span>幕</span>
          <div><strong>幕间</strong><small>INTERLUDE</small></div>
        </div>
        <p>作品目录 / {String(books.length).padStart(2, "0")}</p>
        <button className="library-continue" onClick={onContinue}><Play size={14} />继续上次创作</button>
      </header>

      <section
        className={"library-hero " + (selection && selectionPhase !== "closing" ? "has-extracted-book" : "")}
        aria-labelledby="library-title"
        aria-describedby="library-description"
      >
        <div className="library-copy">
          <span>INTERLUDE STORY WORLDS</span>
          <h1 id="library-title">幕间</h1>
          <div className="library-copy-foot">
            <p id="library-description">从书架上抽出一部作品，进入它独立的正文、角色、记忆与仍在生长的生活。</p>
            <small>点击封面抽出</small>
          </div>
        </div>

        <div className="library-marquee" aria-label="作品书架">
          <div className="library-books-track">
            <ol className="library-books" aria-label="作品列表">
              {books.map((book, index) => {
                const instanceKey = "0-" + book.id;
                const isOrigin = selection?.instanceKey === instanceKey;
                return (
                  <li
                    className={"library-book-item library-book-item-" + (index + 1) + (isOrigin ? " is-extraction-origin" : "")}
                    key={instanceKey}
                  >
                    <button
                      id={"library-book-" + book.id}
                      className={"library-book library-book-" + (index + 1)}
                      data-project-id={book.id}
                      aria-label={"抽出作品《" + book.title + "》，" + book.status}
                      aria-current={activeBookId === book.id ? "true" : undefined}
                      aria-expanded={selection?.book.id === book.id}
                      aria-controls="library-book-detail"
                      tabIndex={!selection ? 0 : -1}
                      onClick={(event) => openSelection(book, instanceKey, event.currentTarget)}
                    >
                      <span className="library-book-volume" aria-hidden="true">
                        <span className="library-book-back" />
                        <span className="library-book-pages" />
                        <span className="library-book-cover">
                          <Image src={book.cover} alt="" fill sizes="(max-width: 760px) 38vw, 14vw" unoptimized />
                          <span className="library-book-index">{String(index + 1).padStart(2, "0")}</span>
                          <span className="library-book-type">{book.kicker}</span>
                          <span className="library-book-copy">
                            <small>{book.genre}</small>
                            <strong>{book.title}</strong>
                            <em>{book.status}</em>
                          </span>
                        </span>
                        <span className="library-book-edge" />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>

        <nav className="library-genres" aria-label="按作品选择">
          {books.map((book) => (
            <button
              className={selection?.book.id === book.id ? "active" : ""}
              key={book.id}
              onClick={() => selectFromIndex(book)}
              tabIndex={selection ? -1 : 0}
            >
              {book.genre}
            </button>
          ))}
        </nav>
      </section>

      {selection && selectedBook && (
        <>
          <button
            className="library-selection-scrim"
            aria-label="收回作品"
            tabIndex={-1}
            onClick={closeSelection}
          />

          <button
            className={"library-extracted-book " + (selectionPhase === "detail" ? "is-detail" : "")}
            style={extractedStyle}
            aria-label={"进入作品《" + selectedBook.title + "》工作台"}
            onClick={() => onOpen(selectedBook)}
          >
            <span className="library-book-volume" aria-hidden="true">
              <span className="library-book-back" />
              <span className="library-book-pages" />
              <span className="library-book-cover">
                <Image src={selectedBook.cover} alt="" fill sizes="(max-width: 760px) 52vw, 24vw" unoptimized />
                <span className="library-book-index">{String(books.findIndex((book) => book.id === selectedBook.id) + 1).padStart(2, "0")}</span>
                <span className="library-book-type">{selectedBook.kicker}</span>
                <span className="library-book-copy">
                  <small>{selectedBook.genre}</small>
                  <strong>{selectedBook.title}</strong>
                  <em>{selectedBook.status}</em>
                </span>
              </span>
              <span className="library-book-edge" />
            </span>
          </button>

          <aside
            id="library-book-detail"
            className={"library-book-detail " + (selectionPhase === "detail" ? "is-detail" : "")}
            role="dialog"
            aria-modal="true"
            aria-labelledby="library-detail-title"
            aria-describedby="library-detail-summary"
          >
            <button ref={closeButton} className="library-detail-close" onClick={closeSelection} aria-label="收回这本书"><X size={18} /></button>
            <p>{selectedBook.genre}</p>
            <h2 id="library-detail-title">{selectedBook.title}</h2>
            <p id="library-detail-summary">{selectedBook.summary}</p>
            <dl>
              <div><dt>创作状态</dt><dd>{selectedBook.status}</dd></div>
              <div><dt>进入位置</dt><dd>{selectedBook.ready ? "对话现场" : "编剧室"}</dd></div>
            </dl>
            <button className="library-detail-enter" onClick={() => onOpen(selectedBook)}>
              进入作品 <ArrowUpRight size={17} />
            </button>
          </aside>
        </>
      )}
    </main>
  );
}
export function InterludePrototype() {
  const [surface, setSurface] = useState<Surface>("library");
  const [view, setView] = useState<View>("chat");
  const [activeProjectId, setActiveProjectId] = useState(libraryProjects[0].id);
  const [readerState, setReaderState] = useState<ReaderState>(initialReaderState);
  const [lens, setLens] = useState<Lens>("omniscient");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState("rain-room");
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [composer, setComposer] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [memories, setMemories] = useState<MemoryRecord[]>(initialMemories);
  const [memoryMode, setMemoryMode] = useState<"map" | "ledger">("map");
  const [characterSpace, setCharacterSpace] = useState<CharacterId | null>(null);
  const [selectedMemoryId, setSelectedMemoryId] = useState("tea");
  const [memoryDraft, setMemoryDraft] = useState<MemoryRecord>(initialMemories[0]);
  const [memoryFilter, setMemoryFilter] = useState<"all" | MemoryStatus>("all");
  const [skills, setSkills] = useState<SkillRecord[]>(initialSkills);
  const [selectedCharacter, setSelectedCharacter] = useState<"linzhi" | "chenyan">("linzhi");
  const [characterTab, setCharacterTab] = useState<"profile" | "skill" | "prompt" | "memory" | "voice" | "versions">("skill");
  const [selectedSkillId, setSelectedSkillId] = useState("counter-question");
  const [skillDraft, setSkillDraft] = useState<SkillRecord>(initialSkills[2]);
  const [showSkillEditor, setShowSkillEditor] = useState(false);
  const [rehearsal, setRehearsal] = useState("");
  const [studioAnalyzed, setStudioAnalyzed] = useState(true);
  const [projectDrafts, setProjectDrafts] = useState<Record<string, string>>(() => ({ ...initialProjectDrafts }));
  const [preparedProjectIds, setPreparedProjectIds] = useState<string[]>([]);
  const [toast, setToast] = useState("");
  const [theme, setTheme] = useState<Theme>("dark");
  const [hydrated, setHydrated] = useState(false);
  const timers = useRef<number[]>([]);
  const previousSurface = useRef<Surface>("library");
  const mobileMenuButton = useRef<HTMLButtonElement>(null);
  const sidebarCloseButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const stored = window.localStorage.getItem("interlude-prototype-v2");
        const hasCinematicTheme = window.localStorage.getItem(CINEMATIC_THEME_VERSION) === "ready";
        if (stored) {
          const data = JSON.parse(stored) as { messages?: Message[]; memories?: MemoryRecord[]; skills?: SkillRecord[]; theme?: Theme; reader?: Partial<ReaderState>; activeProjectId?: string; view?: View; projectDrafts?: Record<string, string>; preparedProjectIds?: string[] };
          if (data.messages?.length) setMessages(data.messages);
          if (data.memories?.length) {
            setMemories(data.memories);
            setMemoryDraft(data.memories.find((memory) => memory.id === "tea") ?? data.memories[0]);
          }
          if (data.skills?.length) {
            setSkills(data.skills);
            setSkillDraft(data.skills.find((skill) => skill.id === "counter-question") ?? data.skills[0]);
          }
          if (data.reader) {
            const sceneId = initialReaderScenes.some((scene) => scene.id === data.reader?.sceneId)
              ? data.reader.sceneId as string
              : initialReaderState.sceneId;
            const cueCount = initialReaderScenes
              .find((scene) => scene.id === sceneId)
              ?.beats.filter((beat) => beat.kind === "dialogue").length ?? 0;
            setReaderState({
              mode: data.reader.mode === "rehearsal" ? "rehearsal" : "novel",
              sceneId,
              cueIndex: Number.isInteger(data.reader.cueIndex) ? Math.min(Math.max(0, data.reader.cueIndex as number), Math.max(0, cueCount - 1)) : 0,
            });
          }
          const storedProject = libraryProjects.find((project) => project.id === data.activeProjectId);
          if (storedProject) {
            setActiveProjectId(storedProject.id);
            setStudioAnalyzed(storedProject.ready);
          }
          if (data.projectDrafts && typeof data.projectDrafts === "object") {
            setProjectDrafts(Object.fromEntries(libraryProjects.map((project) => [project.id, typeof data.projectDrafts?.[project.id] === "string" ? data.projectDrafts[project.id] : project.seedText])));
          }
          if (Array.isArray(data.preparedProjectIds)) {
            setPreparedProjectIds(data.preparedProjectIds.filter((id) => libraryProjects.some((project) => project.id === id && !project.ready)));
          }
          if (navItems.some((item) => item.id === data.view)) setView(data.view as View);
          if (hasCinematicTheme && (data.theme === "light" || data.theme === "dark")) setTheme(data.theme);
        }
        if (!hasCinematicTheme) window.localStorage.setItem(CINEMATIC_THEME_VERSION, "ready");
      } catch {
        // Keep the embedded demo if local prototype data is malformed.
      }
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem("interlude-prototype-v2", JSON.stringify({ messages, memories, skills, theme, reader: readerState, activeProjectId, view, projectDrafts, preparedProjectIds }));
  }, [activeProjectId, hydrated, messages, memories, preparedProjectIds, projectDrafts, readerState, skills, theme, view]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    if (previousSurface.current === surface) return;
    previousSurface.current = surface;
    const target = surface === "library"
      ? document.querySelector<HTMLElement>(`[data-project-id="${activeProjectId}"]`)
      : document.querySelector<HTMLElement>(".main-area");
    target?.focus();
  }, [activeProjectId, surface]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const mobileViewport = window.matchMedia("(max-width: 920px)");
    if (!mobileViewport.matches) return;
    const sidebar = document.getElementById("workspace-sidebar");
    const focusable = Array.from(sidebar?.querySelectorAll<HTMLElement>("button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex='-1'])") ?? []);
    sidebarCloseButton.current?.focus();

    function handleSidebarKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setSidebarOpen(false);
        requestAnimationFrame(() => mobileMenuButton.current?.focus());
        return;
      }
      if (event.key !== "Tab" || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    function handleViewportChange(event: MediaQueryListEvent) {
      if (event.matches) return;
      setSidebarOpen(false);
      requestAnimationFrame(() => document.querySelector<HTMLElement>(".main-area")?.focus());
    }

    document.addEventListener("keydown", handleSidebarKeyDown);
    mobileViewport.addEventListener("change", handleViewportChange);
    return () => {
      document.removeEventListener("keydown", handleSidebarKeyDown);
      mobileViewport.removeEventListener("change", handleViewportChange);
    };
  }, [sidebarOpen]);

  useEffect(() => {
    if (!hydrated) return;

    function applyLocation() {
      const match = window.location.hash.match(/^#project=([^&]+)/);
      const project = match ? libraryProjects.find((item) => item.id === decodeURIComponent(match[1])) : undefined;
      if (!project) {
        setSurface("library");
        return;
      }
      const historyView = window.history.state?.view as View | undefined;
      setActiveProjectId(project.id);
      setStudioAnalyzed(project.ready);
      setView(navItems.some((item) => item.id === historyView) ? historyView as View : project.ready ? "chat" : "studio");
      setSurface("workspace");
    }

    if (!window.location.hash) window.history.replaceState({ surface: "library" }, "", "#library");
    applyLocation();
    window.addEventListener("popstate", applyLocation);
    return () => window.removeEventListener("popstate", applyLocation);
  }, [hydrated]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const canonCount = memories.filter((memory) => memory.status === "canon").length + 40;
  const candidateCount = memories.filter((memory) => memory.status === "candidate").length;

  const filteredMemories = useMemo(() => {
    if (memoryFilter === "all") return memories;
    return memories.filter((memory) => memory.status === memoryFilter);
  }, [memories, memoryFilter]);
  const activeProject = libraryProjects.find((project) => project.id === activeProjectId) ?? libraryProjects[0];

  function goTo(nextView: View) {
    setView(nextView);
    if (surface === "workspace" && window.history.state?.surface === "workspace") {
      window.history.replaceState({ ...window.history.state, view: nextView }, "", window.location.href);
    }
    if (sidebarOpen) {
      setSidebarOpen(false);
      requestAnimationFrame(() => mobileMenuButton.current?.focus());
    }
  }

  function openProject(project: ProjectRecord) {
    const nextView: View = project.ready ? "chat" : "studio";
    setActiveProjectId(project.id);
    setStudioAnalyzed(project.ready);
    setView(nextView);
    setSidebarOpen(false);
    window.history.pushState({ surface: "workspace", projectId: project.id, view: nextView, fromLibrary: true }, "", `#project=${encodeURIComponent(project.id)}`);
    setSurface("workspace");
  }

  function continueProject() {
    setSidebarOpen(false);
    window.history.pushState({ surface: "workspace", projectId: activeProjectId, view, fromLibrary: true }, "", `#project=${encodeURIComponent(activeProjectId)}`);
    setSurface("workspace");
  }

  function returnToLibrary() {
    setSidebarOpen(false);
    setShowSkillEditor(false);
    if (window.history.state?.surface === "workspace" && window.history.state?.fromLibrary) {
      window.history.back();
      return;
    }
    window.history.replaceState({ surface: "library" }, "", "#library");
    setSurface("library");
  }

  function closeSidebar() {
    setSidebarOpen(false);
    requestAnimationFrame(() => mobileMenuButton.current?.focus());
  }

  function notify(message: string) {
    setToast(message);
  }

  function sendMessage() {
    const text = composer.trim();
    if (!text || isReplying) return;
    setComposer("");
    setMessages((current) => [...current, { id: uid("msg"), speaker: "author", text, time: "刚刚" }]);
    setIsReplying(true);
    const scripted: Omit<Message, "id">[] = [
      { speaker: "chenyan", text: "没有。只是她觉得我把纪念日忘了。", time: "刚刚" },
      { speaker: "linzhi", text: "“只是”？有人提着桂花乌龙在楼下站了四十分钟。", time: "刚刚" },
      { speaker: "chenyan", text: "你喝完的时候，说过翻篇了。", time: "刚刚" },
    ];
    scripted.forEach((message, index) => {
      const timer = window.setTimeout(() => {
        setMessages((current) => [...current, { ...message, id: uid("msg") }]);
        if (index === scripted.length - 1) {
          setIsReplying(false);
          notify("编剧 Agent 发现了 1 条候选记忆");
        }
      }, 520 * (index + 1));
      timers.current.push(timer);
    });
  }

  function openMemory(id: string) {
    const record = memories.find((memory) => memory.id === id);
    setSelectedMemoryId(id);
    if (record) setMemoryDraft(record);
    setMemoryMode("ledger");
    setCharacterSpace(null);
    goTo("memory");
  }

  function saveMemory(nextStatus?: MemoryStatus) {
    const record = { ...memoryDraft, status: nextStatus ?? memoryDraft.status };
    setMemories((current) => current.map((memory) => (memory.id === record.id ? record : memory)));
    setMemoryDraft(record);
    notify(nextStatus === "canon" ? "已收录为正典，角色认知同步更新" : "记忆修改已保存");
  }

  function addMemory() {
    const record: MemoryRecord = {
      id: uid("memory"),
      title: "未命名的新记忆",
      summary: "写下这件事客观发生了什么。",
      status: "candidate",
      category: "角色记忆",
      timeline: "正文线 / 第十二章后",
      place: "待补充",
      related: ["linzhi"],
      source: "作者手动创建",
      locked: false,
      perspectives: {
        omniscient: "补充客观事实。",
        linzhi: "补充林栀如何理解这件事。",
        chenyan: "沈砚暂不知情。",
        reader: "尚未向读者揭示。",
      },
    };
    setMemories((current) => [record, ...current]);
    setSelectedMemoryId(record.id);
    setMemoryDraft(record);
    setMemoryMode("ledger");
    setCharacterSpace(null);
    notify("已创建一条候选记忆");
  }

  function openCharacterSkill(character: CharacterId) {
    if (character !== "linzhi" && character !== "chenyan") {
      notify("场景角色的 Skill 面板会在下一版开放");
      return;
    }
    setSelectedCharacter(character);
    setCharacterTab("skill");
    const first = skills.find((skill) => skill.owner === character);
    if (first) {
      setSelectedSkillId(first.id);
      setSkillDraft(first);
    }
    goTo("characters");
  }

  function selectSkill(id: string) {
    const record = skills.find((skill) => skill.id === id);
    setSelectedSkillId(id);
    if (record) setSkillDraft(record);
  }

  function selectMemory(id: string) {
    const record = memories.find((memory) => memory.id === id);
    setSelectedMemoryId(id);
    if (record) setMemoryDraft(record);
  }

  function saveSkill() {
    setSkills((current) => current.map((skill) => (skill.id === skillDraft.id ? skillDraft : skill)));
    setShowSkillEditor(false);
    notify("Skill 已保存为 v1.4，可随时回滚");
  }

  function resetDemo() {
    if (!window.confirm("要恢复最初的演示内容吗？你在原型里的修改会被清除。")) return;
    setMessages(initialMessages);
    setMemories(initialMemories);
    setSkills(initialSkills);
    setSelectedMemoryId("tea");
    setSelectedSkillId("counter-question");
    setMemoryDraft(initialMemories[0]);
    setSkillDraft(initialSkills[2]);
    setReaderState(initialReaderState);
    setProjectDrafts({ ...initialProjectDrafts });
    setPreparedProjectIds([]);
    setStudioAnalyzed(true);
    setActiveProjectId(libraryProjects[0].id);
    setView("chat");
    if (window.history.state?.surface === "workspace") {
      window.history.replaceState({ ...window.history.state, projectId: libraryProjects[0].id, view: "chat" }, "", `#project=${libraryProjects[0].id}`);
    }
    window.localStorage.removeItem("interlude-prototype-v2");
    notify("演示数据已恢复");
  }

  if (surface === "library") {
    return (
      <ProjectLibrary
        books={libraryProjects}
        activeBookId={activeProjectId}
        onOpen={openProject}
        onContinue={continueProject}
      />
    );
  }

  return (
    <div className="app-shell" data-theme={theme} data-view={view}>
      <div className="film-grain" aria-hidden="true" />
      <aside id="workspace-sidebar" className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="brand-row">
          <button className="brand-mark" onClick={() => goTo("chat")} aria-label="返回对话现场">幕</button>
          <div><strong>幕间</strong><span>INTERLUDE</span></div>
          <button ref={sidebarCloseButton} className="icon-button sidebar-close" onClick={closeSidebar} aria-label="关闭导航"><X size={18} /></button>
        </div>

        <button className="project-card" onClick={returnToLibrary} aria-label={`返回作品库，当前作品：${activeProject.title}`}>
          <span className="project-cover" aria-hidden="true"><Image src={activeProject.cover} alt="" width={316} height={780} unoptimized /><b>{activeProject.title.slice(0, 1)}</b></span>
          <span><strong>{activeProject.title}</strong><small>{activeProject.genre} / {activeProject.status}</small></span>
          <ChevronLeft size={16} />
        </button>

        <nav className="main-nav" aria-label="作品功能">
          <p>创作空间</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} className={view === item.id ? "active" : ""} aria-current={view === item.id ? "page" : undefined} onClick={() => goTo(item.id)}>
                <Icon size={18} />
                <span><strong>{item.label}</strong><small>{item.caption}</small></span>
                {activeProject.ready && item.id === "memory" && candidateCount > 0 && <b>{candidateCount}</b>}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-foot">
          {activeProject.ready
            ? <button onClick={resetDemo}><RotateCcw size={16} /> 恢复演示</button>
            : <button onClick={() => goTo("studio")}><Sparkles size={16} /> 完善构想</button>}
          <div className="author-mini"><span>韩</span><div><strong>作者</strong><small>作品所有者</small></div><MoreHorizontal size={17} aria-hidden="true" /></div>
        </div>
      </aside>

      {sidebarOpen && <button className="sidebar-scrim" aria-label="关闭导航" onClick={closeSidebar} />}

      <main className="main-area" tabIndex={-1}>
        <header className="topbar">
          <div className="topbar-left">
            <button ref={mobileMenuButton} className="icon-button mobile-menu" onClick={() => setSidebarOpen(true)} aria-label="打开导航" aria-expanded={sidebarOpen} aria-controls="workspace-sidebar"><Menu size={20} /></button>
            <button className="workspace-library-back" onClick={returnToLibrary} aria-label="返回作品库"><ChevronLeft size={16} /><span>作品库</span></button>
            <div className="breadcrumb"><span>{activeProject.title}</span><i>/</i><strong>{navItems.find((item) => item.id === view)?.label}</strong></div>
          </div>
          <div className="topbar-controls">
            {activeProject.ready ? <>
              <button className="compact-select" onClick={() => notify("时间线切换器将在下一版开放")} aria-label="切换时间线"><GitBranch size={15} /><span>正文线 / 第十二章后</span><ChevronDown size={14} /></button>
              <label className="compact-select lens-select"><Eye size={15} /><select value={lens} onChange={(event) => setLens(event.target.value as Lens)} aria-label="预览视角">{Object.entries(lensMeta).map(([key, item]) => <option key={key} value={key}>{item.label}</option>)}</select><ChevronDown size={14} /></label>
            </> : <span className="compact-select"><CircleDot size={14} /><span>构想阶段</span></span>}
            <button className="icon-button theme-toggle" onClick={() => setTheme((current) => current === "light" ? "dark" : "light")} aria-label={theme === "light" ? "切换到暗色模式" : "切换到浅色模式"} title={theme === "light" ? "暗色模式" : "浅色模式"}>{theme === "light" ? <Moon size={17} /> : <Sun size={17} />}</button>
          </div>
        </header>

        <section className="workspace" data-view={view}>
          {activeProject.ready && view === "chat" && (
            <ChatView
              selectedRoom={selectedRoom}
              setSelectedRoom={setSelectedRoom}
              messages={messages}
              composer={composer}
              setComposer={setComposer}
              sendMessage={sendMessage}
              isReplying={isReplying}
              candidate={memories.find((memory) => memory.id === "tea")}
              openMemory={openMemory}
              notify={notify}
              lens={lens}
            />
          )}
          {activeProject.ready && view === "reader" && (
            <ReaderView
              scenes={initialReaderScenes}
              state={readerState}
              setState={setReaderState}
            />
          )}
          {activeProject.ready && view === "studio" && (
            <StudioView
              text={projectDrafts[activeProject.id] ?? activeProject.seedText}
              setText={(text) => setProjectDrafts((current) => ({ ...current, [activeProject.id]: text }))}
              analyzed={studioAnalyzed}
              setAnalyzed={setStudioAnalyzed}
              onCreate={() => { setSelectedRoom("rain-room"); goTo("chat"); notify("2 个角色已加入「雨夜客厅」"); }}
            />
          )}
          {activeProject.ready && view === "characters" && (
            <CharactersView
              selectedCharacter={selectedCharacter}
              setSelectedCharacter={setSelectedCharacter}
              tab={characterTab}
              setTab={setCharacterTab}
              skills={skills}
              selectedSkillId={selectedSkillId}
              setSelectedSkillId={selectSkill}
              openEditor={(id) => { selectSkill(id); setShowSkillEditor(true); }}
              rehearsal={rehearsal}
              setRehearsal={setRehearsal}
              openMemory={() => { setMemoryMode("ledger"); goTo("memory"); }}
              notify={notify}
            />
          )}
          {activeProject.ready && view === "memory" && (
            <MemoryView
              memories={memories}
              canonCount={canonCount}
              candidateCount={candidateCount}
              mode={memoryMode}
              setMode={setMemoryMode}
              characterSpace={characterSpace}
              setCharacterSpace={setCharacterSpace}
              openCharacterSkill={openCharacterSkill}
              openMemory={openMemory}
              selectedMemoryId={selectedMemoryId}
              setSelectedMemoryId={selectMemory}
              draft={memoryDraft}
              setDraft={setMemoryDraft}
              saveMemory={saveMemory}
              addMemory={addMemory}
              filter={memoryFilter}
              setFilter={setMemoryFilter}
              filteredMemories={filteredMemories}
              lens={lens}
              setLens={setLens}
            />
          )}
          {activeProject.ready && view === "world" && <WorldView notify={notify} />}
          {!activeProject.ready && view === "studio" && (
            <ProjectSetupView
              project={activeProject}
              text={projectDrafts[activeProject.id] ?? activeProject.seedText}
              setText={(text) => setProjectDrafts((current) => ({ ...current, [activeProject.id]: text }))}
              prepared={preparedProjectIds.includes(activeProject.id)}
              onPrepare={() => setPreparedProjectIds((current) => current.includes(activeProject.id) ? current : [...current, activeProject.id])}
              notify={notify}
            />
          )}
          {!activeProject.ready && view !== "studio" && (
            <ProjectEmptyView project={activeProject} view={view} goToStudio={() => goTo("studio")} />
          )}
        </section>
      </main>

      <nav className="mobile-nav" aria-label="移动端导航">
        {navItems.map((item) => {
          const Icon = item.icon;
          return <button key={item.id} className={view === item.id ? "active" : ""} aria-current={view === item.id ? "page" : undefined} onClick={() => goTo(item.id)}><Icon size={18} /><span>{item.mobileLabel}</span></button>;
        })}
      </nav>

      {showSkillEditor && (
        <SkillEditor
          draft={skillDraft}
          setDraft={setSkillDraft}
          close={() => setShowSkillEditor(false)}
          save={saveSkill}
          rehearsal={rehearsal}
          setRehearsal={setRehearsal}
        />
      )}

      <div className={`toast ${toast ? "toast-show" : ""}`} role="status" aria-live="polite"><Check size={16} />{toast}</div>
    </div>
  );
}

function ProjectSetupView({ project, text, setText, prepared, onPrepare, notify }: {
  project: ProjectRecord;
  text: string;
  setText: (text: string) => void;
  prepared: boolean;
  onPrepare: () => void;
  notify: (message: string) => void;
}) {
  function prepareProject() {
    onPrepare();
    notify(`《${project.title}》的角色与世界草案已生成`);
  }

  return (
    <div className="project-setup-page">
      <figure className="project-setup-cover">
        <Image src={project.cover} alt={`《${project.title}》的构想封面`} fill sizes="(max-width: 640px) 100vw, 40vw" unoptimized />
        <figcaption><span>{project.genre}</span><strong>{project.title}</strong><small>{project.status}</small></figcaption>
      </figure>
      <section className="project-setup-sheet">
        <header><span className="section-kicker">独立作品工作台 / 构想阶段</span><h1>先给编剧一个开场</h1><p>{project.summary}</p></header>
        <label>
          <span>一句话设定或第一段脑洞</span>
          <textarea value={text} onChange={(event) => setText(event.target.value)} rows={8} />
        </label>
        {!prepared ? (
          <button className="project-prepare-button" onClick={prepareProject} disabled={!text.trim()}><WandSparkles size={17} />生成角色与世界草案<ArrowUpRight size={15} /></button>
        ) : (
          <div className="project-setup-results" aria-live="polite">
            <div><span>01</span><p><strong>角色种子</strong><small>识别到 2 至 4 个潜在角色，等待你确认姓名与关系。</small></p></div>
            <div><span>02</span><p><strong>世界入口</strong><small>已提取核心地点、时间与一个不可违背的世界规则。</small></p></div>
            <div><span>03</span><p><strong>下一步</strong><small>导入正文后，阅读、角色、记忆与世界书会逐项开放。</small></p></div>
          </div>
        )}
      </section>
    </div>
  );
}

function ProjectEmptyView({ project, view, goToStudio }: {
  project: ProjectRecord;
  view: View;
  goToStudio: () => void;
}) {
  const viewLabel = navItems.find((item) => item.id === view)?.label ?? "创作空间";
  return (
    <div className="project-empty-page">
      <div className="project-empty-cover"><Image src={project.cover} alt="" fill sizes="260px" unoptimized /></div>
      <span className="section-kicker">{project.title} / {viewLabel}</span>
      <h1>这个空间还在纸上。</h1>
      <p>《{project.title}》目前只有构想。先把第一段文字交给编剧，生成角色与世界后，{viewLabel}就会成为这部作品自己的空间。</p>
      <button onClick={goToStudio}><Sparkles size={16} />回到编剧室</button>
    </div>
  );
}

function ReaderView({ scenes, state, setState }: {
  scenes: ReaderScene[];
  state: ReaderState;
  setState: (state: ReaderState) => void;
}) {
  const [playback, setPlayback] = useState<PlaybackState>("idle");
  const scene = scenes.find((item) => item.id === state.sceneId) ?? scenes[0];
  const sceneIndex = scenes.findIndex((item) => item.id === scene.id);
  const cues = useMemo(
    () => scene.beats.filter((beat): beat is Extract<NovelBeat, { kind: "dialogue" }> => beat.kind === "dialogue"),
    [scene],
  );
  const cueIndex = Math.min(Math.max(0, state.cueIndex), Math.max(0, cues.length - 1));
  const hasCues = cues.length > 0;
  const currentCue = cues[cueIndex];
  const progress = hasCues ? ((cueIndex + 1) / cues.length) * 100 : 0;

  useEffect(() => {
    if (state.mode !== "rehearsal" || playback !== "playing" || !currentCue) return;
    const duration = Math.min(6200, Math.max(2500, currentCue.text.length * 120 + 1500));
    const timer = window.setTimeout(() => {
      if (cueIndex >= cues.length - 1) {
        setPlayback("ended");
      } else {
        setState({ ...state, cueIndex: cueIndex + 1 });
      }
    }, duration);
    return () => window.clearTimeout(timer);
  }, [cueIndex, cues.length, currentCue, playback, setState, state]);

  useEffect(() => {
    if (state.mode !== "novel") return;
    document.getElementById(`reader-scene-${state.sceneId}`)?.scrollIntoView({ block: "start" });
  }, [state.mode, state.sceneId]);

  function switchMode(mode: ReaderMode) {
    if (mode === state.mode) return;
    setPlayback("idle");
    setState({ ...state, mode, cueIndex: 0 });
  }

  function selectScene(id: string, mode = state.mode) {
    setPlayback("idle");
    setState({ mode, sceneId: id, cueIndex: 0 });
  }

  function selectNovelScene(id: string) {
    selectScene(id, "novel");
    document.getElementById(`reader-scene-${id}`)?.scrollIntoView({ block: "start" });
  }

  function shiftScene(direction: -1 | 1) {
    const next = Math.min(Math.max(0, sceneIndex + direction), scenes.length - 1);
    selectScene(scenes[next].id, "rehearsal");
  }

  function jumpCue(direction: -1 | 1) {
    if (!hasCues) return;
    setPlayback("paused");
    const next = Math.min(Math.max(0, cueIndex + direction), cues.length - 1);
    setState({ ...state, cueIndex: next });
  }

  function togglePlayback() {
    if (!hasCues) return;
    if (playback === "playing") {
      setPlayback("paused");
      return;
    }
    if (playback === "ended") setState({ ...state, cueIndex: 0 });
    setPlayback("playing");
  }

  const visibleCues = cues.slice(Math.max(0, cueIndex - 2), cueIndex + 1);

  return (
    <div className="reader-page" data-reader-mode={state.mode}>
      <header className="reader-header">
        <div>
          <span className="section-kicker">已导入正文 / AI 分场完成</span>
          <h1>阅读《雾港来信》</h1>
          <p>读完整手稿，或让识别出的角色对白在场景里重新发生。</p>
        </div>
        <div className="reader-mode-switch" role="group" aria-label="阅读模式">
          <button aria-pressed={state.mode === "novel"} className={state.mode === "novel" ? "active" : ""} onClick={() => switchMode("novel")}><FileText size={15} />正文阅读</button>
          <button aria-pressed={state.mode === "rehearsal"} className={state.mode === "rehearsal" ? "active" : ""} onClick={() => switchMode("rehearsal")}><Play size={15} />场景预演</button>
        </div>
      </header>

      <div className="reader-layout">
        <aside className="reader-scene-index">
          <div className="reader-index-head">
            <span>AI SCENE INDEX</span>
            <strong>{String(scenes.length).padStart(2, "0")} 场</strong>
          </div>
          <nav aria-label="小说场景">
            {scenes.map((item, index) => {
              const dialogueCount = item.beats.filter((beat) => beat.kind === "dialogue").length;
              return (
                <button
                  key={item.id}
                  className={scene.id === item.id ? "active" : ""}
                  aria-current={scene.id === item.id ? "true" : undefined}
                  onClick={() => state.mode === "novel" ? selectNovelScene(item.id) : selectScene(item.id, "rehearsal")}
                >
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <span><small>{item.chapterLabel}</small><strong>{item.title}</strong><em>{dialogueCount} 句对白 / {item.aiConfidence}%</em></span>
                </button>
              );
            })}
          </nav>
          <div className="reader-ai-note"><Sparkles size={15} /><p><strong>对白已自动识别</strong><span>场景边界与角色归属可在编剧室继续校正。</span></p></div>
        </aside>

        {state.mode === "novel" && (
          <div className="reader-manuscript-scroll">
            <article className="reader-manuscript" aria-labelledby="manuscript-title">
              <header>
                <span>雾港来信 / 当前手稿</span>
                <h2 id="manuscript-title">十二章与四场可预演片段</h2>
                <p>以下为当前原型中已导入的全部小说正文。AI 只负责标出场次，不改写你的原文。</p>
              </header>
              {scenes.map((item) => (
                <section key={item.id} id={`reader-scene-${item.id}`} className={scene.id === item.id ? "selected" : ""}>
                  <div className="manuscript-scene-head">
                    <div><span>{item.chapterLabel}</span><h3>{item.title}</h3><p>{item.slug}</p></div>
                    <button onClick={() => selectScene(item.id, "rehearsal")}><Play size={14} />预演这一场</button>
                  </div>
                  <div className="novel-copy">
                    {item.beats.map((beat) => beat.kind === "prose" ? (
                      <p key={beat.id}>{beat.text}</p>
                    ) : (
                      <p key={beat.id} className="novel-dialogue" aria-label={`${characters[beat.speaker].name}说：${beat.text}`}>
                        <span>“{beat.text}”</span><small>{characters[beat.speaker].name}</small>
                      </p>
                    ))}
                  </div>
                  <footer><span>{item.sourceRange}</span><span>AI 分场置信度 {item.aiConfidence}%</span></footer>
                </section>
              ))}
            </article>
          </div>
        )}

        {state.mode === "rehearsal" && (
          <section className="reader-rehearsal" aria-label={`预演场景：${scene.title}`}>
            <div className="reader-stage">
              <Image key={scene.id} className="reader-stage-image" src={scene.imageSrc} alt={scene.imageAlt} fill sizes="(max-width: 700px) 100vw, 78vw" unoptimized />
              <div className="reader-stage-matte" aria-hidden="true" />
              <header className="reader-stage-head">
                <div><span>{scene.chapterLabel}</span><strong>{scene.title}</strong><small>{scene.slug}</small></div>
                <div className="reader-scene-shift">
                  <button onClick={() => shiftScene(-1)} disabled={sceneIndex === 0} aria-label="上一场"><SkipBack size={16} /></button>
                  <span>{String(sceneIndex + 1).padStart(2, "0")} / {String(scenes.length).padStart(2, "0")}</span>
                  <button onClick={() => shiftScene(1)} disabled={sceneIndex === scenes.length - 1} aria-label="下一场"><SkipForward size={16} /></button>
                </div>
              </header>

              <div className="reader-stage-content">
                <p className="reader-stage-direction"><span>场记</span>{scene.stageDirection}</p>
                <div className="reader-cue-stack">
                  {!hasCues && <p className="reader-empty-cues">这一场暂未识别到角色对白，可以回到编剧室校正分场。</p>}
                  {visibleCues.map((cue) => (
                    <article key={cue.id} className={cue.id === currentCue?.id ? "current" : "previous"}>
                      <Avatar id={cue.speaker} size="md" />
                      <div><span><strong>{characters[cue.speaker].name}</strong>{cue.delivery && <small>{cue.delivery}</small>}</span><blockquote>{cue.text}</blockquote></div>
                    </article>
                  ))}
                </div>
                <p className="sr-only" aria-live="polite">已切换至第 {sceneIndex + 1} 场：{scene.title}</p>
                <p className="sr-only" aria-live="polite">{currentCue ? `${characters[currentCue.speaker].name}：${currentCue.text}` : ""}</p>
              </div>

              <footer className="reader-playback">
                <button onClick={() => jumpCue(-1)} disabled={!hasCues || cueIndex === 0} aria-label="上一句对白"><SkipBack size={17} /></button>
                <button className="reader-play-button" onClick={togglePlayback} disabled={!hasCues} aria-label={playback === "playing" ? "暂停预演" : playback === "ended" ? "重新播放预演" : "播放预演"}>
                  {playback === "playing" ? <Pause size={20} /> : playback === "ended" ? <RotateCcw size={19} /> : <Play size={20} />}
                </button>
                <button onClick={() => jumpCue(1)} disabled={!hasCues || cueIndex === cues.length - 1} aria-label="下一句对白"><SkipForward size={17} /></button>
                <div className="reader-playback-status"><span>{hasCues ? String(cueIndex + 1).padStart(2, "0") : "00"} / {String(cues.length).padStart(2, "0")}</span><i role="progressbar" aria-label="对白播放进度" aria-valuemin={0} aria-valuemax={Math.max(1, cues.length)} aria-valuenow={hasCues ? cueIndex + 1 : 0}><b style={{ width: `${progress}%` }} /></i><small role="status" aria-live="polite">{!hasCues ? "无对白" : playback === "playing" ? "正在预演" : playback === "paused" ? "已暂停" : playback === "ended" ? "本场结束" : "准备就绪"}</small></div>
              </footer>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function ChatView({
  selectedRoom,
  setSelectedRoom,
  messages,
  composer,
  setComposer,
  sendMessage,
  isReplying,
  candidate,
  openMemory,
  notify,
  lens,
}: {
  selectedRoom: string;
  setSelectedRoom: (id: string) => void;
  messages: Message[];
  composer: string;
  setComposer: (text: string) => void;
  sendMessage: () => void;
  isReplying: boolean;
  candidate?: MemoryRecord;
  openMemory: (id: string) => void;
  notify: (message: string) => void;
  lens: Lens;
}) {
  const [allowInterjections, setAllowInterjections] = useState(true);
  const rooms = [
    { id: "rain-room", title: "雨夜客厅", subtitle: "林栀、沈砚 / 群聊", active: true, icon: "雨" },
    { id: "linzhi-dm", title: "和林栀单独聊", subtitle: "最后回复 12 分钟前", icon: "栀" },
    { id: "bookstore", title: "旧书店打烊后", subtitle: "3 位角色 / 只观察", icon: "店" },
  ];
  const roomStill = selectedRoom === "rain-room" ? "/stills/rain-bookstore.jpg" : selectedRoom === "linzhi-dm" ? "/stills/midnight-radio.jpg" : "/stills/fog-city.jpg";
  return (
    <div className="chat-layout">
      <aside className="room-list panel-border-right">
        <div className="section-head"><div><h2>对话现场</h2><p>角色正在生活的房间</p></div><button className="square-button" aria-label="新建房间" onClick={() => notify("新房间创建器将在下一版开放")}><Plus size={18} /></button></div>
        <label className="search-box"><Search size={16} /><input type="search" aria-label="搜索房间或角色" placeholder="搜索房间或角色" /></label>
        <div className="room-section-label"><span>正在发生</span><small>1</small></div>
        <div className="room-buttons">
          {rooms.map((room) => (
            <button key={room.id} className={selectedRoom === room.id ? "active" : ""} aria-pressed={selectedRoom === room.id} onClick={() => setSelectedRoom(room.id)}>
              <span className={`room-icon ${room.id === "rain-room" ? "live" : ""}`}>{room.icon}</span>
              <span><strong>{room.title}</strong><small>{room.subtitle}</small></span>
              {room.id === "rain-room" && <i />}
            </button>
          ))}
        </div>
        <button className="new-room-button" onClick={() => notify("可选择角色、场景与导演规则创建新房间")}><Plus size={16} />新建对话</button>
      </aside>

      <section className="conversation">
        <header className="conversation-head scene-slate">
          <figure className="scene-still" aria-hidden="true"><Image src={roomStill} alt="" width={400} height={900} priority unoptimized /></figure>
          <div className="scene-slate-copy">
            <span className="scene-slug">内景 / 雾港旧书店 / 夜</span>
            <div className="scene-title-row"><div className="stacked-avatars"><Avatar id="chenyan" size="sm" /><Avatar id="linzhi" size="sm" /></div><div><h2>{selectedRoom === "rain-room" ? "雨夜客厅" : selectedRoom === "linzhi-dm" ? "和林栀单独聊" : "旧书店打烊后"}</h2><p><span className="live-dot" />角色正在依照「正文线」生活</p></div></div>
          </div>
          <button className="icon-button scene-settings" aria-label="对话设置" onClick={() => notify("已打开当前房间的导演规则预览")}><MoreHorizontal size={20} /></button>
        </header>

        <div className="messages" aria-live="polite">
          <div className="scene-divider"><span>第 12 场 / 雨后 / 连续</span></div>
          {messages.map((message) => {
            if (message.speaker === "author") {
              return <div className="message-row author-message" data-speaker="author" key={message.id}><div className="message-body"><div className="message-meta"><strong>你 / 作者</strong><time>{message.time}</time></div><div className="bubble">{message.text}</div></div><span className="author-avatar">韩</span></div>;
            }
            const speaker = characters[message.speaker];
            return (
              <div className={`message-row ${message.speaker === "director" ? "director-message" : ""}`} data-speaker={message.speaker} key={message.id}>
                <Avatar id={message.speaker} size="sm" />
                <div className="message-body"><div className="message-meta"><strong>{speaker.name}</strong>{message.speaker === "director" && <span>旁白</span>}<time>{message.time}</time></div><div className="bubble">{message.text}</div></div>
              </div>
            );
          })}
          {isReplying && <div className="message-row typing-row"><Avatar id="linzhi" size="sm" /><div className="typing"><i /><i /><i /></div></div>}
        </div>

        <div className="composer-wrap">
          <div className="quick-prompts"><button onClick={() => setComposer("@沈砚 今天有没有跟林栀吵架？")}>问问他们昨晚怎么了</button><button onClick={() => setComposer("你们继续聊，我先不插话。")}>让他们继续</button></div>
          <div className="composer-card">
            <div className="composer-mode"><button onClick={() => notify("发言身份切换器将在下一版开放")}><Pencil size={14} />作为作者发言<ChevronDown size={13} /></button><span>{lensMeta[lens].label}</span></div>
            <label className="sr-only" htmlFor="chat-composer">写一条作者消息或旁白</label>
            <textarea id="chat-composer" value={composer} onChange={(event) => setComposer(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendMessage(); } }} placeholder="@角色，或写下一句旁白……" rows={2} />
            <div className="composer-actions"><div><button aria-label="投放情节" title="投放情节"><WandSparkles size={17} /></button><button aria-label="语音" title="语音（概念功能）"><Mic2 size={17} /></button></div><button className="send-button" aria-label="发送消息" onClick={sendMessage} disabled={!composer.trim() || isReplying}><Send size={17} /></button></div>
          </div>
          <p className="prototype-note">原型使用预设回复，真实版本会由角色 Agent 按各自认知与 Skill 生成。</p>
        </div>
      </section>

      <aside className="director-panel panel-border-left">
        <div className="director-slate"><span>CONTINUITY</span><strong>场次 12</strong></div>
        <div className="director-head"><div><h3>导演台</h3><p>控制场景节奏与信息边界</p></div><button className="icon-button" aria-label="导演台设置" onClick={() => notify("导演台设置将在下一版开放")}><Settings2 size={18} /></button></div>
        <section className="director-section"><div className="mini-label">在场角色 <span>2</span></div><div className="presence-list"><div><Avatar id="linzhi" size="sm" /><span><strong>林栀</strong><small>有话想说</small></span><i className="status-online" /></div><div><Avatar id="chenyan" size="sm" /><span><strong>沈砚</strong><small>正在组织语言</small></span><i className="status-online" /></div></div></section>
        <section className="director-section"><div className="mini-label">导演规则</div><div className="rule-row"><span>允许角色主动插话</span><button className={`switch ${allowInterjections ? "is-on" : ""}`} role="switch" aria-label="允许角色主动插话" aria-checked={allowInterjections} onClick={() => setAllowInterjections((current) => !current)}><i /></button></div><div className="rule-row"><span>自动接话轮数</span><strong>3 轮</strong></div><div className="rule-row"><span>冲突保护</span><strong>严格</strong></div></section>
        {candidate && (
          <section className={`candidate-card ${candidate.status === "canon" ? "candidate-canon" : ""}`}>
            <div className="candidate-title"><span><Sparkles size={15} /></span><div><small>{candidate.status === "canon" ? "已进入作品正典" : "发现 1 条衍生事实"}</small><strong>{candidate.title}</strong></div></div>
            <p>{candidate.summary}</p>
            <div className="candidate-source"><FileText size={14} />来自本段群聊</div>
            <button onClick={() => openMemory(candidate.id)}>{candidate.status === "canon" ? "查看正典记录" : "查看并收录"}<ArrowUpRight size={15} /></button>
          </section>
        )}
        <button className="observe-button" onClick={() => notify("已进入只观察模式，角色会继续对话 3 轮")}><Eye size={16} />只观察，让他们继续</button>
      </aside>
    </div>
  );
}

function StudioView({ text, setText, analyzed, setAnalyzed, onCreate }: { text: string; setText: (text: string) => void; analyzed: boolean; setAnalyzed: (value: boolean) => void; onCreate: () => void }) {
  return (
    <div className="studio-page paper-grid">
      <header className="studio-hero">
        <span className="section-kicker">编剧 Agent 工作台</span>
        <h1>把一段文字，变成会继续生活的角色。</h1>
        <p>贴进人设、片段或一个刚冒出来的脑洞。编剧 Agent 会先读懂，再把角色、关系与世界事实拆成可编辑的草稿。</p>
      </header>
      <figure className="studio-contact-sheet">
        <div className="contact-frame"><Image src="/stills/fog-city.jpg" alt="" width={400} height={900} unoptimized /></div>
        <div className="contact-frame"><Image src="/stills/rain-bookstore.jpg" alt="" width={400} height={900} unoptimized /></div>
        <div className="contact-frame"><Image src="/stills/midnight-radio.jpg" alt="" width={400} height={900} unoptimized /></div>
        <div className="contact-frame"><Image src="/stills/fog-lighthouse.jpg" alt="" width={400} height={900} unoptimized /></div>
        <figcaption>《雾港来信》场景参考 / 编剧 Agent 提取</figcaption>
      </figure>
      <div className="studio-workbench">
        <section className="source-sheet">
          <div className="sheet-head"><div><FileText size={17} /><strong>新故事片段</strong></div><span>{text.length} 字</span></div>
          <textarea value={text} onChange={(event) => { setText(event.target.value); setAnalyzed(false); }} aria-label="故事片段" />
          <div className="sheet-foot"><span>支持小说片段、人设卡、散乱脑洞</span><button onClick={() => setAnalyzed(true)}><Sparkles size={16} />读懂这段文字</button></div>
        </section>
        <section className={`analysis-sheet ${analyzed ? "is-ready" : ""}`}>
          <div className="analysis-title"><span className="agent-orb"><Sparkles size={18} /></span><div><small>编剧 Agent</small><h2>{analyzed ? "我从里面读到了这些" : "等待重新分析"}</h2></div></div>
          {analyzed ? <>
            <div className="found-grid">
              <div className="found-card"><span>发现角色 / 2</span><div className="mini-character"><Avatar id="chenyan" size="sm" /><p><strong>沈砚</strong><small>旧书店老板 / 慢热</small></p><Check size={16} /></div><div className="mini-character"><Avatar id="linzhi" size="sm" /><p><strong>林栀</strong><small>电台编辑 / 嘴硬</small></p><Check size={16} /></div></div>
              <div className="found-card"><span>提取设定 / 4</span><ul><li>雾港，终年多雾的海港城市</li><li>两人恋爱三年</li><li>旧书店与雾港电台</li><li>一封没有署名的信</li></ul></div>
            </div>
            <div className="build-summary"><div><strong>将为角色生成</strong><p><b>9</b> 个行为 Skill / <b>6</b> 条初始 Memory / <b>2</b> 份角色 Prompt</p></div><button onClick={onCreate}>创建并进入群聊<ArrowUpRight size={16} /></button></div>
            <button className="question-row"><CircleDot size={16} /><span><strong>还有 2 个地方想问你</strong><small>例如：他们的关系是否对外公开？</small></span><ChevronDown size={16} /></button>
          </> : <div className="analysis-empty"><Sparkles size={28} /><p>左边的文字有改动。点击“读懂这段文字”，重新生成角色草稿。</p></div>}
        </section>
      </div>
    </div>
  );
}

function CharactersView({ selectedCharacter, setSelectedCharacter, tab, setTab, skills, selectedSkillId, setSelectedSkillId, openEditor, rehearsal, setRehearsal, openMemory, notify }: {
  selectedCharacter: "linzhi" | "chenyan";
  setSelectedCharacter: (id: "linzhi" | "chenyan") => void;
  tab: "profile" | "skill" | "prompt" | "memory" | "voice" | "versions";
  setTab: (tab: "profile" | "skill" | "prompt" | "memory" | "voice" | "versions") => void;
  skills: SkillRecord[];
  selectedSkillId: string;
  setSelectedSkillId: (id: string) => void;
  openEditor: (id: string) => void;
  rehearsal: string;
  setRehearsal: (text: string) => void;
  openMemory: () => void;
  notify: (message: string) => void;
}) {
  const character = characters[selectedCharacter];
  const characterSkills = skills.filter((skill) => skill.owner === selectedCharacter);
  const [prompts, setPrompts] = useState({
    linzhi: "你是林栀，《雾港来信》中的电台编辑。你敏锐、嘴硬，但从不以刻薄伤害别人。你只知道当前时间线中林栀已经亲历或被告知的事实……",
    chenyan: "你是沈砚，《雾港来信》中的旧书店老板。你慢热寡言，更习惯用行动表达在意。你不能读取其他角色未与你分享的记忆……",
  });
  const promptText = prompts[selectedCharacter];
  const tabs = [
    ["profile", "人物档案"], ["skill", "Skill"], ["prompt", "Prompt"], ["memory", "Memory"], ["voice", "声音"], ["versions", "版本"],
  ] as const;
  return (
    <div className="character-page" data-character={selectedCharacter}>
      <aside className="character-roster panel-border-right">
        <div className="section-head"><div><h2>角色档案</h2><p>人物、规则与认知边界</p></div><button className="square-button" aria-label="新建角色" onClick={() => notify("可通过一句话让编剧 Agent 起草新角色")}><Plus size={18} /></button></div>
        <label className="search-box"><Search size={16} /><input type="search" aria-label="搜索角色" placeholder="搜索角色" /></label>
        <div className="roster-list">
          {(["linzhi", "chenyan"] as const).map((id) => <button key={id} className={selectedCharacter === id ? "active" : ""} onClick={() => { setSelectedCharacter(id); const first = skills.find((skill) => skill.owner === id); if (first) setSelectedSkillId(first.id); }}><Avatar id={id} /><span><strong>{characters[id].name}</strong><small>{characters[id].role}</small></span><i /></button>)}
        </div>
        <div className="roster-note"><Sparkles size={16} /><p><strong>角色不是一份 Prompt</strong><span>她由人设、行为 Skill、所知记忆与当下关系共同组成。</span></p></div>
      </aside>
      <section className="character-main">
        <header className="character-hero">
          <figure className="character-still" aria-hidden="true"><Image src={selectedCharacter === "linzhi" ? "/stills/midnight-radio.jpg" : "/stills/rain-bookstore.jpg"} alt="" width={400} height={900} unoptimized /></figure>
          <div className="character-ident"><Avatar id={selectedCharacter} size="lg" /><div><span className="version-label">角色版本 v1.3</span><h1>{character.name}</h1><p>{character.role} / {character.tagline}</p></div></div>
          <div className="character-actions"><button onClick={() => notify("声音试播：『我没有生气。你先把伞擦干。』")}><Play size={16} />听她说一句</button><button className="primary-soft" onClick={() => notify("角色更新已保存为新版本")}><Check size={16} />保存版本</button></div>
        </header>
        <div className="tabs" role="tablist">{tabs.map(([id, label]) => <button id={`character-tab-${id}`} aria-controls={`character-panel-${id}`} role="tab" aria-selected={tab === id} key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}>{label}{id === "skill" && <span>{characterSkills.length}</span>}</button>)}</div>
        <div className="character-content" id={`character-panel-${tab}`} role="tabpanel" aria-labelledby={`character-tab-${tab}`}>
          {tab === "skill" && <div className="skill-layout">
            <section className="skill-list-pane"><div className="content-head"><div><h2>行为 Skill</h2><p>把“她会怎么做”写成作者能看懂、能试演的规则。</p></div><button onClick={() => notify("可通过一句话让编剧 Agent 起草新 Skill")}><Plus size={16} />新建 Skill</button></div>
              <div className="skill-cards">{characterSkills.map((skill) => <button key={skill.id} className={selectedSkillId === skill.id ? "active" : ""} onClick={() => setSelectedSkillId(skill.id)}><div className="skill-card-top"><span className="skill-glyph"><Sparkles size={15} /></span><span className={`tiny-toggle ${skill.enabled ? "on" : ""}`}><i /></span></div><strong>{skill.name}</strong><p>{skill.purpose}</p><div><span>{skill.trigger}</span><b>{skill.priority}优先级</b></div></button>)}</div>
            </section>
            <aside className="skill-preview">{(() => { const skill = skills.find((item) => item.id === selectedSkillId) ?? characterSkills[0]; if (!skill) return null; return <><div className="preview-label"><span>规则预览</span><button onClick={() => openEditor(skill.id)}><Pencil size={15} />编辑</button></div><div className="preview-title"><span className="skill-glyph large"><Sparkles size={18} /></span><div><h2>{skill.name}</h2><p>{skill.enabled ? "已启用" : "已停用"} / {skill.priority}优先级</p></div></div><div className="rule-block"><small>触发条件</small><p>{skill.trigger}</p></div><div className="rule-block"><small>行为规则</small><p>{skill.rule}</p></div><div className="rule-block taboo"><small>禁止事项</small><p>{skill.taboo}</p></div><div className="rehearsal-box"><div><Play size={15} /><strong>试演一句</strong></div><p>场景：被问“你是不是已经原谅他了？”</p>{rehearsal && <blockquote>{rehearsal}</blockquote>}<button onClick={() => setRehearsal(selectedCharacter === "linzhi" ? "“谁说原谅了？……奶茶倒是没浪费。”" : "“还没。先把热的喝了。”")}>{rehearsal ? "再试一次" : "让角色试演"}<ArrowUpRight size={14} /></button></div></>; })()}</aside>
          </div>}
          {tab === "prompt" && <div className="prompt-editor"><div className="content-head"><div><h2>角色 Prompt</h2><p>高级视图。这里描述角色身份、叙事边界与不可违背的原则。</p></div><span className="version-pill">v1.3 / 已发布</span></div><div className="prompt-warning"><Lock size={16} /><p><strong>角色不会自动获得全知信息。</strong>运行时只会注入当前视角可见的 Memory，以及本场景启用的 Skill。</p></div><label><span>核心身份与边界</span><textarea value={promptText} onChange={(event) => setPrompts({ ...prompts, [selectedCharacter]: event.target.value })} rows={11} /></label><div className="editor-foot"><button onClick={() => notify("编剧 Agent 会先展示 Prompt 修改前后差异")}><Sparkles size={16} />让编剧帮我优化</button><button className="primary-button" onClick={() => notify("Prompt 已保存为草稿 v1.4")}><Check size={16} />保存为新版本</button></div></div>}
          {tab === "memory" && <div className="tab-placeholder"><Brain size={28} /><h2>{character.name}的 Memory</h2><p>她知道什么、误解了什么，以及哪些事还没有发生在她眼中。</p><button onClick={openMemory}>打开记忆台账<ArrowUpRight size={15} /></button></div>}
          {tab === "profile" && <div className="profile-grid"><div className="profile-card"><span>一句话人设</span><p>{character.tagline}</p></div><div className="profile-card"><span>核心欲望</span><p>{selectedCharacter === "linzhi" ? "被坚定地选择，但不愿先承认自己需要谁。" : "守住已经拥有的生活，同时不再重复父亲的沉默。"}</p></div><div className="profile-card"><span>关系锚点</span><p>{selectedCharacter === "linzhi" ? "沈砚 / 恋人三年 / 亲密但仍有未说开的旧事" : "林栀 / 恋人三年 / 她是唯一持有书店备用钥匙的人"}</p></div><div className="profile-card"><span>语言质感</span><p>{selectedCharacter === "linzhi" ? "短句、反问、纠正细节；真正心软时会突然转移话题。" : "克制、停顿；解释很少，动作细节很多。"}</p></div></div>}
          {tab === "voice" && <div className="tab-placeholder"><Mic2 size={28} /><h2>角色声音</h2><p>为角色保存音色、情绪范围和朗读禁区；目前是交互概念位。</p><button onClick={() => notify("声音捏制流程：上传样本、调整音色、角色试演")}>开始捏声音<ArrowUpRight size={15} /></button></div>}
          {tab === "versions" && <div className="version-list"><div><span>v1.3</span><p><strong>当前发布版本</strong><small>补充「被戳穿时先反问」Skill / 今天 14:32</small></p><StatusPill status="canon" /></div><div><span>v1.2</span><p><strong>调整与沈砚的关系边界</strong><small>昨天 22:10</small></p><button>恢复</button></div><div><span>v1.1</span><p><strong>从第一至六章重新提取人设</strong><small>8 月 2 日 19:40</small></p><button>恢复</button></div></div>}
        </div>
      </section>
    </div>
  );
}

function MemoryView({ memories, canonCount, candidateCount, mode, setMode, characterSpace, setCharacterSpace, openCharacterSkill, openMemory, selectedMemoryId, setSelectedMemoryId, draft, setDraft, saveMemory, addMemory, filter, setFilter, filteredMemories, lens, setLens }: {
  memories: MemoryRecord[];
  canonCount: number;
  candidateCount: number;
  mode: "map" | "ledger";
  setMode: (mode: "map" | "ledger") => void;
  characterSpace: CharacterId | null;
  setCharacterSpace: (id: CharacterId | null) => void;
  openCharacterSkill: (id: CharacterId) => void;
  openMemory: (id: string) => void;
  selectedMemoryId: string;
  setSelectedMemoryId: (id: string) => void;
  draft: MemoryRecord;
  setDraft: (draft: MemoryRecord) => void;
  saveMemory: (status?: MemoryStatus) => void;
  addMemory: () => void;
  filter: "all" | MemoryStatus;
  setFilter: (filter: "all" | MemoryStatus) => void;
  filteredMemories: MemoryRecord[];
  lens: Lens;
  setLens: (lens: Lens) => void;
}) {
  const characterMemoryCount = characterSpace ? memories.filter((memory) => memory.related.includes(characterSpace)).length : 0;
  const characterSkillCount = characterSpace === "linzhi" ? 2 : characterSpace === "chenyan" ? 2 : characterSpace === "director" ? 4 : 1;
  return (
    <div className="memory-page" data-mode={mode}>
      <header className="memory-head">
        <div><h1>记忆中枢</h1><p>同一件事，可以有一个真相，也可以有四种不同的理解。</p></div>
        <div className="memory-head-actions"><div className="segmented"><button className={mode === "map" ? "active" : ""} onClick={() => setMode("map")}><Map size={15} />故事星图</button><button className={mode === "ledger" ? "active" : ""} onClick={() => { setMode("ledger"); setCharacterSpace(null); }}><List size={15} />记忆台账</button></div><button className="primary-button" onClick={addMemory}><Plus size={16} />新增记忆</button></div>
      </header>
      <div className="lens-bar"><span><Eye size={15} />作者预览视角</span><div>{(Object.keys(lensMeta) as Lens[]).map((id) => <button key={id} className={lens === id ? "active" : ""} onClick={() => setLens(id)}>{lensMeta[id].short}</button>)}</div><small>只改变你看到的信息，不会修改正典</small></div>
      {mode === "map" && !characterSpace && <div className="memory-map paper-grid">
        <div className="map-summary"><span><Orbit size={16} />故事星图</span><p>{canonCount} 条正典 / {candidateCount} 条待确认</p></div>
        <div className="orbit-system" role="group" aria-label="角色记忆关系图">
          <span className="orbit orbit-outer" /><span className="orbit orbit-inner" />
          <button className="memory-core" onClick={() => setMode("ledger")}><span className="core-icon"><Eye size={22} /></span><small>正典核心</small><strong>作品正典</strong><b>{canonCount}</b><em>{candidateCount} 条待确认</em></button>
          {(["linzhi", "chenyan", "director", "radio"] as CharacterId[]).map((id, index) => {
            const count = memories.filter((memory) => memory.related.includes(id)).length;
            return <button key={id} className={`orbit-node node-${index + 1}`} onClick={() => setCharacterSpace(id)}><Avatar id={id} size="md" /><strong>{characters[id].name}</strong><span>{count} 条 Memory / {id === "linzhi" || id === "chenyan" ? 2 : id === "director" ? 4 : 1} 个 Skill</span>{id === "linzhi" && candidateCount > 0 && <i>{candidateCount}</i>}</button>;
          })}
        </div>
        <div className="map-legend"><span><i className="line-solid" />共同知情</span><span><i className="line-dashed" />部分知情</span><span><b>{candidateCount}</b>待作者确认</span></div>
      </div>}
      {mode === "map" && characterSpace && <div className="character-space paper-grid">
        <button className="back-to-map" onClick={() => setCharacterSpace(null)}><ChevronLeft size={16} />返回故事星图</button>
        <div className="space-orbit"><span className="orbit orbit-outer" /><span className="orbit orbit-inner" /><div className="character-core"><Avatar id={characterSpace} size="lg" /><small>角色空间</small><strong>{characters[characterSpace].name}</strong><span>{characterMemoryCount} 条 Memory / {characterSkillCount} 个 Skill</span></div>
          <button className="space-card memory-space-card" onClick={() => { const first = memories.find((memory) => memory.related.includes(characterSpace)); if (first) openMemory(first.id); else setMode("ledger"); }}><span><FileText size={24} /></span><small>MEMORY</small><strong>{characterMemoryCount}</strong><p>{memories.find((memory) => memory.related.includes(characterSpace))?.title ?? "尚无角色记忆"}</p><ArrowUpRight size={16} /></button>
          <button className="space-card skill-space-card" onClick={() => openCharacterSkill(characterSpace)}><span><Sparkles size={24} /></span><small>SKILL</small><strong>{characterSkillCount}</strong><p>{characterSpace === "linzhi" ? "被戳穿时先反问" : characterSpace === "chenyan" ? "以行动代替道歉" : "查看行为规则"}</p><ArrowUpRight size={16} /></button>
        </div>
      </div>}
      {mode === "ledger" && <div className="ledger-layout">
        <aside className="memory-list panel-border-right"><div className="memory-list-top"><label className="search-box"><Search size={15} /><input type="search" aria-label="搜索记忆" placeholder="搜索记忆" /></label><div className="filter-row">{(["all", "canon", "candidate", "temporary"] as const).map((id) => <button key={id} className={filter === id ? "active" : ""} aria-pressed={filter === id} onClick={() => setFilter(id)}>{id === "all" ? "全部" : statusMeta[id].label}</button>)}</div></div><div className="memory-items">{filteredMemories.map((memory) => <button key={memory.id} className={selectedMemoryId === memory.id ? "active" : ""} aria-pressed={selectedMemoryId === memory.id} onClick={() => setSelectedMemoryId(memory.id)}><div><StatusPill status={memory.status} />{memory.locked && <Lock size={12} />}</div><strong>{memory.title}</strong><p>{memory.summary}</p><small>{memory.timeline}</small></button>)}</div></aside>
        <section className="memory-editor">
          <div className="editor-title-row"><div><StatusPill status={draft.status} /><input className="title-input" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} aria-label="记忆标题" /><p>{draft.source}</p></div><button className="icon-button" aria-label="更多记忆操作"><MoreHorizontal size={18} /></button></div>
          <div className="editor-grid">
            <label className="field full"><span>客观事实描述</span><textarea rows={3} value={draft.summary} onChange={(event) => setDraft({ ...draft, summary: event.target.value })} /></label>
            <label className="field"><span>状态</span><select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as MemoryStatus })}><option value="canon">正典</option><option value="candidate">待确认</option><option value="temporary">临时</option><option value="archived">废弃</option></select></label>
            <label className="field"><span>类型</span><select value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })}><option>关系记忆</option><option>共同经历</option><option>角色记忆</option><option>世界事实</option><option>秘密</option><option>剧情种子</option></select></label>
            <label className="field"><span>所属时间线</span><input value={draft.timeline} onChange={(event) => setDraft({ ...draft, timeline: event.target.value })} /></label>
            <label className="field"><span>地点</span><input value={draft.place} onChange={(event) => setDraft({ ...draft, place: event.target.value })} /></label>
          </div>
          <section className="perspective-editor"><div className="perspective-head"><div><h3>认知矩阵</h3><p>编辑每个人知道多少、又如何理解同一件事。</p></div><span><Eye size={14} />正在预览：{lensMeta[lens].label}</span></div><div className="perspective-grid">{(Object.keys(lensMeta) as Lens[]).map((id) => <label key={id} className={lens === id ? "active" : ""}><span><b>{id === "omniscient" ? "客观事实" : lensMeta[id].short}</b><small>{id === "reader" ? "揭示进度" : id === "omniscient" ? "作者锁定" : "角色认知"}</small></span><textarea rows={3} value={draft.perspectives[id]} onChange={(event) => setDraft({ ...draft, perspectives: { ...draft.perspectives, [id]: event.target.value } })} /></label>)}</div></section>
          <div className="memory-editor-foot"><button className="agent-edit-button"><Sparkles size={16} />对编剧说：帮我调整这条记忆</button><div><button onClick={() => saveMemory()}><Check size={16} />保存修改</button>{draft.status !== "canon" && <button className="primary-button" onClick={() => saveMemory("canon")}><BookMarked size={16} />收录为正典</button>}</div></div>
        </section>
      </div>}
    </div>
  );
}

function SkillEditor({ draft, setDraft, close, save, rehearsal, setRehearsal }: { draft: SkillRecord; setDraft: (draft: SkillRecord) => void; close: () => void; save: () => void; rehearsal: string; setRehearsal: (text: string) => void }) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [close]);

  return <div className="modal-layer" role="dialog" aria-modal="true" aria-labelledby="skill-editor-title"><button className="modal-scrim" onClick={close} aria-label="关闭编辑器" /><aside className="drawer"><header><div><span className="version-label">Skill 规则</span><h2 id="skill-editor-title">编辑行为 Skill</h2></div><button className="icon-button" onClick={close} aria-label="关闭" autoFocus><X size={19} /></button></header><div className="drawer-body"><label className="field"><span>Skill 名称</span><input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label><label className="field"><span>这个 Skill 的作用</span><textarea rows={3} value={draft.purpose} onChange={(event) => setDraft({ ...draft, purpose: event.target.value })} /></label><label className="field"><span>触发条件</span><textarea rows={3} value={draft.trigger} onChange={(event) => setDraft({ ...draft, trigger: event.target.value })} /></label><label className="field"><span>行为规则</span><textarea rows={4} value={draft.rule} onChange={(event) => setDraft({ ...draft, rule: event.target.value })} /></label><label className="field"><span>禁止事项</span><textarea rows={3} value={draft.taboo} onChange={(event) => setDraft({ ...draft, taboo: event.target.value })} /></label><div className="field-pair"><label className="field"><span>优先级</span><select value={draft.priority} onChange={(event) => setDraft({ ...draft, priority: event.target.value as SkillRecord["priority"] })}><option>高</option><option>中</option><option>低</option></select></label><label className="toggle-field"><span><strong>启用 Skill</strong><small>停用后不会注入角色对话</small></span><button className={`switch ${draft.enabled ? "is-on" : ""}`} role="switch" aria-label="启用 Skill" aria-checked={draft.enabled} onClick={() => setDraft({ ...draft, enabled: !draft.enabled })}><i /></button></label></div><div className="drawer-rehearsal"><div><Play size={16} /><strong>保存前试演</strong></div><p>场景：对方问“你是不是已经原谅他了？”</p>{rehearsal && <blockquote>{rehearsal}</blockquote>}<button onClick={() => setRehearsal(draft.owner === "linzhi" ? "“谁说原谅了？……不过那杯桂花乌龙还行。”" : "“还没。先喝，凉了不好。”")}>生成一句试演台词</button></div></div><footer><button onClick={close}>取消</button><button className="primary-button" onClick={save}><Check size={16} />保存为新版本</button></footer></aside></div>;
}

function WorldView({ notify }: { notify: (message: string) => void }) {
  return <div className="world-page"><div className="world-hero paper-grid"><div className="world-hero-copy"><span className="section-kicker">作品世界设定</span><h1>雾港</h1><p>一座终年多雾的北方海港。潮汐、电台与没有寄出的信，是这部故事反复出现的声音。</p><div className="world-stats"><span><b>18</b>世界事实</span><span><b>4</b>地点</span><span><b>3</b>时间线</span></div></div><figure className="world-still"><Image src="/stills/fog-lighthouse.jpg" alt="雾中的北岬灯塔与一封没有署名的信" width={400} height={900} unoptimized /><figcaption>北岬灯塔 / 正文线关键地点</figcaption></figure></div><div className="world-columns"><section><div className="content-head"><div><h2>世界事实</h2><p>所有角色共享、但不一定都已知的客观规则。</p></div><button onClick={() => notify("已新建一条世界事实草稿")}><Plus size={15} />新增</button></div><div className="fact-list"><div><span>01</span><p><strong>每年八月，雾港会连续七天没有轮渡。</strong><small>地理规则 / 所有人可知</small></p><Lock size={14} /></div><div><span>02</span><p><strong>北岬灯塔的旧线路可以从港务室切断。</strong><small>剧情秘密 / 仅作者可知</small></p><Eye size={14} /></div><div><span>03</span><p><strong>雾港电台凌晨一点保留匿名来信栏目。</strong><small>公共事实 / 读者已知</small></p><Check size={14} /></div></div></section><aside><h3>时间线</h3><div className="timeline-list"><button className="active"><GitBranch size={16} /><span><strong>正文线</strong><small>第十二章后 / 当前</small></span><Check size={15} /></button><button><GitBranch size={16} /><span><strong>午夜电台</strong><small>从第十一章分叉</small></span></button><button><Archive size={16} /><span><strong>灯塔没有停电</strong><small>实验分支 / 已归档</small></span></button></div></aside></div></div>;
}
