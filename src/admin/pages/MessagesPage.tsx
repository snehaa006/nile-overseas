import { toast } from "sonner";
import { Mail, MailOpen, Phone, Trash2 } from "lucide-react";
import {
  useContactMessages,
  useDeleteContactMessage,
  useSetContactMessageRead,
} from "@/shared/hooks/useMessages";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { LoadingState, EmptyState } from "@/shared/components/StateViews";
import { cn } from "@/shared/utils/cn";
import type { ContactMessage } from "@/shared/types/models";

const formatWhen = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

/** Enquiries submitted through the public Contact page form. */
export function MessagesPage() {
  const { data: messages = [], isLoading } = useContactMessages();
  const unread = messages.filter((m) => !m.is_read).length;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-primary">Messages</h1>
        <p className="text-muted-foreground">
          Enquiries sent from the website's Contact page
          {unread > 0 && ` — ${unread} unread`}.
        </p>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : messages.length === 0 ? (
        <EmptyState
          title="No messages yet"
          description="When a visitor submits the Contact form, their enquiry appears here."
        />
      ) : (
        <div className="space-y-3">
          {messages.map((m) => (
            <MessageCard key={m.id} message={m} />
          ))}
        </div>
      )}
    </div>
  );
}

function MessageCard({ message }: { message: ContactMessage }) {
  const setRead = useSetContactMessageRead();
  const remove = useDeleteContactMessage();
  const busy = setRead.isPending || remove.isPending;

  const toggleRead = async () => {
    try {
      await setRead.mutateAsync({ id: message.id, isRead: !message.is_read });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  };

  const handleRemove = async () => {
    if (!confirm(`Delete the message from ${message.name}?`)) return;
    try {
      await remove.mutateAsync(message.id);
      toast.success("Message deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  };

  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-4",
        !message.is_read && "border-accent/50 shadow-sm",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <p className="font-medium">{message.name}</p>
          {!message.is_read && <Badge>New</Badge>}
        </div>
        <p className="text-xs text-muted-foreground">{formatWhen(message.created_at)}</p>
      </div>

      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {message.email && (
          <a
            href={`mailto:${message.email}`}
            className="flex items-center gap-1.5 text-accent hover:underline"
          >
            <Mail className="h-3.5 w-3.5" /> {message.email}
          </a>
        )}
        {message.phone && (
          <a
            href={`tel:${message.phone}`}
            className="flex items-center gap-1.5 text-accent hover:underline"
          >
            <Phone className="h-3.5 w-3.5" /> {message.phone}
          </a>
        )}
      </div>

      <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">
        {message.message}
      </p>

      <div className="mt-3 flex justify-end gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={toggleRead}
          disabled={busy}
        >
          {message.is_read ? (
            <>
              <Mail className="h-4 w-4" /> Mark unread
            </>
          ) : (
            <>
              <MailOpen className="h-4 w-4" /> Mark read
            </>
          )}
        </Button>
        <Button
          type="button"
          size="icon"
          variant="destructive"
          onClick={handleRemove}
          disabled={busy}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
