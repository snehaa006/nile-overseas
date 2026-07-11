import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/shared/lib/queryClient";
import {
  createContactMessage,
  deleteContactMessage,
  fetchContactMessages,
  setContactMessageRead,
} from "@/shared/api/messages";

/** All enquiries for the staff Messages page (and the sidebar unread badge). */
export function useContactMessages() {
  return useQuery({
    queryKey: qk.contactMessages,
    queryFn: fetchContactMessages,
  });
}

function useInvalidateMessages() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: qk.contactMessages });
}

export function useCreateContactMessage() {
  return useMutation({ mutationFn: createContactMessage });
}

export function useSetContactMessageRead() {
  const invalidate = useInvalidateMessages();
  return useMutation({
    mutationFn: (args: { id: string; isRead: boolean }) =>
      setContactMessageRead(args.id, args.isRead),
    onSuccess: invalidate,
  });
}

export function useDeleteContactMessage() {
  const invalidate = useInvalidateMessages();
  return useMutation({
    mutationFn: (id: string) => deleteContactMessage(id),
    onSuccess: invalidate,
  });
}
