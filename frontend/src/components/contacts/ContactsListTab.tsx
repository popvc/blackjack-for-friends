import { useContactsStore } from "../../store/useContactStore";
import ContactListItem from "./ContactListItem";

export default function ContactsListTab() {
  const contactsList = useContactsStore((state) => state.contactsList);
  const isGettingContacts = useContactsStore((state) => state.isGettingContacts);

  return (
    <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-1">
      {isGettingContacts ? (
        <div className="flex justify-center p-4">
          <span className="loading loading-spinner loading-sm" />
        </div>
      ) : contactsList.length === 0 ? (
        <p className="text-base-content/60 text-sm text-center p-4">No contacts yet</p>
      ) : (
        contactsList.map((contact) => <ContactListItem key={contact.userId} contact={contact} />)
      )}
    </div>
  );
}
