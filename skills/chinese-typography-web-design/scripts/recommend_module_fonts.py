#!/usr/bin/env python3
"""Return independent Chinese font candidates for individual web modules.

This is a discovery helper, not an automatic font-stack generator. It never
commits a family, binds candidates across modules, or emits a download list.
For expressive marketing/editorial pages it deliberately places multiple
non-neutral categories across Hero and non-Hero shortlists. Explicit requests
for 花体、手写、行草 or 书法 use a stricter script-floral route: a poster sans,
pixel face, or playful display face cannot satisfy that request by itself.
Every finalist must still be rendered with real project copy before selection.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Iterable

from build_font_specimen import parse_catalog


ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "references" / "font-catalog.yaml"

DEFAULT_MODULES = (
    "brand_mark",
    "hero_display",
    "section_heading",
    "body_longform",
    "nav_ui",
    "cta",
    "caption_metadata",
)

EXPRESSIVE_MODULES = {"brand_mark", "hero_display", "section_heading", "editorial_quote", "poster_badge"}
EXPRESSIVE_ACCENT_MODULES = EXPRESSIVE_MODULES | {"nav_ui", "cta", "data_price", "caption_metadata"}
SIGNATURE_MODULES = {"brand_mark", "hero_display", "editorial_quote"}
DISPLAY_SIGNATURE_CATEGORIES = {"calligraphic", "handwritten", "rounded-playful", "impact-display", "pixel-mono"}
SCRIPT_CATEGORIES = {"calligraphic", "handwritten"}
STRICT_READABILITY_MODULES = {"body_longform", "code_terminal", "form_control"}
AUTO_EXPRESSIVE_PAGE_TYPES = {"landing", "product", "editorial", "portfolio", "campaign", "commerce", "ecommerce"}
SCRIPT_TRIGGERS = ("花体", "手写体", "手写", "行草", "草书", "行书", "书法", "毛笔", "题字", "签名字", "签名感", "作者性", "书写感", "飘逸笔势")
EXPRESSIVE_TRIGGERS = ("不正经", "不板正", "摇滚", "时装", "实验", "活泼", "海报", "先锋", "迷幻", "视觉冲击", "电影感")
NEUTRAL_REQUEST_TRIGGERS = ("只用中性", "不要花体", "不要手写", "严肃企业系统", "政务", "医疗", "应急", "无障碍优先")
DISTRIBUTED_TRIGGERS = ("全站花体", "不只hero", "不只首页", "其他页面", "非大标题", "多处花体", "分布式", "其他部分也用花体")
RICH_SCRIPT_TRIGGERS = ("丰富使用花体", "丰富花体", "多种花体", "花体字丰富", "全页花体", "各处花体", "花体丰富")

MODULE_RULES = {
    "brand_mark": {
        "positive": ("brand", "display", "calligraph", "hand", "poster", "decorative", "标志", "题字", "品牌", "书法", "手写"),
        "negative": ("body", "fallback", "code", "archive", "正文", "代码", "档案"),
        "brief": "少字轮廓、品牌记忆和与 Logo/产品的关系",
    },
    "hero_display": {
        "positive": ("display", "poster", "campaign", "title", "calligraph", "hand", "serif", "bold", "主标题", "海报", "题字"),
        "negative": ("fallback", "rare_glyph", "body_zh", "form", "正文", "档案"),
        "brief": "远距离轮廓、断行、媒体安全区和情绪峰值",
    },
    "section_heading": {
        "positive": ("display", "editorial", "humanist", "serif", "sans", "subtitle", "calligraph", "hand", "标题", "编辑", "书法", "手写"),
        "negative": ("rare_glyph", "档案", "缺字"),
        "brief": "长页重复稳定性、章节节奏和网格关系",
    },
    "editorial_quote": {
        "positive": ("quote", "hand", "calligraph", "literary", "editorial", "poetic", "diary", "引语", "手写", "书法", "文学"),
        "negative": ("system_ui", "data", "code", "系统", "数据", "代码"),
        "brief": "作者声音、手写个性、留白和短句节奏",
    },
    "body_longform": {
        "positive": ("body", "longform", "reading", "editorial_body", "humanist", "serif", "正文", "长文", "阅读"),
        "negative": ("poster", "campaign", "cursive", "calligraph", "hand", "brush", "running", "pixel", "ultra_bold", "海报", "草书", "书法", "手写", "行书", "毛笔", "题字", "像素", "促销"),
        "brief": "连续阅读、字面、标点、行长和多断点稳定性",
    },
    "nav_ui": {
        "positive": ("ui", "system", "body_zh", "developer_ui", "friendly_ui", "display", "hand", "calligraph", "导航", "界面", "系统", "手写", "书法"),
        "negative": ("rare_glyph", "ultra_thin", "archive", "缺字", "纤细", "档案"),
        "brief": "小字号扫描、点击宽度、状态和跨设备清晰度",
    },
    "cta": {
        "positive": ("ui", "system", "body_zh", "bold", "commerce", "display", "hand", "calligraph", "行动", "界面", "商业", "手写", "书法"),
        "negative": ("thin", "rare_glyph", "longform", "纤细", "缺字", "长文"),
        "brief": "动作动词识别、按钮尺寸、字重和高对比",
    },
    "data_price": {
        "positive": ("data", "price", "commerce", "mono", "variable", "display", "hand", "数字", "价格", "数据", "等宽", "手写"),
        "negative": ("diary", "poetic", "rare_glyph", "日记", "诗意", "缺字"),
        "brief": "数字宽度、基线、tabular nums 和价格强调",
    },
    "code_terminal": {
        "positive": ("code", "terminal", "mono", "developer", "代码", "终端", "等宽", "开发者"),
        "negative": ("cursive", "calligraph", "hand", "brush", "serif", "campaign", "草书", "书法", "手写", "毛笔", "宋体", "促销"),
        "brief": "中西文比例、等宽、符号覆盖和代码扫描",
    },
    "caption_metadata": {
        "positive": ("data", "subtitle", "caption", "ui", "body", "metadata", "display", "hand", "calligraph", "图注", "数据", "界面", "手写", "书法"),
        "negative": ("ultra_bold", "rare_glyph", "极粗", "缺字"),
        "brief": "小字号、日期编号、标点和视觉退后层级",
    },
    "form_control": {
        "positive": ("ui", "system", "body_zh", "accessibility", "界面", "系统", "无障碍"),
        "negative": ("display", "poster", "cursive", "calligraph", "hand", "brush", "pixel", "海报", "草书", "书法", "手写", "毛笔", "像素"),
        "brief": "输入字符、错误状态、缩放和跨平台识别",
    },
    "poster_badge": {
        "positive": ("poster", "campaign", "display", "playful", "bold", "sticker", "海报", "活动", "贴纸", "粗"),
        "negative": ("body", "longform", "fallback", "正文", "长文"),
        "brief": "短标签轮廓、局部强调和数量克制",
    },
}

PROMPT_EXPANSIONS = (
    (("ai眼镜", "ai 眼镜", "智能眼镜", "穿戴", "光学"), ("轻盈", "科技", "几何", "时尚", "消费", "未来", "实验", "上扬", "窄长", "品牌")),
    (("科技网站", "科技产品", "未来科技", "ai产品", "ai 产品"), ("科技", "几何", "未来", "理性", "工程", "轻盈")),
    (("芯片", "算力", "模型平台", "基础设施", "实验室"), ("精密", "工程", "几何", "数据", "理性", "科技")),
    (("开发者", "api", "sdk", "终端", "代码", "开源"), ("开发者", "代码", "等宽", "工程", "技术")),
    (("赛博", "cyberpunk", "霓虹", "数字都市", "ar"), ("赛博", "像素", "科技", "潮流", "游戏", "极粗")),
    (("高端", "精品", "奢华", "珠宝", "香氛"), ("编辑", "宋体", "纤细", "文化", "留白", "品牌")),
    (("杂志", "出版", "专访", "策展", "展览"), ("编辑", "出版", "宋体", "仿宋", "文学", "长文")),
    (("建筑", "空间", "设计事务所", "工业设计"), ("窄黑", "理性", "编辑", "现代", "几何", "字幕")),
    (("生活", "疗愈", "冥想", "自然", "温暖", "亲和"), ("温润", "手写", "圆体", "人文", "生活", "阅读")),
    (("儿童", "亲子", "玩具", "可爱"), ("可爱", "圆", "童趣", "手写", "贴纸")),
    (("咖啡", "餐饮", "甜品", "烘焙", "食品"), ("复古", "招牌", "圆角", "生活", "手写")),
    (("音乐", "乐队", "电影", "诗歌", "剧场"), ("文学", "行草", "摇滚", "海报", "影像", "题字")),
    (("运动", "速度", "滑板", "赛车", "街头"), ("速度", "行书", "动作", "粗", "潮流")),
    (("传统", "国风", "非遗", "茶", "节气"), ("楷", "书法", "仿宋", "文化", "碑刻", "东方")),
    (("电商", "促销", "大促", "价格", "零售"), ("价格", "电商", "促销", "粗", "商业", "海报")),
    (("游戏", "电竞", "像素", "掌机", "街机"), ("游戏", "像素", "漫画", "动作", "极粗")),
    (("公共服务", "无障碍", "政务", "政府", "医疗", "医院"), ("中性", "清晰", "系统", "无障碍", "界面", "稳定", "跨平台")),
)

PAGE_TYPE_TERMS = {
    "landing": ("display", "campaign", "brand", "标题", "品牌"),
    "product": ("product", "ui", "display", "产品", "界面"),
    "saas": ("ui", "data", "developer", "界面", "数据"),
    "editorial": ("editorial", "longform", "literary", "编辑", "长文"),
    "commerce": ("commerce", "price", "campaign", "电商", "价格"),
    "ecommerce": ("commerce", "price", "campaign", "电商", "价格"),
    "portfolio": ("display", "editorial", "brand", "作品集", "编辑"),
    "dashboard": ("ui", "data", "system", "界面", "数据"),
    "campaign": ("campaign", "poster", "display", "活动", "海报"),
}

CONSERVATIVE_TRIGGERS = ("公共服务", "政务", "政府", "医疗", "医院", "无障碍", "保险", "应急")
BROAD_STYLE_TERMS = ("科技", "高端", "年轻", "现代", "高级", "好看", "简约", "国风")


def normalize(value: str) -> str:
    return value.lower().replace(" ", "")


def matches_any(haystack: str, terms: Iterable[str]) -> list[str]:
    compact = normalize(haystack)
    return [term for term in terms if normalize(term) in compact]


def locale_score(region: str, locale: str, module: str) -> tuple[float, str]:
    if region == "Latin":
        if module in {"data_price", "code_terminal", "caption_metadata"}:
            return 1.0, "Latin/数字辅助适用于此模块"
        return -8.0, "Latin 字体不能独自承担中文模块"
    expected = {"zh-CN": "SC", "zh-TW": "TC", "zh-HK": "HK"}[locale]
    if region == expected:
        return 4.0, f"区域字形匹配 {locale}"
    if region in {"Pan-CJK", "Multi-CJK", "SC-TC", "TC-SC"}:
        return 2.0, "多区域字体仍需实测目标字形"
    return -12.0, f"区域 {region} 与 {locale} 不匹配"


def category(entry: dict[str, object]) -> str:
    hay = " ".join([*entry["roles"], str(entry["style"])]).lower()
    checks = (
        ("calligraphic", ("calligraph", "cursive", "brush", "running", "kai", "书法", "草书", "行书", "楷", "题字")),
        ("handwritten", ("hand", "diary", "marker", "手写", "硬笔")),
        ("pixel-mono", ("pixel", "mono", "code", "像素", "等宽", "代码")),
        ("serif-editorial", ("serif", "fangsong", "sung", "宋", "仿宋", "明体")),
        ("rounded-playful", ("round", "cute", "playful", "kawaii", "圆", "可爱", "萌")),
        ("impact-display", ("poster", "campaign", "bold", "海报", "极粗", "促销")),
    )
    for label, markers in checks:
        if matches_any(hay, markers):
            return label
    return "neutral-ui"


def prompt_terms(prompt: str) -> list[str]:
    terms: list[str] = []
    for triggers, additions in PROMPT_EXPANSIONS:
        if matches_any(prompt, triggers):
            terms.extend(additions)
    # Preserve explicit descriptive words so exact catalog matches score highly.
    for token in ("手写", "花体", "书法", "圆润", "几何", "窄", "粗", "纤细", "复古", "怀旧", "编辑", "时尚", "科技", "像素", "温润", "可爱", "摇滚", "文学", "极简"):
        if token in prompt:
            terms.append(token)
    return list(dict.fromkeys(terms))


def score_entry(entry: dict[str, object], module: str, prompt: str, page_type: str, locale: str) -> tuple[float, list[str]]:
    roles = entry["roles"]
    assert isinstance(roles, list)
    # Cautions often say "do not use for UI/body". Exclude them from positive
    # semantic matching or a prohibited role would be scored as a recommendation.
    hay = " ".join([entry["id"], *entry["names"], *roles, str(entry["style"])]).lower()
    rules = MODULE_RULES[module]
    score, locale_note = locale_score(str(entry["region"]), locale, module)
    evidence = [locale_note]

    positive = matches_any(hay, rules["positive"])
    negative = matches_any(hay, rules["negative"])
    score += 3.0 * min(len(positive), 3) - 3.5 * min(len(negative), 3)
    if positive:
        evidence.append("模块角色命中：" + "、".join(positive[:4]))
    if negative:
        evidence.append("风险角色命中：" + "、".join(negative[:3]))

    direct = matches_any(hay, [prompt]) if len(prompt.strip()) <= 18 else []
    if direct:
        score += 5.0
        evidence.append("直接匹配用户描述")

    expanded_terms = prompt_terms(prompt)
    style_hits = matches_any(hay, expanded_terms)
    score += 2.25 * min(len(style_hits), 4)
    if style_hits:
        evidence.append("风格命中：" + "、".join(style_hits[:5]))
    elif expanded_terms:
        score -= 5.0
        evidence.append("未命中用户的网页风格词")

    page_hits = matches_any(hay, PAGE_TYPE_TERMS.get(page_type, ()))
    score += 1.25 * min(len(page_hits), 2)
    if page_hits:
        evidence.append("页面类型命中：" + "、".join(page_hits[:3]))

    if matches_any(prompt, CONSERVATIVE_TRIGGERS) and category(entry) != "neutral-ui":
        score -= 18.0
        evidence.append("公共/高风险语境降级非中性字形")

    license_class = str(entry["license_class"])
    if license_class == "open_source":
        score += 1.0
    elif license_class.startswith("open_source"):
        score += 0.25

    return score, evidence


def diverse_top(scored: list[dict[str, object]], limit: int) -> list[dict[str, object]]:
    selected: list[dict[str, object]] = []
    seen_categories: set[str] = set()
    for item in scored:
        cat = str(item["category"])
        if cat not in seen_categories:
            selected.append(item)
            seen_categories.add(cat)
        if len(selected) == limit:
            return selected
    for item in scored:
        if item not in selected:
            selected.append(item)
        if len(selected) == limit:
            break
    return selected


def expressive_top(scored: list[dict[str, object]], limit: int) -> list[dict[str, object]]:
    """Prefer two distinct expressive categories plus a restrained control."""
    selected: list[dict[str, object]] = []
    seen_categories: set[str] = set()
    for item in scored:
        cat = str(item["category"])
        if cat in DISPLAY_SIGNATURE_CATEGORIES and cat not in seen_categories:
            selected.append(item)
            seen_categories.add(cat)
        if len(selected) >= min(2, limit):
            break
    for item in scored:
        cat = str(item["category"])
        if item not in selected and cat not in seen_categories:
            selected.append(item)
            seen_categories.add(cat)
        if len(selected) == limit:
            return selected
    for item in scored:
        if item not in selected:
            selected.append(item)
        if len(selected) == limit:
            break
    return selected


def script_top(scored: list[dict[str, object]], limit: int) -> list[dict[str, object]]:
    """Return two real script/handwritten options plus a non-script control."""
    selected = [item for item in scored if str(item["category"]) in SCRIPT_CATEGORIES][:min(2, limit)]
    for item in scored:
        if item not in selected and str(item["category"]) not in SCRIPT_CATEGORIES:
            selected.append(item)
            break
    for item in scored:
        if item not in selected:
            selected.append(item)
        if len(selected) == limit:
            break
    return selected[:limit]


def recommend(args: argparse.Namespace) -> dict[str, object]:
    entries = parse_catalog(CATALOG)
    if args.license_scope == "open":
        entries = [entry for entry in entries if str(entry["license_class"]).startswith("open_source")]

    modules = [item.strip() for item in args.modules.split(",") if item.strip()]
    unknown = sorted(set(modules) - set(MODULE_RULES))
    if unknown:
        raise SystemExit(f"unknown modules: {', '.join(unknown)}")

    explicit_script = bool(matches_any(args.prompt, SCRIPT_TRIGGERS))
    rich_script_required = args.rich_script == "required" or (
        args.rich_script == "auto" and bool(matches_any(args.prompt, RICH_SCRIPT_TRIGGERS))
    )
    explicit_expressive = bool(matches_any(args.prompt, EXPRESSIVE_TRIGGERS))
    explicit_neutral = bool(matches_any(args.prompt, NEUTRAL_REQUEST_TRIGGERS))
    if explicit_neutral or args.expressive_mode == "off" or args.signature_intent == "restrained":
        signature_intent = "restrained"
        rich_script_required = False
    elif explicit_script or rich_script_required or args.signature_intent == "script-floral":
        signature_intent = "script-floral"
    elif args.signature_intent == "expressive-display" or args.expressive_mode == "required":
        signature_intent = "expressive-display"
    else:
        signature_intent = "expressive-display" if explicit_expressive or args.page_type in AUTO_EXPRESSIVE_PAGE_TYPES else "restrained"
    expressive = signature_intent != "restrained"
    if args.distribution_mode != "auto":
        distribution_mode = args.distribution_mode
    elif signature_intent == "restrained":
        distribution_mode = "restrained"
    elif matches_any(args.prompt, DISTRIBUTED_TRIGGERS) or args.page_type in AUTO_EXPRESSIVE_PAGE_TYPES:
        distribution_mode = "distributed"
    else:
        distribution_mode = "concentrated"
    if signature_intent == "restrained" and distribution_mode != "restrained":
        distribution_mode = "restrained"
    if rich_script_required:
        distribution_mode = "distributed"
    ambiguous = len(normalize(args.prompt)) <= 12 and bool(matches_any(args.prompt, BROAD_STYLE_TERMS))
    results: dict[str, object] = {}
    for module in modules:
        scored: list[dict[str, object]] = []
        for entry in entries:
            if module in STRICT_READABILITY_MODULES:
                semantic_hay = " ".join([*entry["roles"], str(entry["style"])]).lower()
                if not matches_any(semantic_hay, MODULE_RULES[module]["positive"]):
                    continue
            score, evidence = score_entry(entry, module, args.prompt, args.page_type, args.locale)
            if score <= -6:
                continue
            names = entry["names"]
            assert isinstance(names, list)
            scored.append({
                "font_id": entry["id"],
                "name": names[0],
                "score": round(score, 2),
                "category": category(entry),
                "region": entry["region"],
                "license_class": entry["license_class"],
                "web_character": entry["style"],
                "evidence": evidence,
                "must_verify": entry["caution"],
            })
        scored.sort(key=lambda item: (-float(item["score"]), str(item["font_id"])))
        if signature_intent == "script-floral" and (
            module in SIGNATURE_MODULES
            or (distribution_mode == "distributed" and module in EXPRESSIVE_ACCENT_MODULES)
        ):
            candidates = script_top(scored, args.top)
            candidate_policy = "至少两个书写型候选（calligraphic/handwritten）加一个非书写对照；若用于小字号或功能文字，必须按最终 CSS 尺寸完成可读性验证。"
        elif expressive and (
            module in EXPRESSIVE_MODULES
            or (distribution_mode == "distributed" and module in EXPRESSIVE_ACCENT_MODULES)
        ):
            candidates = expressive_top(scored, args.top)
            candidate_policy = "至少两个轮廓不同的表现型类别加一个可比较对照；非 Hero 模块不得仅因角色名称被自动降级为中性字体。"
        else:
            candidates = scored[:args.top]
            candidate_policy = "按模块可读性、locale、主题和许可筛选。"
        results[module] = {
            "module_brief": MODULE_RULES[module]["brief"],
            "selection_state": "uncommitted",
            "candidate_policy": candidate_policy,
            "candidates": candidates,
            "next_action": "用该模块的真实文字、背景和容器加载所有候选并截图；模型看过实际 glyph 后再提交一个字体。",
        }

    return {
        "policy": "Candidates are independent per module, then must be reconciled into one global hierarchy. This output is not a font stack, pairing, route, or download list.",
        "input": {
            "prompt": args.prompt,
            "locale": args.locale,
            "page_type": args.page_type,
            "license_scope": args.license_scope,
            "expressive_mode": args.expressive_mode,
            "requested_signature_intent": args.signature_intent,
            "requested_distribution_mode": args.distribution_mode,
            "requested_rich_script": args.rich_script,
        },
        "signature_intent": signature_intent,
        "distribution_mode": distribution_mode,
        "expressive_accent_modules": sorted(EXPRESSIVE_ACCENT_MODULES),
        "expressive_candidate_required": expressive,
        "signature_required": expressive,
        "script_signature_required": signature_intent == "script-floral",
        "rich_script_required": rich_script_required,
        "rich_script_minimums": {
            "distinct_script_families": 2,
            "non_hero_expressive_surfaces": 4,
            "semantic_module_types": 3,
            "non_hero_page_regions": 3,
        },
        "script_signature_categories": sorted(SCRIPT_CATEGORIES),
        "signature_modules": sorted(SIGNATURE_MODULES),
        "ambiguous_input": ambiguous,
        "ambiguity_action": "先补充页面艺术方向或制作三个模块标本，不要直接提交字体。" if ambiguous else None,
        "modules": results,
        "committed_font_ids": [],
        "download_command": None,
        "selection_gate": [
            "真实字体文件已加载",
            "document.fonts.check 返回 true",
            "同文案、同背景、同容器 A/B/C 截图完成",
            "移动端断行与 locale 字形通过",
            "许可证允许目标用途",
            "全局计划声明一个 signature_module 和 signature_font_id",
            "distributed 模式至少提交两个非 Hero 表现文字表面，且其中至少一个不是大标题",
            "表现型小字号/功能文字记录最终字号、手机、200% 缩放、明暗背景和 fallback 实测",
            "显式花体/手写/行草要求最终由 calligraphic 或 handwritten 字体承担，而不是海报黑体、圆体或像素字",
            "rich-script 模式必须使用至少两种书写字体，并在至少三个非 Hero 区域和三个语义模块类型中形成四个非 Hero 表现文字表面",
            "加载真实 glyph 后允许有限调整局部文案宽度、网格跨度、对齐、section padding/min-height 和明确断行；不得改动媒体主体或宏观 section 架构",
            "桌面与手机最终截图不得出现非故意单汉字行、标点孤行或窄栏阶梯式中文标题",
            "字体覆盖没有改变页面布局、媒体、section 结构或艺术方向",
        ],
    }


def parser() -> argparse.ArgumentParser:
    value = argparse.ArgumentParser(description=__doc__)
    value.add_argument("--prompt", required=True, help="original web design prompt")
    value.add_argument("--locale", choices=("zh-CN", "zh-TW", "zh-HK"), default="zh-CN")
    value.add_argument("--page-type", default="landing")
    value.add_argument("--modules", default=",".join(DEFAULT_MODULES), help="comma-separated module IDs")
    value.add_argument("--top", type=int, default=3, choices=range(2, 6))
    value.add_argument("--license-scope", choices=("open", "all"), default="open")
    value.add_argument("--expressive-mode", choices=("auto", "required", "off"), default="auto", help="require or suppress a signature display candidate policy")
    value.add_argument("--signature-intent", choices=("auto", "script-floral", "expressive-display", "restrained"), default="auto", help="distinguish literal script/handwritten intent from broader expressive display typography")
    value.add_argument("--distribution-mode", choices=("auto", "distributed", "concentrated", "restrained"), default="auto", help="spread expressive typography beyond Hero or keep it intentionally concentrated")
    value.add_argument("--rich-script", choices=("auto", "required", "off"), default="auto", help="require two script families distributed across multiple non-Hero regions")
    value.add_argument("--json-out", type=Path)
    return value


def main() -> int:
    args = parser().parse_args()
    data = recommend(args)
    output = json.dumps(data, ensure_ascii=False, indent=2) + "\n"
    if args.json_out:
        args.json_out.parent.mkdir(parents=True, exist_ok=True)
        args.json_out.write_text(output, encoding="utf-8")
    print(output, end="")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
