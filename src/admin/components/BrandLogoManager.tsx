import { useRef } from "react";
import { toast } from "sonner";
import { Upload, Trash2, ImageOff } from "lucide-react";
import { useBrands, useUploadBrandLogo, useRemoveBrandLogo } from "@/shared/hooks/useCatalogue";
import { Button } from "@/shared/components/ui/button";
import { Spinner } from "@/shared/components/StateViews";
import type { Brand } from "@/shared/types/models";

const MAX_BYTES = 2 * 1024 * 1024;

export function BrandLogoManager() {
  const { data: brands = [], isLoading } = useBrands();

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading brands…</p>;
  if (brands.length === 0) return <p className="text-sm text-muted-foreground">No brands yet.</p>;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {brands.map((brand) => (
        <BrandLogoRow key={brand.id} brand={brand} />
      ))}
    </div>
  );
}

function BrandLogoRow({ brand }: { brand: Brand }) {
  const upload = useUploadBrandLogo();
  const remove = useRemoveBrandLogo();
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
      await upload.mutateAsync({ brand, file });
      toast.success(`${brand.name} logo updated`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = async () => {
    if (!confirm(`Remove the ${brand.name} logo?`)) return;
    try {
      await remove.mutateAsync(brand);
      toast.success(`${brand.name} logo removed`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Remove failed");
    }
  };

  const busy = upload.isPending || remove.isPending;

  return (
    <div className="flex items-center gap-4 rounded-xl border p-4">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted/40">
        {brand.logo_url ? (
          <img src={brand.logo_url} alt={`${brand.name} logo`} className="h-full w-full object-contain" />
        ) : (
          <ImageOff className="h-5 w-5 text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-primary">{brand.name}</p>
        <p className="text-xs text-muted-foreground">PNG / JPEG / WebP / SVG, up to 2 MB</p>
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
          {brand.logo_url ? "Replace" : "Upload"}
        </Button>
        {brand.logo_url && (
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
