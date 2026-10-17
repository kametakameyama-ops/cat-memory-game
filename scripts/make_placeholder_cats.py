"""
試作用の仮の猫画像（SVG）20枚と、それを使う猫リスト（JSON）を作るスクリプト。
本番では The Cat API の写真に置き換わるので、ゲームの動作確認専用。

使い方（プロジェクトのフォルダで）:
    python3 scripts/make_placeholder_cats.py
"""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
IMAGE_DIR = ROOT / "images" / "placeholder"
DATA_DIR = ROOT / "data"

# 毛の色: (ベース, 柄の色)
FURS = {
    "orange": ("#f2a65a", "#d9772f"),
    "gray": ("#9aa3ad", "#6b737c"),
    "black": ("#3a3a40", "#26262b"),
    "cream": ("#f3dcb5", "#dcb98a"),
    "brown": ("#a87a55", "#6e4a2f"),
    "white": ("#fbf8f3", "#e4ddd2"),
    "silver": ("#c9ccd1", "#7c828a"),
}

# ハチワレ柄の色
HACHIWARE_COLORS = {
    "hachiware_black": "#2f2f35",
    "hachiware_gray": "#8a929b",
    "hachiware_orange": "#f2a65a",
}

BACKGROUNDS = [
    "#fde2e4", "#e2ece9", "#fff1e6", "#dfe7fd", "#f0efeb",
    "#e8dff5", "#fce1e4", "#ddedea", "#fff8dc", "#e0f2f1",
]

EYES = ["#7cb342", "#f9a825", "#4fc3f7", "#c0ca33", "#8d6e63", "#ffb300"]

# 20匹分の組み合わせ: (毛色, 柄, 目の色, 目の形)
CATS = [
    ("orange", "tabby", 1, "open"),
    ("gray", "tabby", 0, "happy"),
    ("black", "solid", 1, "open"),
    ("white", "hachiware_black", 2, "open"),
    ("cream", "pointed", 2, "open"),
    ("brown", "tabby", 0, "open"),
    ("white", "calico", 4, "happy"),
    ("silver", "tabby", 3, "open"),
    ("orange", "solid", 5, "happy"),
    ("black", "tuxedo", 1, "open"),
    ("white", "solid", 2, "open"),
    ("gray", "hachiware_gray", 5, "open"),
    ("cream", "tabby", 4, "happy"),
    ("orange", "hachiware_orange", 0, "open"),
    ("white", "calico", 1, "open"),
    ("gray", "solid", 3, "happy"),
    ("brown", "solid", 5, "open"),
    ("black", "solid", 3, "happy"),
    ("silver", "tabby", 0, "happy"),
    ("cream", "solid", 1, "open"),
]


def ears(base: str, inner: str) -> str:
    return f"""
  <path d="M110 170 L120 70 L190 130 Z" fill="{base}"/>
  <path d="M290 170 L280 70 L210 130 Z" fill="{base}"/>
  <path d="M125 150 L130 95 L172 132 Z" fill="{inner}"/>
  <path d="M275 150 L270 95 L228 132 Z" fill="{inner}"/>"""


def pattern(kind: str, base: str, mark: str) -> str:
    """頭の上に重ねる柄。頭の形でクリップされる。"""
    if kind == "tabby":
        return f"""
    <g stroke="{mark}" stroke-width="9" stroke-linecap="round" fill="none">
      <path d="M200 120 L200 165"/><path d="M175 125 L180 160"/><path d="M225 125 L220 160"/>
      <path d="M95 215 L135 222"/><path d="M98 245 L135 245"/>
      <path d="M305 215 L265 222"/><path d="M302 245 L265 245"/>
    </g>"""
    if kind.startswith("hachiware_"):
        color = HACHIWARE_COLORS[kind]
        return f"""
    <path d="M60 100 H340 V255 H232 L200 165 L168 255 H60 Z" fill="{color}"/>"""
    if kind == "calico":
        return """
    <path d="M60 110 H205 V200 C160 215 110 210 60 240 Z" fill="#f2a65a"/>
    <path d="M205 110 H340 V250 C300 215 250 205 205 200 Z" fill="#3a3a40"/>"""
    if kind == "tuxedo":
        return """
    <path d="M150 360 C160 260 185 230 200 225 C215 230 240 260 250 360 Z" fill="#fbf8f3"/>"""
    if kind == "pointed":
        return """
    <ellipse cx="200" cy="265" rx="78" ry="62" fill="#7a5a44" opacity="0.85"/>"""
    return ""


