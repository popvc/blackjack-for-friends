import { useContactsStore } from "../../store/useContactStore";
import type { ContactRequest, UserId } from "../../types/contacts";
import Avatar from "./Avatar";

type ContactRequestItemProps = {
  request: ContactRequest;
  currentUserId: UserId;
};

export default function ContactRequestItem({ request, currentUserId }: ContactRequestItemProps) {
  const acceptContactReq = useContactsStore((state) => state.acceptContactReq);
  const rejectContactReq = useContactsStore((state) => state.rejectContactReq);
  const cancelContactReq = useContactsStore((state) => state.cancelContactReq);
  const isReqAccepting = useContactsStore((state) => state.isReqAccepting);
  const isReqCanceling = useContactsStore((state) => state.isReqCanceling);

  const isOutgoing = request.senderId === currentUserId;
  const otherUserId = isOutgoing ? request.recipientId : request.senderId;
  const displayName = (isOutgoing ? request.recipientName : request.senderName) ?? otherUserId;

  return (
    <div
      className={`flex items-center gap-3 p-2 rounded-lg border-l-4 ${
        isOutgoing ? "border-info" : "border-success"
      }`}
    >
      <Avatar userId={otherUserId} />
      <div className="flex-1 min-w-0">
        <p className="truncate font-medium">{displayName}</p>
        <span className={`badge badge-soft badge-xs ${isOutgoing ? "badge-info" : "badge-success"}`}>
          {isOutgoing ? "Outgoing" : "Incoming"}
        </span>
      </div>

      {isOutgoing ? (
        <button
          className="btn btn-ghost btn-sm"
          disabled={isReqCanceling}
          onClick={() => cancelContactReq(request.recipientId)}
        >
          Cancel
        </button>
      ) : (
        <div className="flex gap-1">
          <button
            className="btn btn-success btn-sm"
            disabled={isReqAccepting}
            onClick={() => acceptContactReq(request.senderId)}
          >
            Accept
          </button>
          <button className="btn btn-error btn-soft btn-sm" onClick={() => rejectContactReq(request.senderId)}>
            Reject
          </button>
        </div>
      )}
    </div>
  );
}
