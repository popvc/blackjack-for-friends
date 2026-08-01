import { useState } from "react";
import { IoSendOutline } from "react-icons/io5";
import { useContactsStore } from "../../store/useContactStore";

export default function SendRequestForm() {
  const [recipientId, setRecipientId] = useState("");
  const sendContactReq = useContactsStore((state) => state.sendContactReq);
  const isReqSending = useContactsStore((state) => state.isReqSending);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmedId = recipientId.trim();
    if (!trimmedId) return;

    sendContactReq(trimmedId);
    setRecipientId("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 shrink-0 border-t border-base-300 pt-2 mt-2">
      <input
        type="text"
        placeholder="Enter a user ID"
        className="input input-sm flex-1"
        value={recipientId}
        onChange={(e) => setRecipientId(e.target.value)}
      />
      <button
        type="submit"
        className="btn btn-primary btn-sm"
        disabled={isReqSending || !recipientId.trim()}
        aria-label="Send contact request"
      >
        {isReqSending ? <span className="loading loading-spinner loading-xs" /> : <IoSendOutline className="w-4 h-4" />}
      </button>
    </form>
  );
}
