import { useRef, useState } from "react";
import { toast } from "sonner";
import { Plus, Upload, Trash2, User } from "lucide-react";
import {
  useTeamMembers,
  useCreateTeamMember,
  useUpdateTeamMember,
  useDeleteTeamMember,
} from "@/shared/hooks/useTeam";
import { uploadTeamPhoto } from "@/shared/api/team";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Spinner } from "@/shared/components/StateViews";
import type { TeamMember } from "@/shared/types/models";

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

/**
 * Add / edit / remove the people shown in the public "Ownership and management" section.
 * Embedded as a card inside Website Settings.
 */
export function TeamManager() {
  const { data: members = [], isLoading } = useTeamMembers();

  return (
    <div className="space-y-5">
      <AddMemberForm nextOrder={members.length} />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading team…</p>
      ) : members.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No team members yet — add your first one above.
        </p>
      ) : (
        <div className="space-y-3">
          {members.map((m) => (
            <MemberRow key={m.id} member={m} />
          ))}
        </div>
      )}
    </div>
  );
}

function AddMemberForm({ nextOrder }: { nextOrder: number }) {
  const create = useCreateTeamMember();
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setName("");
    setRole("");
    setDescription("");
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleAdd = async () => {
    if (!name.trim()) {
      toast.error("Please enter a name");
      return;
    }
    setSaving(true);
    try {
      let imageUrl: string | null = null;
      if (file) imageUrl = await uploadTeamPhoto(file);
      await create.mutateAsync({
        name: name.trim(),
        role: role.trim() || null,
        description: description.trim() || null,
        image_url: imageUrl,
        display_order: nextOrder,
      });
      toast.success(`${name.trim()} added`);
      reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add member");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border bg-muted/30 p-4">
      <p className="mb-3 text-sm font-medium text-primary">Add a team member</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label className="mb-1 block text-xs">Name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Bonnie Green"
          />
        </div>
        <div>
          <Label className="mb-1 block text-xs">Role / title</Label>
          <Input
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. Head of Production"
          />
        </div>
      </div>
      <div className="mt-3">
        <Label className="mb-1 block text-xs">Description</Label>
        <Textarea
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="A short line about this person."
        />
      </div>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <Label className="mb-1 block text-xs">Photo</Label>
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
          Add member
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        PNG / JPEG / WebP / SVG, up to 2 MB. Role, description and photo are optional.
      </p>
    </div>
  );
}

function MemberRow({ member }: { member: TeamMember }) {
  const update = useUpdateTeamMember();
  const remove = useDeleteTeamMember();
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(member.name);
  const [role, setRole] = useState(member.role ?? "");
  const [description, setDescription] = useState(member.description ?? "");

  const busy = update.isPending || remove.isPending;
  const dirty =
    name.trim() !== member.name ||
    role.trim() !== (member.role ?? "") ||
    description.trim() !== (member.description ?? "");

  const save = async () => {
    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    try {
      await update.mutateAsync({
        id: member.id,
        input: {
          name: name.trim(),
          role: role.trim() || null,
          description: description.trim() || null,
        },
      });
      toast.success(`${name.trim()} updated`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  };

  const replacePhoto = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file || !validImage(file)) return;
    try {
      const url = await uploadTeamPhoto(file, member.image_url);
      await update.mutateAsync({ id: member.id, input: { image_url: url } });
      toast.success(`${member.name} photo updated`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = async () => {
    if (!confirm(`Remove ${member.name}?`)) return;
    try {
      await remove.mutateAsync(member);
      toast.success(`${member.name} removed`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Remove failed");
    }
  };

  return (
    <div className="rounded-xl border p-4">
      <div className="flex gap-4">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted/40">
          {member.image_url ? (
            <img
              src={member.image_url}
              alt={member.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <User className="h-6 w-6 text-muted-foreground" />
          )}
        </div>

        <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
          />
          <Input
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="Role / title"
          />
        </div>
      </div>

      <Textarea
        rows={2}
        className="mt-3"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description"
      />

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
          >
            <Upload className="h-4 w-4" />
            {member.image_url ? "Replace photo" : "Upload photo"}
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => replacePhoto(e.target.files)}
          />
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={save} disabled={busy || !dirty}>
            {update.isPending && <Spinner className="h-4 w-4" />}
            Save
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
    </div>
  );
}
