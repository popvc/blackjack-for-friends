import { useContactsStore } from "../../store/useContactStore";
import { useAuthStore } from "../../store/useAuthStore";
import ContactRequestItem from "./ContactRequestItem";
import SendRequestForm from "./SendRequestForm";

export default function RequestsTab() {
  const contactReqs = useContactsStore((state) => state.contactReqs);
  const currentUserId = useAuthStore((state) => state.authUser?.userId);

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-1">
        {contactReqs.length === 0 ? (
          <p className="text-base-content/60 text-sm text-center p-4">No pending requests</p>
        ) : (
          currentUserId &&
          contactReqs.map((request) => (
            <ContactRequestItem
              key={`${request.senderId}-${request.recipientId}`}
              request={request}
              currentUserId={currentUserId}
            />
          ))
        )}
      </div>

      <SendRequestForm />
    </div>
  );
}
