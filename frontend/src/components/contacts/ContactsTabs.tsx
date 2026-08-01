import { useContactsStore } from "../../store/useContactStore";
import type { ContactTab } from "../../types/contacts";

export default function ContactsTabs() {
  const contactsTab = useContactsStore((state) => state.contactsTab);

  const setTab = (tab: ContactTab) => useContactsStore.setState({ contactsTab: tab });

  return (
    <div role="tablist" className="tabs tabs-box shrink-0">
      <button
        role="tab"
        className={`tab ${contactsTab === "contacts" ? "tab-active" : ""}`}
        onClick={() => setTab("contacts")}
      >
        Contacts
      </button>
      <button
        role="tab"
        className={`tab ${contactsTab === "requests" ? "tab-active" : ""}`}
        onClick={() => setTab("requests")}
      >
        Requests
      </button>
    </div>
  );
}
