import { icon, iconButton } from "@animic/styled-system/recipes";
import type { IconButtonVariantProps, IconVariantProps } from "@animic/styled-system/recipes";
import type { ComponentProps, ReactNode } from "react";

// 線で描いたアイコン。色は置いた場所の文字色（currentColor）を受け継ぐ
const STROKE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

const ICONS = {
  // 再生（スタート）
  play: {
    viewBox: "0 0 26 28",
    body: (
      <path
        d="M3 2.5 L24 14 L3 25.5 Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
    ),
  },
  chevronRight: {
    viewBox: "0 0 12 20",
    body: <path d="M2 2 L10 10 L2 18" {...STROKE} strokeWidth="2.5" />,
  },
  chevronLeft: {
    viewBox: "0 0 12 20",
    body: <path d="M10 2 L2 10 L10 18" {...STROKE} strokeWidth="2.5" />,
  },
  // ルームに参加（枠の中へ入る矢印）
  enter: {
    viewBox: "0 0 24 24",
    body: (
      <g {...STROKE} strokeWidth="2.4">
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
        <path d="M10 17l5-5-5-5" />
        <path d="M15 12H3" />
      </g>
    ),
  },
  // 退出（枠から出る矢印）
  exit: {
    viewBox: "0 0 24 24",
    body: (
      <g {...STROKE} strokeWidth="2.5">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <path d="M16 17l5-5-5-5" />
        <path d="M21 12H9" />
      </g>
    ),
  },
  // コピー（重ねた2枚）
  copy: {
    viewBox: "0 0 24 24",
    body: (
      <g {...STROKE} strokeWidth="2.5">
        <rect x="9" y="9" width="12" height="12" rx="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </g>
    ),
  },
  // 表示名の変更（鉛筆）
  edit: {
    viewBox: "0 0 24 24",
    body: <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" {...STROKE} />,
  },
  // ログイン（人）
  user: {
    viewBox: "0 0 24 24",
    body: (
      <g {...STROKE} strokeWidth="2.4">
        <circle cx="12" cy="8.5" r="4" />
        <path d="M4.5 20.5c1.2-4 4-6 7.5-6s6.3 2 7.5 6" />
      </g>
    ),
  },
  // カルーセルの矢印（山形より太い）
  arrowLeft: {
    viewBox: "0 0 12 20",
    body: <path d="M10 2 L2 10 L10 18" {...STROKE} strokeWidth="3" />,
  },
  arrowRight: {
    viewBox: "0 0 12 20",
    body: <path d="M2 2 L10 10 L2 18" {...STROKE} strokeWidth="3" />,
  },
  chevronUp: {
    viewBox: "0 0 20 12",
    body: <path d="M2 10 L10 2 L18 10" {...STROKE} strokeWidth="2.5" />,
  },
  // 3人の人影（ルームに参加する）
  people: {
    viewBox: "0 0 34 24",
    body: (
      <g fill="currentColor">
        <circle cx="17" cy="6.5" r="5.5" />
        <path d="M7 23 c0-6 4.5-9.5 10-9.5 s10 3.5 10 9.5 Z" />
        <circle cx="6.5" cy="9" r="4" />
        <path d="M0 22 c0-4.5 2.8-7 6.5-7 c1.4 0 2.6.3 3.6 1 c-2 1.8-3.1 4.1-3.1 6 Z" />
        <circle cx="27.5" cy="9" r="4" />
        <path d="M34 22 c0-4.5-2.8-7-6.5-7 c-1.4 0-2.6.3-3.6 1 c2 1.8 3.1 4.1 3.1 6 Z" />
      </g>
    ),
  },
  // 鎖（ルームに集まる）
  link: {
    viewBox: "0 0 24 24",
    body: (
      <g {...STROKE}>
        <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
        <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
      </g>
    ),
  },
  // 画像（お題）
  image: {
    viewBox: "0 0 24 24",
    body: (
      <g {...STROKE}>
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <circle cx="9" cy="9" r="2" />
        <path d="m21 15-5-5L5 21" />
      </g>
    ),
  },
  // 文章ときらめき（プロンプトで生成）
  prompt: {
    viewBox: "0 0 24 24",
    body: (
      <g {...STROKE}>
        <path d="M4 6h10M4 12h7M4 18h5" />
        <path d="m17 10 1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1z" />
      </g>
    ),
  },
  // トロフィー（提出して勝負）
  trophy: {
    viewBox: "0 0 24 24",
    body: (
      <g {...STROKE}>
        <path d="M8 21h8M12 17v4" />
        <path d="M7 4h10v5a5 5 0 0 1-10 0z" />
        <path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4" />
      </g>
    ),
  },
  // 的（再現度）
  target: {
    viewBox: "0 0 24 24",
    body: (
      <g {...STROKE} strokeWidth="2.2">
        <path d="M12 3a9 9 0 1 0 9 9" />
        <path d="M12 8a4 4 0 1 0 4 4" />
        <path d="M12 12 21 3" />
      </g>
    ),
  },
  // ストップウォッチ（提出速度）
  stopwatch: {
    viewBox: "0 0 24 24",
    body: (
      <g {...STROKE} strokeWidth="2.2">
        <circle cx="12" cy="13" r="8" />
        <path d="M12 9v4l2.5 2.5M9 2h6" />
      </g>
    ),
  },
  // やり直し（生成回数）
  refresh: {
    viewBox: "0 0 24 24",
    body: (
      <g {...STROKE} strokeWidth="2.2">
        <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
        <path d="M3 3v5h5" />
      </g>
    ),
  },
  // 人を加える（招待する）
  userPlus: {
    viewBox: "0 0 24 24",
    body: (
      <g {...STROKE} strokeWidth="2.5">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M19 8v6M22 11h-6" />
      </g>
    ),
  },
  check: {
    viewBox: "0 0 24 24",
    body: <path d="M5 12l5 5L20 7" {...STROKE} strokeWidth="3.5" />,
  },
  // 生成する
  sparkle: {
    viewBox: "0 0 24 24",
    body: (
      <g {...STROKE} strokeWidth="2.5">
        <path d="m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
        <path d="M19 17v4M17 19h4" />
      </g>
    ),
  },
  // 王冠（WINNER）
  crown: {
    viewBox: "0 0 24 18",
    body: (
      <path
        d="M2 5l5 4 5-7 5 7 5-4-2 11H4z"
        fill="#ff2d87"
        stroke="#0b1b2b"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    ),
  },
  // ログイン連携先のロゴ
  google: {
    viewBox: "0 0 48 48",
    body: (
      <>
        <path
          fill="#FFC107"
          d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
        />
        <path
          fill="#FF3D00"
          d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
        />
        <path
          fill="#4CAF50"
          d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
        />
        <path
          fill="#1976D2"
          d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
        />
      </>
    ),
  },
  discord: {
    viewBox: "0 0 24 24",
    body: (
      <path
        fill="currentColor"
        d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"
      />
    ),
  },
  x: {
    viewBox: "0 0 24 24",
    body: (
      <path
        fill="currentColor"
        d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"
      />
    ),
  },
} satisfies Record<string, { viewBox: string; body: ReactNode }>;

export type IconName = keyof typeof ICONS;

export type IconProps = IconVariantProps & {
  name: IconName;
  /** 単独で意味を持つときの読み上げ名。なければ飾りとして読み飛ばす */
  label?: string;
};

export function Icon({ name, size, label }: IconProps) {
  const { viewBox, body } = ICONS[name];
  return (
    <svg
      className={icon({ size })}
      viewBox={viewBox}
      aria-hidden={label ? undefined : "true"}
      role={label ? "img" : undefined}
      aria-label={label}
    >
      {body}
    </svg>
  );
}

export type IconButtonProps = Omit<
  ComponentProps<"button">,
  "className" | "style" | "children" | "type"
> &
  IconButtonVariantProps & {
    /** 読み上げ用の名前（必須。アイコンだけでは意味が伝わらない） */
    label: string;
    icon: IconName;
    iconSize?: IconVariantProps["size"];
  };

// アイコンだけの丸いボタン
export function IconButton({
  label,
  icon: name,
  iconSize = "sm",
  variant,
  ...rest
}: IconButtonProps) {
  return (
    <button {...rest} type="button" className={iconButton({ variant })} aria-label={label}>
      <Icon name={name} size={iconSize} />
    </button>
  );
}
