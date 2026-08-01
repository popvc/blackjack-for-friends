//contactRequests: Does this need optimistic updates?
//send and reject cannot conflict with another user's actions
//cancel and accept are more likely to fail as the other user can

import axios from "axios";
import { create } from "zustand";
import type { Socket } from "socket.io-client";
import type {
  Contact,
  ContactRequest,
  ContactRequestData,
  ContactRequestsListData,
  ContactTab,
  PresenceData,
  ServerToClientEvents,
  UserId,
  UserPresence,
} from "../types/contacts";
import { handleAxiosError } from "./useAuthStore";
import { axiosInstance } from "../config/axios";

//TODO (contacts):
//players need contacts list field
//need to search by player ID or name (exact match)
//need to hold sent requests in own collection ContactRequests (id, time, sender, recipient)
//will display on both until resolved
//users need to be able to accept or reject messages (determines whether deleted from db)

//use web sockets to enable real-time status between two, optimist UI updates for sender and recipients

//TODO (chat): *foundation for session chat groups
//type Presence = "online" | "offline";

type ContactsState = {
  contactsList: Contact[];
  contactReqs: ContactRequest[];
  contactsTab: ContactTab;
  isGettingContacts: boolean;
  isReqSending: boolean;
  isReqAccepting: boolean;
  isReqCanceling: boolean;
  //rejecting doesn't need a loading state as long as it makes it to the server (any race between users has the same result regardless of who wins)
};

const initialState: ContactsState = {
  contactsList: [],
  contactReqs: [],
  contactsTab: "contacts",
  isGettingContacts: false,
  isReqSending: false,
  isReqAccepting: false,
  isReqCanceling: false,
};

type ContactsFuncts = {
  refreshContactsList: () => Promise<void>;
  refreshContactReqs: () => Promise<void>;
  removeContact: (contactId: UserId) => Promise<void>;
  sendContactReq: (recipientId: UserId) => Promise<void>;
  acceptContactReq: (senderId: UserId) => Promise<void>;
  rejectContactReq: (senderId: UserId) => Promise<void>;
  cancelContactReq: (recipientId: UserId) => Promise<void>;
  bindSocketEvents: (socket: Socket<ServerToClientEvents>) => void;
  unbindSocketEvents: (socket: Socket<ServerToClientEvents>) => void;
};

const isSamePair = (a: ContactRequest, b: ContactRequest) =>
  a.senderId === b.senderId && a.recipientId === b.recipientId;

const handleNewContactReq = ({ contactRequest }: { contactRequest: ContactRequest }) => {
  const { contactReqs } = useContactsStore.getState();
  if (contactReqs.some((req) => isSamePair(req, contactRequest))) return;

  useContactsStore.setState({ contactReqs: [...contactReqs, contactRequest] });
};

const handleRemovedContactReq = ({ contactRequest }: { contactRequest: ContactRequest }) => {
  useContactsStore.setState({
    contactReqs: useContactsStore
      .getState()
      .contactReqs.filter((req) => !isSamePair(req, contactRequest)),
  });
};

const handleNewContact = ({
  contactRequest,
  newContact,
}: {
  contactRequest: ContactRequest;
  newContact: Contact;
}) => {
  useContactsStore.setState({
    contactReqs: useContactsStore
      .getState()
      .contactReqs.filter((req) => !isSamePair(req, contactRequest)),
    contactsList: [...useContactsStore.getState().contactsList, newContact],
  });
};

const handleRemovedContact = ({ contactId }: { contactId: UserId }) => {
  useContactsStore.setState({
    contactsList: useContactsStore
      .getState()
      .contactsList.filter((contact) => contact.userId !== contactId),
  });
};

const handleNewPresence = ({ userId, presence }: UserPresence) => {
  useContactsStore.setState({
    contactsList: useContactsStore
      .getState()
      .contactsList.map((contact) => (contact.userId === userId ? { ...contact, presence } : contact)),
  });
};

const handleConnect = () => {
  useContactsStore.getState().refreshContactReqs();
  useContactsStore.getState().refreshContactsList();
};

