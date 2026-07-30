//contactRequests: Does this need optimistic updates?
//send and reject cannot conflict with another user's actions
//cancel and accept are more likely to fail as the other user can

import axios from "axios";
import { create } from "zustand";
import type {
  ContactRequest,
  ContactRequestData,
  ContactRequestsListData,
  ContactTab,
  PresenceData,
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
  contactsPresence: UserPresence[]; //move this here when convenient
  contactReqs: ContactRequest[];
  contactsTab: ContactTab;
  isGettingPresence: boolean;
  isReqSending: boolean;
  isReqAccepting: boolean;
  isReqCanceling: boolean;
  //rejecting doesn't need a loading state as long as it makes it to the server (any race between users has the same result regardless of who wins)
};

const initialState: ContactsState = {
  contactsPresence: [],
  contactReqs: [],
  contactsTab: "contacts",
  isGettingPresence: false,
  isReqSending: false,
  isReqAccepting: false,
  isReqCanceling: false,
};

type ContactsActions = {
  refreshContactsPresence: () => Promise<void>;
  refreshContactReqs: () => Promise<void>;
  removeContact: (contactId: UserId) => Promise<void>;
  sendContactReq: (recipientId: UserId) => Promise<void>;
  acceptContactReq: (senderId: UserId) => Promise<void>;
  rejectContactReq: (senderId: UserId) => Promise<void>;
  cancelContactReq: (recipientId: UserId) => Promise<void>;
};

export const useContactsStore = create<ContactsState & ContactsActions>()((set, get) => ({
  ...initialState,
  refreshContactsPresence: async () => {
    try {
      set({ isGettingPresence: true });
      const res = await axiosInstance.get<PresenceData>("/contact/presence");

      set({ contactsPresence: res.data.contactsPresence });
    } catch (e: unknown) {
      handleAxiosError(e);
    } finally {
      set({ isGettingPresence: false });
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
      contactsPresence: get().contactsPresence.filter((contact) => contact.userId !== contactId),
    });

    try {
      await axiosInstance.post(`/contact/${contactId}/remove`);
    } catch (e: unknown) {
      if (axios.isAxiosError(e) && e.response?.status === 404) {
        return; //already resolved server-side (removed first); desired state already matches
      }

      handleAxiosError(e);

      //don't trust the removed snapshot here: reconcile with the server instead of reinserting blindly
      await get().refreshContactsPresence();
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
      const { contactReqs } = get();

      await axiosInstance.post<ContactRequestData>(`/contact/request/${senderId}/accept`);

      set({
        contactReqs: contactReqs.filter(
          (req) => req.senderId !== senderId && req.recipientId !== senderId,
        ),
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
}));
