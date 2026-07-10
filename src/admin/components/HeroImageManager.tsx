import { useRef } from "react";
import { toast } from "sonner";
import { Upload, Trash2, ImageOff } from "lucide-react";
import {
  useSettings,
  useUploadHeroImage,
  useRemoveHeroImage,
} from "@/shared/hooks/useSettings";
import { Button } from "@/shared/components/ui/button";
import { Spinner } from "@/shared/components/StateViews";

const MAX_BYTES = 5 * 1024 * 1024;

/** Upload/replace the showcase photo shown in the public Home page hero. */
export function HeroImageManager() {
  const { data: settings } = useSettings();
  const upload = useUploadHeroImage();
  const remove = useRemoveHeroImage();
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
      await upload.mutateAsync({ currentUrl: settings?.hero_image_url, file });
      toast.success("Hero image updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = async () => {
    if (!confirm("Remove the Home hero image?")) return;
    try {
      await remove.mutateAsync(settings?.hero_image_url);
      toast.success("Hero image removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Remove failed");
    }
  };

  const busy = upload.isPending || remove.isPending;

  return (
    <div className="flex items-center gap-4 rounded-xl border p-4">
      <div className="flex aspect-[4/3] w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted/40">
        {settings?.hero_image_url ? (
          <img
            src={settings.hero_image_url}
            alt="Home hero"
            className="h-full w-full object-cover"
          />
        ) : (
          <ImageOff className="h-5 w-5 text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-primary">Home hero image</p>
        <p className="text-xs text-muted-foreground">
          The large showcase photo on the public homepage hero. When empty, a
          styled placeholder is shown. JPEG / PNG / WebP, up to 5 MB.
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
          {settings?.hero_image_url ? "Replace" : "Upload"}
        </Button>
        {settings?.hero_image_url && (
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
