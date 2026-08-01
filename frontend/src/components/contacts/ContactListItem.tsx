import { IoCloseOutline } from "react-icons/io5";
import { useContactsStore } from "../../store/useContactStore";
import type { Contact } from "../../types/contacts";
import Avatar from "./Avatar";

type ContactListItemProps = {
  contact: Contact;
};

export default function ContactListItem({ contact }: ContactListItemProps) {
  const removeContact = useContactsStore((state) => state.removeContact);

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-base-200">
      <Avatar userId={contact.userId} presence={contact.presence} />
      <span className="flex-1 truncate font-medium">{contact.username}</span>
      <button
        className="btn btn-ghost btn-circle btn-sm"
        aria-label={`Remove ${contact.username}`}
        onClick={() => removeContact(contact.userId)}
      >
        <IoCloseOutline className="w-5 h-5" />
      </button>
    </div>
  );
}
