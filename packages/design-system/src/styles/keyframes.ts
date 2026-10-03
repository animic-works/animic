import { defineKeyframes } from "@pandacss/dev";

// 画面全体で共有する動きの素材。使う場所と速さ・緩急の組み合わせはレシピとanimation.tsが決める
export const keyframes = defineKeyframes({
  "fade-in": { from: { opacity: 0 }, to: { opacity: 1 } },
  "fade-out": { from: { opacity: 1 }, to: { opacity: 0 } },
  "scale-in": {
    from: { opacity: 0, transform: "scale(0.96)" },
    to: { opacity: 1, transform: "scale(1)" },
  },
  "slide-up": {
    from: { opacity: 0, transform: "translateY(10px)" },
    to: { opacity: 1, transform: "translateY(0)" },
  },
  pop: { from: { opacity: 0, transform: "scale(0.4)" }, to: { opacity: 1, transform: "scale(1)" } },
  spin: { to: { transform: "rotate(360deg)" } },
  // 画面遷移: 3色の帯が斜めに塗り重なり、次の画面で抜けていく
  "band-in": { to: { transform: "translateX(0) skewX(-18deg)" } },
  "band-out": { to: { transform: "translateX(120%) skewX(-18deg)" } },
  "logo-pop": {
    "0%": { scale: "0", rotate: "-30deg" },
    "100%": { scale: "1", rotate: "0deg" },
  },
  "logo-out": { to: { scale: "0.4", opacity: 0, rotate: "20deg" } },
  // 遷移先: カードが下から弾んで現れ、中身が順に出てくる
  "card-rise": { from: { opacity: 0, transform: "translateY(3rem) rotate(-3deg) scale(0.94)" } },
  "item-rise": { from: { opacity: 0, transform: "translateY(0.8rem)" } },
  // 押したボタンを一瞬つぶす
  press: { "40%": { transform: "scale(0.94)" } },
  // ルーム作成の演出: 説明が浮かび、コードの文字が確定する
  "room-in": {
    from: { opacity: 0, transform: "translateY(1.5rem)" },
    to: { opacity: 1, transform: "none" },
  },
  "room-out": { to: { opacity: 0, transform: "scale(0.9)" } },
  "char-set": { "0%": { scale: "1.3", background: "#fddb13" }, "100%": { scale: "1" } },
  "char-pop": { from: { opacity: 0, scale: "0.4" } },
  // トップの「SCROLL」の線が流れる
  "hint-line": { from: { backgroundPosition: "0 100%" }, to: { backgroundPosition: "0 -100%" } },
  // 入力中のマスの点滅
  caret: { "50%": { opacity: 0 } },
  // 空いている枠の「+」が呼吸する
  waiting: { "50%": { transform: "scale(0.88)" } },
  // 参加者が入ってきたときに弾む
  joined: { from: { transform: "scale(0.85)", opacity: 0 } },
  // 残り時間が少ないときに数字が脈打つ
  beat: { "50%": { transform: "scale(1.08)" } },
  // 生成中の画像のきらめき
  shimmer: { to: { backgroundPosition: "-250% 0, 0 0" } },
  // 生成した画像が弾んで現れる
  "shot-in": { from: { transform: "scale(0.8)", opacity: 0 } },
  // ログインの手順の切り替え: 今のカードが左へ抜け、次のカードが右から入る
  "step-out": { to: { opacity: 0, transform: "translateX(-2.5rem) rotate(-2deg)" } },
  "step-in": { from: { opacity: 0, transform: "translateX(2.5rem) rotate(2deg)" } },
  "step-out-back": { to: { opacity: 0, transform: "translateX(2.5rem) rotate(2deg)" } },
  "step-in-back": { from: { opacity: 0, transform: "translateX(-2.5rem) rotate(-2deg)" } },
  // カウントダウンの数字が大きく出て収まる
  "count-pop": {
    from: { transform: "scale(1.6)", opacity: 0 },
    "30%": { transform: "scale(1)", opacity: 1 },
  },
  // トップのキャラクター: 右下から入ってきて、ゆっくり浮き、きらめきが瞬く
  "hero-in": {
    from: { opacity: 0, transform: "var(--base) var(--tilt) translate(5rem, 3rem) scale(0.92)" },
    to: { opacity: 1, transform: "var(--base) var(--tilt)" },
  },
  "hero-float": { "50%": { transform: "translateY(-0.8rem)" } },
  "hero-twinkle": {
    "0%, 100%": { opacity: 0.35, transform: "scale(0.7) rotate(0deg)" },
    "50%": { opacity: 1, transform: "scale(1.15) rotate(20deg)" },
  },
  // スマホのトップ: ロゴが上から落ちてくる
  "logo-drop": { from: { opacity: 0, transform: "translateY(-1rem) scale(0.9) rotate(-3deg)" } },
  // スマホの窓: 下から出るシート
  "sheet-up": { from: { transform: "translateY(100%)" } },
  // スマホのログイン画面: キャラがゆっくり浮き、きらめきが瞬く
  "m-float": { "50%": { transform: "translateY(-8px)" } },
  "m-twinkle": { "50%": { opacity: 0.35, transform: "scale(0.7) rotate(20deg)" } },
  // スマホのログイン画面: シートの中身が下から入れ替わる
  "m-sheet-out": { to: { opacity: 0, transform: "translateY(1.5rem)" } },
  "m-sheet-in": { from: { opacity: 0, transform: "translateY(2.5rem)" } },
});
