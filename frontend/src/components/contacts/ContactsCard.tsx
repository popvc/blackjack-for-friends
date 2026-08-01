import { useEffect } from "react";
import { useContactsStore } from "../../store/useContactStore";
import ContactsTabs from "./ContactsTabs";
import ContactsListTab from "./ContactsListTab";
import RequestsTab from "./RequestsTab";

export default function ContactsCard() {
  const contactsTab = useContactsStore((state) => state.contactsTab);
  const refreshContactsList = useContactsStore((state) => state.refreshContactsList);
  const refreshContactReqs = useContactsStore((state) => state.refreshContactReqs);

  useEffect(() => {
    refreshContactsList();
    refreshContactReqs();
  }, [refreshContactsList, refreshContactReqs]);

  return (
    <div className="card bg-base-100 card-border w-full max-w-sm h-128">
      <div className="card-body flex flex-col gap-2 overflow-hidden">
        <ContactsTabs />
        {contactsTab === "contacts" ? <ContactsListTab /> : <RequestsTab />}
      </div>
    </div>
  );
}
