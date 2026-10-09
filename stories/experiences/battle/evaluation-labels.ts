export const evaluationCategories = [
  { id: "char", label: "キャラクター一致度", models: "CCIP" },
  { id: "tag", label: "タグ一致度", models: "WD14・PixAI" },
  { id: "content", label: "内容一致度", models: "DreamSim・SigLIP 2・DINOv2" },
  { id: "pose", label: "ポーズ一致度", models: "Depth・OpenPose" },
] as const;
export const evaluationModels = [
  { id: "ccip", name: "CCIP", category: "char" },
  { id: "wd14", name: "WD14 tagger v3", category: "tag" },
  { id: "pixai", name: "PixAI tagger", category: "tag" },
  { id: "dreamsim", name: "DreamSim", category: "content" },
  { id: "siglip", name: "SigLIP 2", category: "content" },
  { id: "dino", name: "DINOv2", category: "content" },
  { id: "depth", name: "Depth Anything V2", category: "pose" },
  { id: "openpose", name: "OpenPose", category: "pose" },
] as const;
