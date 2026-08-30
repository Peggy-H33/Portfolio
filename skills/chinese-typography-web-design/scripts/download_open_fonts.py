#!/usr/bin/env python3
"""Download only explicitly committed open-source fonts and build @font-face CSS.

This intentionally skips brand_free, proprietary_free, and brand_reference entries.
It uses official GitHub repositories or Google Fonts raw files and stores a report
with the resolved source URL for every downloaded file. V6 deliberately has no
style preset or bulk mode: pass the de-duplicated IDs selected per page module.
"""
from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import json
import re
import shutil
import subprocess
import tarfile
import tempfile
import zipfile
from pathlib import Path
from urllib.parse import quote

from build_font_specimen import parse_catalog


ROOT = Path(__file__).resolve().parents[1]
FONT_EXTENSIONS = (".woff2", ".woff", ".otf", ".ttf")
ARCHIVE_EXTENSIONS = (".zip", ".tar.gz", ".tgz")
# Google Fonts paths are stable and avoid querying the enormous google/fonts tree.
DIRECT_URLS = {
    "source-han-sans-sc": "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/notosanssc/NotoSansSC%5Bwght%5D.ttf",
    "source-han-serif-sc": "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/notoserifsc/NotoSerifSC%5Bwght%5D.ttf",
    "noto-sans-cjk-sc": "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/notosanssc/NotoSansSC%5Bwght%5D.ttf",
    "ma-shan-zheng": "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/mashanzheng/MaShanZheng-Regular.ttf",
    "zcool-kuaile": "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/zcoolkuaile/ZCOOLKuaiLe-Regular.ttf",
    "zcool-xiaowei": "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/zcoolxiaowei/ZCOOLXiaoWei-Regular.ttf",
    "zcool-qingke-huangyou": "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/zcoolqingkehuangyou/ZCOOLQingKeHuangYou-Regular.ttf",
    "long-cang": "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/longcang/LongCang-Regular.ttf",
    "zhi-mang-xing": "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/zhimangxing/ZhiMangXing-Regular.ttf",
    "liu-jian-mao-cao": "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/liujianmaocao/LiuJianMaoCao-Regular.ttf",
}
SHARED_FROM = {"noto-sans-cjk-sc": "source-han-sans-sc"}

PREFERRED = {
    "lxgw-wenkai": ["regular", "wenkai"],
    "lxgw-wenkai-tc": ["regular", "tc"],
    "lxgw-wenkai-gb": ["regular", "gb"],
    "lxgw-wenkai-lite": ["regular", "lite"],
    "lxgw-zhenkai-gb": ["regular", "gb"],
    "lxgw-marker-gothic": ["regular", "marker"],
    "lxgw-neo-xihei": ["regular", "xihei"],
    "lxgw-neo-zhisong": ["regular", "zhisong"],
    "xiaolai": ["regular", "xiaolai"],
    "yozai": ["regular", "yozai"],
    "black-sugar-plum-candy": ["regular"],
    "sarasa-gothic": ["sc", "regular"],
    "maple-mono-cn": ["cn", "regular"],
    "lxgw-bright-code": ["regular", "bright"],
    "ark-pixel": ["zh_cn", "regular"],
    "fusion-pixel": ["zh_hans", "regular"],
    "zhuque-fangsong": ["regular"],
    "plangothic": ["regular"],
    "chiron-hei-hk": ["regular", "hei"],
    "chiron-sung-hk": ["regular", "sung"],
    "douyin-sans": ["douyin", "sans"],
    "huninn": ["huninn", "regular"],
    "chenyu-luoyan-thin": ["chenyuluoyan", "thin"],
    "maoken-assorted-sans": ["assorted", "regular"],
    "maoken-yingbi-kaishu": ["yingbi", "0.20"],
    "kingnam-bobohei": ["bobohei", "regular"],
    "kingnam-yuanmo": ["yuanmo", "regular"],
    "longzhuti": ["longzhuti", "regular"],
    "slide-fu": ["slidefu", "regular"],
    "slide-youran": ["slideyouran", "regular"],
    "slide-chunfeng": ["slidechunfeng", "regular"],
    "slide-xiaxing": ["slidexiaxing", "regular"],
    "slide-qiuhong": ["slideqiuhong", "regular"],
    "chill-round": ["chillroundf", "regular"],
    "chill-g-sans": ["chillgsans"],
    "unbounded-sans": ["unbounded", "regular"],
    "cubic-11": ["cubic", "11"],
    "genwan-serif": ["genwan", "tw", "regular"],
    "glow-sans": ["glowsanssc", "normal", "regular"],
    "maoken-fengyasong": ["fengyasong", "regular"],
}
for number in range(1, 10):
    PREFERRED[f"jason-handwriting-{number}"] = [f"jasonhandwriting{number}.ttf"]


