import Image from "next/image";
import { BottleArt } from "./bottle-art";
import type { ProductImage as ProductImageData } from "@/lib/api/types";

/** Product photo, or a neutral bottle placeholder until the business uploads one. */
export function ProductImage({
  image,
  name,
  sizes,
  priority = false,
}: {
  image: ProductImageData | null;
  name: string;
  sizes: string;
  priority?: boolean;
}) {
  if (!image) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-[#261b17] to-[#140e0c]" role="img" aria-label={`${name} (photo coming soon)`}>
        <BottleArt className="h-3/4" />
      </div>
    );
  }
  return <Image src={image.url} alt={image.alt || name} fill sizes={sizes} priority={priority} className="object-cover" />;
}