export const useContactsStore = create<ContactsState & ContactsFuncts>()((set, get) => ({
  ...initialState,
  refreshContactsList: async () => {
    try {
      set({ isGettingContacts: true });
      const res = await axiosInstance.get<PresenceData>("/contact/presence");

      set({ contactsList: res.data.contactsPresence });
    } catch (e: unknown) {
      handleAxiosError(e);
    } finally {
      set({ isGettingContacts: false });
    }
  },
  refreshContactReqs: async () => {
    try {
      const res = await axiosInstance.get<ContactRequestsListData>("/contact/request/list");

      set({ contactReqs: res.data.contactRequests });
    } catch (e: unknown) {
      handleAxiosError(e);
    }
  },
  removeContact: async (contactId: UserId) => {
    set({
      contactsList: get().contactsList.filter((contact) => contact.userId !== contactId),
    });

    try {
      await axiosInstance.post(`/contact/${contactId}/remove`);
    } catch (e: unknown) {
      if (axios.isAxiosError(e) && e.response?.status === 404) {
        return; //already resolved server-side (removed first), desired state already matches
      }

      handleAxiosError(e);

      //don't trust the removed snapshot here, reconcile with the server instead of reinserting blindly
      await get().refreshContactsList();
    }
  },
  sendContactReq: async (recipientId: UserId) => {
    try {
      set({ isReqSending: true });
      const { contactReqs } = get();

      const res = await axiosInstance.post<ContactRequestData>(
        `/contact/request/${recipientId}/send`,
      );

      set({ contactReqs: [...contactReqs, res.data.contactRequest] });
    } catch (e: unknown) {
      handleAxiosError(e);
    } finally {
      set({ isReqSending: false });
    }
  },
  acceptContactReq: async (senderId: UserId) => {
    try {
      set({ isReqAccepting: true });
      const { contactReqs, contactsList } = get();

      const res = await axiosInstance.post<ContactRequestData>(
        `/contact/request/${senderId}/accept`,
      );

      set({
        contactReqs: contactReqs.filter(
          (req) => req.senderId !== senderId && req.recipientId !== senderId,
        ),
        contactsList: res.data.newContact ? [...contactsList, res.data.newContact] : contactsList,
      });
    } catch (e: unknown) {
      handleAxiosError(e);
    } finally {
      set({ isReqAccepting: false });
    }
  },
  rejectContactReq: async (senderId: UserId) => {
    set({
      contactReqs: get().contactReqs.filter(
        (req) => req.senderId !== senderId && req.recipientId !== senderId,
      ),
    });

    try {
      await axiosInstance.post(`/contact/request/${senderId}/reject`);
    } catch (e: unknown) {
      if (axios.isAxiosError(e) && e.response?.status === 404) {
        return; //if action is already resolved server side (cancelled/rejected first)
      }

      handleAxiosError(e);

      //even if an error occurrs, it's possible the desired effect occurs anyways
      await get().refreshContactReqs();
    }
  },
  cancelContactReq: async (recipientId: UserId) => {
    try {
      set({ isReqCanceling: true });
      const { contactReqs } = get();

      await axiosInstance.post<ContactRequestData>(`/contact/request/${recipientId}/cancel`);

      set({
        contactReqs: contactReqs.filter(
          (req) => req.senderId !== recipientId && req.recipientId !== recipientId,
        ),
      });
    } catch (e: unknown) {
      handleAxiosError(e);
    } finally {
      set({ isReqCanceling: false });
    }
  },
  bindSocketEvents: (socket) => {
    socket.on("connect", handleConnect);
    socket.on("newContactReq", handleNewContactReq);
    socket.on("removedContactReq", handleRemovedContactReq);
    socket.on("newContact", handleNewContact);
    socket.on("removedContact", handleRemovedContact);
    socket.on("newPresence", handleNewPresence);
  },
  unbindSocketEvents: (socket) => {
    socket.off("connect", handleConnect);
    socket.off("newContactReq", handleNewContactReq);
    socket.off("removedContactReq", handleRemovedContactReq);
    socket.off("newContact", handleNewContact);
    socket.off("removedContact", handleRemovedContact);
    socket.off("newPresence", handleNewPresence);
  },
}));
