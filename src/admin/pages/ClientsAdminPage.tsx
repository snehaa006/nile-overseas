import { useRef, useState } from "react";
import { toast } from "sonner";
import { Plus, Upload, Trash2, ImageOff, Check, X, Pencil } from "lucide-react";
import {
  useClients,
  useCreateClient,
  useUpdateClient,
  useDeleteClient,
} from "@/shared/hooks/useClients";
import { uploadClientPhoto } from "@/shared/api/clients";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { LoadingState, ErrorState, EmptyState, Spinner } from "@/shared/components/StateViews";
import type { Client } from "@/shared/types/models";

const MAX_BYTES = 2 * 1024 * 1024;

function validImage(file: File): boolean {
  if (!file.type.startsWith("image/")) {
    toast.error(`${file.name} is not an image`);
    return false;
  }
  if (file.size > MAX_BYTES) {
    toast.error(`${file.name} exceeds 2 MB`);
    return false;
  }
  return true;
}

export function ClientsAdminPage() {
  const { data: clients, isLoading, isError, error, refetch } = useClients();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-primary">Clients</h1>
      </div>

      <AddClientForm nextOrder={clients?.length ?? 0} />

      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : clients && clients.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {clients.map((c) => (
            <ClientRow key={c.id} client={c} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No clients yet"
          description="Add your first client using the form above."
        />
      )}
    </div>
  );
}

function AddClientForm({ nextOrder }: { nextOrder: number }) {
  const create = useCreateClient();
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setName("");
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleAdd = async () => {
    if (!name.trim()) {
      toast.error("Please enter a client name");
      return;
    }
    setSaving(true);
    try {
      let imageUrl: string | null = null;
      if (file) imageUrl = await uploadClientPhoto(file);
      await create.mutateAsync({
        name: name.trim(),
        image_url: imageUrl,
        display_order: nextOrder,
      });
      toast.success(`${name.trim()} added`);
      reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add client");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[200px] flex-1">
          <label className="mb-1 block text-sm font-medium">Client name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Maruti Suzuki"
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Photo / logo</label>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              if (f && !validImage(f)) return;
              setFile(f);
            }}
            className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-sm file:font-medium"
          />
        </div>
        <Button onClick={handleAdd} disabled={saving}>
          {saving ? <Spinner className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          Add Client
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        PNG / JPEG / WebP / SVG, up to 2 MB. Photo is optional.
      </p>
    </div>
  );
}

function ClientRow({ client }: { client: Client }) {
  const update = useUpdateClient();
  const remove = useDeleteClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(client.name);
  const busy = update.isPending || remove.isPending;

  const saveName = async () => {
    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    try {
      await update.mutateAsync({ id: client.id, input: { name: name.trim() } });
      toast.success("Client updated");
      setEditing(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  };

  const replacePhoto = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file || !validImage(file)) return;
    try {
      const url = await uploadClientPhoto(file, client.image_url);
      await update.mutateAsync({ id: client.id, input: { image_url: url } });
      toast.success(`${client.name} photo updated`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = async () => {
    if (!confirm(`Remove ${client.name}?`)) return;
    try {
      await remove.mutateAsync(client);
      toast.success(`${client.name} removed`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Remove failed");
    }
  };

  return (
    <div className="flex items-center gap-4 rounded-xl border p-4">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted/40">
        {client.image_url ? (
          <img
            src={client.image_url}
            alt={client.name}
            className="h-full w-full object-contain"
          />
        ) : (
          <ImageOff className="h-5 w-5 text-muted-foreground" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        {editing ? (
          <div className="flex items-center gap-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveName()}
              autoFocus
              className="h-8"
            />
            <Button size="icon" variant="ghost" onClick={saveName} disabled={busy}>
              <Check className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                setName(client.name);
                setEditing(false);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="group flex items-center gap-1.5 text-left font-medium text-primary"
          >
            {client.name}
            <Pencil className="h-3 w-3 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
          </button>
        )}
      </div>

      <div className="flex shrink-0 gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          <Upload className="h-4 w-4" />
          {client.image_url ? "Replace" : "Upload"}
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
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => replacePhoto(e.target.files)}
        />
      </div>
    </div>
  );
}
