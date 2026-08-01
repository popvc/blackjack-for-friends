import { IoPersonCircle } from "react-icons/io5";
import type { Presence } from "../../types/contacts";
import { getAvatarColors } from "../../lib/avatarColor";

type AvatarProps = {
  userId: string;
  presence?: Presence;
  sizeClass?: string;
};

export default function Avatar({ userId, presence, sizeClass = "w-10" }: AvatarProps) {
  const { bg, content } = getAvatarColors(userId);
  const presenceClass = presence === "online" ? "avatar-online" : presence === "offline" ? "avatar-offline" : "";

  return (
    <div className={`avatar avatar-placeholder ${presenceClass}`}>
      <div className={`${sizeClass} rounded-full ${bg} ${content}`}>
        <IoPersonCircle className="w-full h-full" />
      </div>
    </div>
  );
}
