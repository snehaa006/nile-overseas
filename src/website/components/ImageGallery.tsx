import { useState } from "react";
import { ImageOff } from "lucide-react";
import type { BlanketImage } from "@/shared/types/models";
import { cn } from "@/shared/utils/cn";

export function ImageGallery({ images }: { images: BlanketImage[] }) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <ImageOff className="h-10 w-10" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="aspect-square overflow-hidden rounded-xl border bg-muted">
        <img
          src={images[active].image_url}
          alt={`View ${active + 1}`}
          className="h-full w-full object-cover"
        />
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setActive(i)}
              className={cn(
                "h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition",
                i === active ? "border-accent" : "border-transparent opacity-70",
              )}
            >
              <img
                src={img.image_url}
                alt={`Thumbnail ${i + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
