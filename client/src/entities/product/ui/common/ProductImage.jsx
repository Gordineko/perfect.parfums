"use client";

import { BREAKPOINTS } from "@shared";
import Image from "next/image";
import {
  useEffect,
  useState,
} from "react";

const LOCAL_FALLBACK = "/img/fallback.jpg";

function resolveProductImageSrc(raw) {
  if (raw == null || String(raw).trim() === "") {
    return LOCAL_FALLBACK;
  }

  const s = String(raw).trim();
  if (s.startsWith("/")) {
    return s;
  }

  try {
    const u = new URL(s);
    const host = u.hostname.toLowerCase();
    const path = `${u.pathname}${u.search}`.toLowerCase();

    if (
      (host.includes("postimg.cc") || host.includes("postimg.org")) &&
      path.includes("fallback")
    ) {
      return LOCAL_FALLBACK;
    }
  } catch {
    return LOCAL_FALLBACK;
  }

  return s;
}

const PRODUCT_IMAGE_SIZES = `(max-width: ${BREAKPOINTS.mobileXs}px) 100vw, (max-width: ${BREAKPOINTS.mobileMax}px) 50vw, (max-width: ${BREAKPOINTS.tabletMax}px) 33vw, 25vw`;

const ProductImage = ({
  image,
  alt = "Product image",
  priority = false,
  children,
}) => {
  const resolved = resolveProductImageSrc(image);
  const [displaySrc, setDisplaySrc] = useState(resolved);

  useEffect(() => {
    setDisplaySrc(resolveProductImageSrc(image));
  }, [image]);

  const isRemote =
    displaySrc.startsWith("http://") ||
    displaySrc.startsWith("https://");

  return (
    <div className="product-item__image-wrap">
      <Image
        className="product-item__image"
        fill
        sizes={PRODUCT_IMAGE_SIZES}
        src={displaySrc}
        alt={alt}
        priority={priority}
        loading={priority ? undefined : "lazy"}
        unoptimized={isRemote}
        onError={() => {
          setDisplaySrc(LOCAL_FALLBACK);
        }}
      />
      {children}
    </div>
  );
};

export default ProductImage;
