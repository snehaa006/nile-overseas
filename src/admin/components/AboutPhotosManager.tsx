import { useRef } from "react";
import { toast } from "sonner";
import { Upload, Trash2, ImageOff } from "lucide-react";
import {
  useSettings,
  useUploadAboutPhoto1,
  useRemoveAboutPhoto1,
  useUploadAboutPhoto2,
  useRemoveAboutPhoto2,
} from "@/shared/hooks/useSettings";
import { Button } from "@/shared/components/ui/button";
import { Spinner } from "@/shared/components/StateViews";

const MAX_BYTES = 5 * 1024 * 1024;

/** Upload/replace the two photos shown in the public About page's quote section. */
export function AboutPhotosManager() {
  return (
    <div className="space-y-4">
      <PhotoSlot
        label="Wide work photo"
        hint="The large photo above the quote. Landscape orientation works best."
        useCurrentUrl={(s) => s?.about_photo_1_url}
        useUpload={useUploadAboutPhoto1}
        useRemove={useRemoveAboutPhoto1}
      />
      <PhotoSlot
        label="Portrait photo"
        hint="The smaller photo beside the quote. Portrait orientation works best."
        useCurrentUrl={(s) => s?.about_photo_2_url}
        useUpload={useUploadAboutPhoto2}
        useRemove={useRemoveAboutPhoto2}
      />
    </div>
  );
}

function PhotoSlot({
  label,
  hint,
  useCurrentUrl,
  useUpload,
  useRemove,
}: {
  label: string;
  hint: string;
  useCurrentUrl: (s: ReturnType<typeof useSettings>["data"]) => string | null | undefined;
  useUpload: typeof useUploadAboutPhoto1;
  useRemove: typeof useRemoveAboutPhoto1;
}) {
  const { data: settings } = useSettings();
  const upload = useUpload();
  const remove = useRemove();
  const inputRef = useRef<HTMLInputElement>(null);
  const currentUrl = useCurrentUrl(settings);

  const handleFile = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error(`${file.name} is not an image`);
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error(`${file.name} exceeds 5 MB`);
      return;
    }
    try {
      await upload.mutateAsync({ currentUrl, file });
      toast.success(`${label} updated`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = async () => {
    if (!confirm(`Remove the ${label.toLowerCase()}?`)) return;
    try {
      await remove.mutateAsync(currentUrl);
      toast.success(`${label} removed`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Remove failed");
    }
  };

  const busy = upload.isPending || remove.isPending;

  return (
    <div className="flex items-center gap-4 rounded-xl border p-4">
      <div className="flex aspect-[4/3] w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted/40">
        {currentUrl ? (
          <img src={currentUrl} alt={label} className="h-full w-full object-cover" />
        ) : (
          <ImageOff className="h-5 w-5 text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-primary">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          {upload.isPending ? <Spinner className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
          {currentUrl ? "Replace" : "Upload"}
        </Button>
        {currentUrl && (
          <Button
            type="button"
            size="icon"
            variant="destructive"
            onClick={handleRemove}
            disabled={busy}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files)}
        />
      </div>
    </div>
  );
}
