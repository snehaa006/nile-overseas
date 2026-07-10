import { useRef } from "react";
import { toast } from "sonner";
import { Upload, Trash2, ImageOff } from "lucide-react";
import { useSettings, useUploadSiteLogo, useRemoveSiteLogo } from "@/shared/hooks/useSettings";
import { Button } from "@/shared/components/ui/button";
import { Spinner } from "@/shared/components/StateViews";

const MAX_BYTES = 2 * 1024 * 1024;

/** Upload/replace the single site-wide logo (navbar, footer, admin sidebar). */
export function SiteLogoManager() {
  const { data: settings } = useSettings();
  const upload = useUploadSiteLogo();
  const remove = useRemoveSiteLogo();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error(`${file.name} is not an image`);
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error(`${file.name} exceeds 2 MB`);
      return;
    }
    try {
      await upload.mutateAsync({ currentUrl: settings?.logo_url, file });
      toast.success("Logo updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = async () => {
    if (!confirm("Remove the site logo?")) return;
    try {
      await remove.mutateAsync(settings?.logo_url);
      toast.success("Logo removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Remove failed");
    }
  };

  const busy = upload.isPending || remove.isPending;

  return (
    <div className="flex items-center gap-4 rounded-xl border p-4">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted/40">
        {settings?.logo_url ? (
          <img src={settings.logo_url} alt="Site logo" className="h-full w-full object-contain" />
        ) : (
          <ImageOff className="h-5 w-5 text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-primary">Nile Overseas logo</p>
        <p className="text-xs text-muted-foreground">
          Shown in the navbar, footer and admin sidebar. PNG / JPEG / WebP / SVG, up to 2 MB.
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
          {settings?.logo_url ? "Replace" : "Upload"}
        </Button>
        {settings?.logo_url && (
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
