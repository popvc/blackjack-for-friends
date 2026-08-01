const PALETTE = [
  { bg: "bg-primary", content: "text-primary-content" },
  { bg: "bg-secondary", content: "text-secondary-content" },
  { bg: "bg-accent", content: "text-accent-content" },
  { bg: "bg-info", content: "text-info-content" },
  { bg: "bg-success", content: "text-success-content" },
  { bg: "bg-warning", content: "text-warning-content" },
  { bg: "bg-error", content: "text-error-content" },
  { bg: "bg-neutral", content: "text-neutral-content" },
];

export function getAvatarColors(userId: string) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = (hash * 31 + userId.charCodeAt(i)) | 0;

  return PALETTE[Math.abs(hash) % PALETTE.length];
}
