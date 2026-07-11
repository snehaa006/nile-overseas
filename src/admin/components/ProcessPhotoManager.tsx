import { useRef } from "react";
import { toast } from "sonner";
import { Upload, Trash2, ImageOff } from "lucide-react";
import { PROCESS_PHOTO_STEPS, type ProcessPhotoStep } from "@/shared/api/processPhotos";
import {
  useProcessPhotos,
  useRemoveProcessPhoto,
  useUploadProcessPhoto,
} from "@/shared/hooks/useProcessPhotos";
import { Button } from "@/shared/components/ui/button";
import { LoadingState, Spinner } from "@/shared/components/StateViews";

const MAX_BYTES = 5 * 1024 * 1024;

/** Upload/replace the photo shown beside each step of the public Processes page. */
export function ProcessPhotoManager() {
  const { data: photos, isLoading } = useProcessPhotos();

  if (isLoading) return <LoadingState />;

  return (
    <div className="space-y-3">
      {PROCESS_PHOTO_STEPS.map((step, i) => (
        <StepPhotoRow
          key={step.key}
          step={step.key}
          label={`${i + 1}. ${step.label}`}
          url={photos?.[step.key] ?? null}
        />
      ))}
    </div>
  );
}

function StepPhotoRow({
  step,
  label,
  url,
}: {
  step: ProcessPhotoStep;
  label: string;
  url: string | null;
}) {
  const upload = useUploadProcessPhoto();
  const remove = useRemoveProcessPhoto();
  const inputRef = useRef<HTMLInputElement>(null);

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
      await upload.mutateAsync({ step, file, previousUrl: url });
      toast.success(`${label} photo updated`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = async () => {
    if (!confirm(`Remove the ${label} photo?`)) return;
    try {
      await remove.mutateAsync({ step, currentUrl: url });
      toast.success(`${label} photo removed`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Remove failed");
    }
  };

  const busy = upload.isPending || remove.isPending;

  return (
    <div className="flex items-center gap-4 rounded-xl border p-4">
      <div className="flex aspect-[4/3] w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted/40">
        {url ? (
          <img src={url} alt={label} className="h-full w-full object-cover" />
        ) : (
          <ImageOff className="h-5 w-5 text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-primary">{label}</p>
        <p className="text-xs text-muted-foreground">
          Shown beside this step on the Processes page. JPEG / PNG / WebP, up to 5 MB.
        </p>
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
          {url ? "Replace" : "Upload"}
        </Button>
        {url && (
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