def curl_json(url: str, cache: Path | None = None) -> dict:
    if cache and cache.is_file():
        cached = json.loads(cache.read_text(encoding="utf-8"))
        if "message" not in cached:
            return cached
        cache.unlink()
    result = subprocess.run(
        ["curl", "-sS", "--http1.1", "-L", "--retry", "3", "--retry-all-errors", url],
        check=True,
        capture_output=True,
        text=True,
    )
    data = json.loads(result.stdout)
    if "message" in data:
        raise RuntimeError(f"GitHub API: {data['message']}")
    if cache:
        cache.parent.mkdir(parents=True, exist_ok=True)
        cache.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
    return data


def download(url: str, destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    part = destination.with_suffix(destination.suffix + ".part")
    base_command = [
        "curl", "--http1.1", "-fL", "--retry", "5", "--retry-all-errors",
        "--connect-timeout", "20", "--speed-limit", "1024", "--speed-time", "30",
        "--max-time", "1800", "--silent", "--show-error",
    ]
    resume_command = [*base_command, "-C", "-", "-o", str(part), url]
    result = subprocess.run(resume_command, capture_output=True, text=True)
    if result.returncode and part.exists():
        print(f"  resume failed for {destination.name}; retrying a clean transfer", flush=True)
        part.unlink()
        result = subprocess.run([*base_command, "-o", str(part), url], capture_output=True, text=True)
    if result.returncode:
        raise RuntimeError(result.stderr.strip() or f"curl exited with {result.returncode}")
    part.replace(destination)


def github_repo(source: str) -> tuple[str, str] | None:
    match = re.match(r"https://github\.com/([^/]+)/([^/#]+)", source)
    return (match.group(1), match.group(2)) if match else None


def github_cdn_url(owner: str, repo: str, branch: str, path: str) -> str:
    return f"https://cdn.jsdelivr.net/gh/{owner}/{repo}@{quote(branch, safe='')}/{quote(path)}"


def score_path(path: str, font_id: str) -> int:
    lower = path.lower()
    score = 0
    for token in PREFERRED.get(font_id, []):
        score += 80 if token.lower() in lower else -12
    if "/fonts/" in f"/{lower}" or "/font/" in f"/{lower}":
        score += 20
    if "regular" in lower:
        score += 12
    if lower.endswith(".woff2"):
        score += 12
    elif lower.endswith(".otf"):
        score += 8
    elif lower.endswith(".ttf"):
        score += 6
    if any(part in lower for part in ("preview", "temporary", "test", "documentation", "source/", "sources/")):
        score -= 40
    if "mono" in lower and "mono" not in font_id and font_id != "maple-mono-cn":
        score -= 20
    return score


def best_path(paths: list[str], font_id: str) -> str | None:
    font_paths = []
    for path in paths:
        lower = path.lower()
        if not lower.endswith(FONT_EXTENSIONS):
            continue
        if "japanese" in lower or re.search(r"(?:^|[/_.-])jp(?:[/_.-]|$)", lower):
            continue
        font_paths.append(path)
    return max(font_paths, key=lambda path: score_path(path, font_id), default=None)


def tree_for(owner: str, repo: str, cache_dir: Path) -> tuple[dict, str]:
    cache = cache_dir / f"{owner}__{repo}__tree.json"
    data = curl_json(f"https://api.github.com/repos/{owner}/{repo}/git/trees/HEAD?recursive=1", cache)
    if "tree" not in data:
        raise RuntimeError(f"GitHub tree error for {owner}/{repo}: {data.get('message', 'unknown error')}")
    branch = "main"
    try:
        remote = subprocess.run(
            ["git", "ls-remote", "--symref", f"https://github.com/{owner}/{repo}.git", "HEAD"],
            check=True,
            capture_output=True,
            text=True,
            timeout=60,
        ).stdout
        match = re.search(r"ref:\s+refs/heads/([^\s]+)\s+HEAD", remote)
        if match:
            branch = match.group(1)
    except Exception:
        pass
    return data, branch


def release_for(owner: str, repo: str, cache_dir: Path) -> dict:
    cache = cache_dir / f"{owner}__{repo}__release.json"
    return curl_json(f"https://api.github.com/repos/{owner}/{repo}/releases/latest", cache)


def extract_archive(archive: Path, font_id: str, destination_base: Path) -> Path:
    with tempfile.TemporaryDirectory(prefix="font-unpack-") as temp_name:
        temp = Path(temp_name)
        if zipfile.is_zipfile(archive):
            with zipfile.ZipFile(archive) as bundle:
                for member in bundle.infolist():
                    resolved = (temp / member.filename).resolve()
                    if temp.resolve() not in resolved.parents and resolved != temp.resolve():
                        raise RuntimeError(f"unsafe archive member: {member.filename}")
                bundle.extractall(temp)
        elif tarfile.is_tarfile(archive):
            with tarfile.open(archive) as bundle:
                for member in bundle.getmembers():
                    resolved = (temp / member.name).resolve()
                    if temp.resolve() not in resolved.parents and resolved != temp.resolve():
                        raise RuntimeError(f"unsafe archive member: {member.name}")
                bundle.extractall(temp)
        else:
            raise RuntimeError(f"unsupported archive: {archive.name}")
        files = [path for path in temp.rglob("*") if path.is_file() and path.suffix.lower() in FONT_EXTENSIONS]
        selected_name = best_path([str(path.relative_to(temp)) for path in files], font_id)
        if not selected_name:
            raise RuntimeError(f"no browser font found inside {archive.name}")
        selected = temp / selected_name
        output = destination_base.with_suffix(selected.suffix.lower())
        shutil.copy2(selected, output)
        return output


def download_license(owner: str, repo: str, tree: dict, branch: str, licenses: Path) -> None:
    output = licenses / f"{owner}__{repo}.txt"
    if output.is_file():
        return
    paths = [item["path"] for item in tree.get("tree", []) if item.get("type") == "blob"]
    candidates = [
        path for path in paths
        if Path(path).name.lower() in {"ofl.txt", "license-ofl.txt", "license.txt", "license", "copying.txt"}
    ]
    if not candidates:
        return
    selected = min(candidates, key=lambda path: ("ofl" not in path.lower(), len(path)))
    url = github_cdn_url(owner, repo, branch, selected)
    try:
        download(url, output)
    except Exception:
        output.unlink(missing_ok=True)


def resolve_and_download(entry: dict[str, object], fonts: Path, cache: Path, licenses: Path) -> dict[str, object]:
    font_id = str(entry["id"])
    family = str(entry["family"])
    base = fonts / font_id
    existing = next((base.with_suffix(ext) for ext in FONT_EXTENSIONS if base.with_suffix(ext).is_file()), None)
    if existing:
        return {"id": font_id, "family": family, "status": "existing", "file": existing.name, "bytes": existing.stat().st_size}

    shared_id = SHARED_FROM.get(font_id)
    if shared_id:
        shared = next((fonts / f"{shared_id}{ext}" for ext in FONT_EXTENSIONS if (fonts / f"{shared_id}{ext}").is_file()), None)
        if shared:
            output = base.with_suffix(shared.suffix)
            try:
                output.hardlink_to(shared)
            except OSError:
                shutil.copy2(shared, output)
            return {"id": font_id, "family": family, "status": "shared", "file": output.name, "bytes": output.stat().st_size, "shared_from": shared_id}

    direct = DIRECT_URLS.get(font_id)
    if direct:
        suffix = Path(direct.split("?", 1)[0]).suffix.lower() or ".ttf"
        output = base.with_suffix(suffix)
        download(direct, output)
        return {"id": font_id, "family": family, "status": "downloaded", "file": output.name, "bytes": output.stat().st_size, "url": direct}

    parsed = github_repo(str(entry["source"]))
    if not parsed:
        raise RuntimeError("source is not a GitHub repository")
    owner, repo = parsed
    tree, branch = tree_for(owner, repo, cache)
    paths = [item["path"] for item in tree.get("tree", []) if item.get("type") == "blob"]
    selected = best_path(paths, font_id)
    download_license(owner, repo, tree, branch, licenses)
    if selected:
        suffix = Path(selected).suffix.lower()
        output = base.with_suffix(suffix)
        url = github_cdn_url(owner, repo, branch, selected)
        download(url, output)
        return {"id": font_id, "family": family, "status": "downloaded", "file": output.name, "bytes": output.stat().st_size, "url": url}

    release = release_for(owner, repo, cache)
    assets = release.get("assets", [])
    names = [asset["name"] for asset in assets if asset["name"].lower().endswith(FONT_EXTENSIONS + ARCHIVE_EXTENSIONS)]
    selected_asset_name = max(names, key=lambda name: score_path(name, font_id), default=None)
    if not selected_asset_name:
        raise RuntimeError("repository and latest release contain no downloadable font")
    asset = next(item for item in assets if item["name"] == selected_asset_name)
    archive_or_font = fonts / (font_id + "-bundle" + (".tar.gz" if selected_asset_name.lower().endswith((".tar.gz", ".tgz")) else Path(selected_asset_name).suffix.lower()))
    download(asset["browser_download_url"], archive_or_font)
    if selected_asset_name.lower().endswith(FONT_EXTENSIONS):
        output = base.with_suffix(Path(selected_asset_name).suffix.lower())
        archive_or_font.replace(output)
    else:
        output = extract_archive(archive_or_font, font_id, base)
        archive_or_font.unlink(missing_ok=True)
    return {"id": font_id, "family": family, "status": "downloaded", "file": output.name, "bytes": output.stat().st_size, "url": asset["browser_download_url"]}


def css_format(filename: str) -> str:
    suffix = Path(filename).suffix.lower()
    return {".woff2": "woff2", ".woff": "woff", ".otf": "opentype", ".ttf": "truetype"}[suffix]


def write_css(results: list[dict[str, object]], target: Path) -> None:
    blocks = ["/* Generated by download_open_fonts.py. Do not edit manually. */"]
    for result in results:
        if result.get("status") not in {"downloaded", "existing", "shared"}:
            continue
        family = str(result["family"]).replace("'", "\\'")
        filename = str(result["file"])
        blocks.append(
            "\n".join(
                [
                    "@font-face {",
                    f"  font-family: '{family}';",
                    f"  src: url('./{filename}') format('{css_format(filename)}');",
                    "  font-style: normal;",
                    "  font-weight: 400;",
                    "  font-display: swap;",
                    "}",
                ]
            )
        )
    (target / "local-fonts.css").write_text("\n\n".join(blocks) + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("target", type=Path, help="site root containing index.html")
    parser.add_argument("--catalog", type=Path, default=ROOT / "references/font-catalog.yaml")
    parser.add_argument(
        "--fonts",
        metavar="ID[,ID...]",
        required=True,
        help="download exactly these comma-separated open-source font IDs committed by the module plan",
    )
    parser.add_argument("--workers", type=int, default=2)
    args = parser.parse_args()

    target = args.target.resolve()
    fonts = target / "fonts"
    cache = target / ".download-cache"
    licenses = fonts / "licenses"
    fonts.mkdir(parents=True, exist_ok=True)
    licenses.mkdir(parents=True, exist_ok=True)

    catalog = parse_catalog(args.catalog.resolve())
    requested_ids = {item.strip() for item in args.fonts.split(",") if item.strip()}
    if not requested_ids:
        parser.error("--fonts must contain at least one committed font ID")
    known_ids = {str(entry["id"]) for entry in catalog}
    unknown = requested_ids - known_ids
    if unknown:
        parser.error(f"unknown font IDs: {', '.join(sorted(unknown))}")
    restricted = {
        str(entry["id"])
        for entry in catalog
        if not str(entry["license_class"]).startswith("open_source")
    }
    restricted_request = requested_ids & restricted
    if restricted_request:
        parser.error(
            "these fonts are not automatically redistributable; obtain their official packages and verify the license: "
            + ", ".join(sorted(restricted_request))
        )
    candidates = []
    skipped = []
    for entry in catalog:
        license_class = str(entry["license_class"])
        if not license_class.startswith("open_source"):
            skipped.append({"id": entry["id"], "status": "manual-license", "license_class": license_class})
            continue
        if entry["id"] not in requested_ids:
            skipped.append({"id": entry["id"], "status": "not-requested"})
            continue
        candidates.append(entry)

    groups: dict[str, list[dict[str, object]]] = {}
    for entry in candidates:
        direct = DIRECT_URLS.get(str(entry["id"]))
        repo = github_repo(str(entry["source"]))
        key = f"direct:{direct}" if direct else f"repo:{repo}" if repo else f"id:{entry['id']}"
        groups.setdefault(key, []).append(entry)

    def process_group(entries: list[dict[str, object]]) -> list[dict[str, object]]:
        group_results: list[dict[str, object]] = []
        for entry in entries:
            print(f"[{entry['id']}]", flush=True)
            try:
                group_results.append(resolve_and_download(entry, fonts, cache, licenses))
            except Exception as exc:
                print(f"  FAILED {entry['id']}: {exc}", flush=True)
                group_results.append({"id": entry["id"], "family": entry["family"], "status": "failed", "error": str(exc)})
        return group_results

    results: list[dict[str, object]] = []
    with ThreadPoolExecutor(max_workers=max(1, args.workers)) as pool:
        futures = [pool.submit(process_group, entries) for entries in groups.values()]
        for future in as_completed(futures):
            results.extend(future.result())
    order = {str(entry["id"]): index for index, entry in enumerate(catalog)}
    results.sort(key=lambda result: order.get(str(result["id"]), 10**9))

    write_css(results, fonts)
    report = {
        "selection_mode": "explicit-module-commit",
        "requested_font_ids": sorted(requested_ids),
        "catalog_count": len(catalog),
        "selected_count": len(candidates),
        "loaded_count": sum(result.get("status") in {"downloaded", "existing", "shared"} for result in results),
        "failed_count": sum(result.get("status") == "failed" for result in results),
        "results": results,
        "skipped": skipped,
    }
    (target / "font-download-report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({key: report[key] for key in ("catalog_count", "selected_count", "loaded_count", "failed_count")}, ensure_ascii=False))
    return 1 if report["failed_count"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
