import { useRef, useState } from "react";
import { Star, Trash2, Upload, ImageOff } from "lucide-react";
import { toast } from "sonner";
import {
  useImages,
  useUploadImage,
  useDeleteImage,
  useSetPrimaryImage,
} from "@/shared/hooks/useImages";
import { Button } from "@/shared/components/ui/button";
import { Spinner } from "@/shared/components/StateViews";
import { cn } from "@/shared/utils/cn";
import type { BlanketImage } from "@/shared/types/models";

const MAX_BYTES = 5 * 1024 * 1024;

export function ImageManager({ blanketId }: { blanketId: string }) {
  const { data: images = [], isLoading } = useImages(blanketId);
  const upload = useUploadImage(blanketId);
  const remove = useDeleteImage(blanketId);
  const setPrimary = useSetPrimaryImage(blanketId);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        toast.error(`${file.name} exceeds 5 MB`);
        continue;
      }
      try {
        await upload.mutateAsync(file);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Upload failed");
      }
    }
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleDelete = async (image: BlanketImage) => {
    if (!confirm("Delete this image?")) return;
    try {
      await remove.mutateAsync(image);
      toast.success("Image deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition",
          dragOver ? "border-accent bg-accent/5" : "border-border",
        )}
      >
        <Upload className="h-6 w-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Drag & drop images here, or
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={upload.isPending}
        >
          {upload.isPending ? <Spinner className="h-4 w-4" /> : null} Choose files
        </Button>
        <p className="text-xs text-muted-foreground">JPEG / PNG / WebP, up to 5 MB</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading images…</p>
      ) : images.length === 0 ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ImageOff className="h-4 w-4" /> No images yet.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {images.map((img) => (
            <div key={img.id} className="group relative overflow-hidden rounded-lg border">
              <img src={img.image_url} alt="" className="aspect-square w-full object-cover" />
              {img.is_primary && (
                <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
                  <Star className="h-3 w-3 fill-current" /> Primary
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 transition group-hover:opacity-100">
                {!img.is_primary && (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="h-7 px-2 text-xs"
                    onClick={() => setPrimary.mutate(img.id)}
                  >
                    <Star className="h-3 w-3" /> Set primary
                  </Button>
                )}
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="ml-auto h-7 w-7"
                  onClick={() => handleDelete(img)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
