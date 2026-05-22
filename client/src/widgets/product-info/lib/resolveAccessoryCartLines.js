import { getProductBySlug } from "../../../shared/api/productsServices";
import { getOfferUnitPrice } from "../../../shared/lib/offerPrice";

export function accessorySlugFromImageUrl(imageUrl) {
  if (typeof imageUrl !== "string") return null;
  const m = imageUrl.match(/\/seed\/([^/]+)\//);
  if (!m) return null;
  const seed = decodeURIComponent(m[1]);
  if (seed.startsWith("accessory-")) {
    return seed.replace(/^accessory-/, "");
  }
  return seed;
}

function isSelected(selectedAccessoryIds, productGroupId) {
  if (productGroupId == null) return false;
  const g = String(productGroupId);
  return [...selectedAccessoryIds].some((k) => String(k) === g);
}

function accessoryLabelForLog(a) {
  const gid = a?.productGroupId != null ? String(a.productGroupId) : "?";
  return `[accessory groupId=${gid}]`;
}

export async function buildAccessoryCartLines({
  accessories,
  selectedAccessoryIds,
  quantity,
  mainOfferId,
  currency,
}) {
  const list = Array.isArray(accessories) ? accessories : [];
  const mainId = mainOfferId != null ? String(mainOfferId) : "";

  const candidates = list.filter(
    (a) =>
      a?.productGroupId != null &&
      String(a.productGroupId).trim() !== "" &&
      isSelected(selectedAccessoryIds, a.productGroupId),
  );

  const out = [];

  for (const a of candidates) {
    try {
      if (a?.offerId && a?.defaultOffer) {
        const offer = a.defaultOffer;
        const unit =
          Number(offer.effectivePrice ?? offer.price) || Number(a.price) || 0;
        const rounded = Number.isFinite(unit) ? Math.round(unit) : 0;
        const oid = String(a.offerId);
        if (!oid || oid === mainId) {
          console.warn(
            `${accessoryLabelForLog(a)} skipped: invalid offerId or same as main offer`,
          );
          continue;
        }
        out.push({
          _id: oid,
          quantityInCart: quantity,
          title: a.title,
          imageURL: a.imageUrl || "",
          offers: [offer],
          pricing: { min: String(rounded), currency },
        });
        continue;
      }

      const slugRaw =
        typeof a.slug === "string" && a.slug.trim()
          ? a.slug.trim()
          : accessorySlugFromImageUrl(a.imageUrl);

      if (!slugRaw) {
        console.warn(
          `${accessoryLabelForLog(a)} no slug (missing a.slug and imageUrl parse). Skipped.`,
        );
        continue;
      }

      let data;
      try {
        data = await getProductBySlug(slugRaw);
      } catch (e) {
        console.warn(
          `${accessoryLabelForLog(a)} getProductBySlug("${slugRaw}") failed:`,
          e,
        );
        continue;
      }

      const item = data?.item;
      const offer = item?.offers?.[0];
      if (!offer?._id) {
        console.warn(
          `${accessoryLabelForLog(a)} slug="${slugRaw}": no product or offers[0]. Skipped.`,
        );
        continue;
      }

      const oid = String(offer._id);
      if (oid === mainId) {
        console.warn(
          `${accessoryLabelForLog(a)} offerId matches main line. Skipped.`,
        );
        continue;
      }

      const unit = getOfferUnitPrice(offer);
      const rounded = Number.isFinite(unit) ? Math.round(unit) : 0;

      out.push({
        _id: oid,
        quantityInCart: quantity,
        title: item?.title ?? a.title,
        imageURL: item?.imageURL || a.imageUrl || "",
        offers: [offer],
        pricing: { min: String(rounded), currency },
      });
    } catch (e) {
      console.warn(
        `${accessoryLabelForLog(a)} unexpected error while building cart line:`,
        e,
      );
    }
  }

  return out;
}