def eyes(shape: str, color: str) -> str:
    if shape == "happy":
        return """
  <g stroke="#2b2b2b" stroke-width="7" stroke-linecap="round" fill="none">
    <path d="M140 235 Q158 215 176 235"/><path d="M224 235 Q242 215 260 235"/>
  </g>"""
    return f"""
  <ellipse cx="158" cy="232" rx="20" ry="22" fill="{color}"/>
  <ellipse cx="242" cy="232" rx="20" ry="22" fill="{color}"/>
  <ellipse cx="158" cy="234" rx="7" ry="16" fill="#1f1f1f"/>
  <ellipse cx="242" cy="234" rx="7" ry="16" fill="#1f1f1f"/>
  <circle cx="165" cy="224" r="5" fill="#fff"/><circle cx="249" cy="224" r="5" fill="#fff"/>"""


def make_svg(index: int, fur: str, kind: str, eye_index: int, eye_shape: str) -> str:
    base, mark = FURS[fur]
    bg = BACKGROUNDS[index % len(BACKGROUNDS)]
    inner = "#f6b5b8" if fur != "black" else "#b77b80"
    ear_base = HACHIWARE_COLORS.get(kind, base)
    if kind == "pointed":
        ear_base = "#7a5a44"
    whisker = "#2b2b2b" if fur in ("white", "cream", "silver") else "#f4f1ea"
    nose = "#e98a93" if fur != "black" else "#9c5a62"
    clip_id = f"head{index}"
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <rect width="400" height="400" fill="{bg}"/>
  <circle cx="330" cy="70" r="26" fill="#ffffff" opacity="0.5"/>
  <circle cx="60" cy="350" r="40" fill="#ffffff" opacity="0.35"/>
  <ellipse cx="200" cy="395" rx="150" ry="60" fill="{base}"/>{ears(ear_base, inner)}
  <clipPath id="{clip_id}"><ellipse cx="200" cy="235" rx="140" ry="125"/></clipPath>
  <ellipse cx="200" cy="235" rx="140" ry="125" fill="{base}"/>
  <g clip-path="url(#{clip_id})">{pattern(kind, base, mark)}
  </g>
  <ellipse cx="200" cy="292" rx="52" ry="38" fill="#ffffff" opacity="0.28"/>{eyes(eye_shape, EYES[eye_index])}
  <path d="M188 272 H212 L200 286 Z" fill="{nose}"/>
  <path d="M200 286 Q190 302 176 296 M200 286 Q210 302 224 296" stroke="#2b2b2b" stroke-width="4" fill="none" stroke-linecap="round"/>
  <ellipse cx="128" cy="282" rx="18" ry="10" fill="#f6a5b0" opacity="0.45"/>
  <ellipse cx="272" cy="282" rx="18" ry="10" fill="#f6a5b0" opacity="0.45"/>
  <g stroke="{whisker}" stroke-width="3" stroke-linecap="round" opacity="0.8">
    <path d="M150 280 L80 268"/><path d="M150 290 L78 296"/>
    <path d="M250 280 L320 268"/><path d="M250 290 L322 296"/>
  </g>
</svg>
"""


def main() -> None:
    IMAGE_DIR.mkdir(parents=True, exist_ok=True)
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    cats = []
    for i, (fur, kind, eye_index, eye_shape) in enumerate(CATS):
        cat_id = f"placeholder-{i + 1:02d}"
        (IMAGE_DIR / f"{cat_id}.svg").write_text(
            make_svg(i, fur, kind, eye_index, eye_shape), encoding="utf-8"
        )
        cats.append({
            "id": cat_id,
            "imageUrl": f"./images/placeholder/{cat_id}.svg",
            "width": 400,
            "height": 400,
        })

    sample = {
        "version": 1,
        "date": "2026-10-17",
        "challengeNumber": 1,
        "source": "placeholder",
        "cats": cats,
    }
    for name in ("today.json", "fallback.json"):
        (DATA_DIR / name).write_text(
            json.dumps(sample, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )
    print(f"{len(cats)} 匹の仮画像と data/today.json, data/fallback.json を作りました")


if __name__ == "__main__":
    main()
