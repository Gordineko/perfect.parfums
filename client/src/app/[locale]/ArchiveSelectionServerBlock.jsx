import {
  getSaleCatalogCards,
  normalizeCatalogCardForProductItem,
} from "@shared";
import ArchiveSelection from "@widgets/archive-selection";

export default async function ArchiveSelectionServerBlock({ data }) {
  const result = await getSaleCatalogCards();

  if (!result.ok) {
    return (
      <ArchiveSelection
        data={data}
        fetchState="error"
        errorMessage={result.message}
        httpStatus={result.status}
        products={[]}
      />
    );
  }

  const normalized = (result.items ?? [])
    .map((raw) => normalizeCatalogCardForProductItem(raw))
    .filter(Boolean)
    .map((product) => ({ ...product, hasDiscount: true }))
    .slice(0, 20);

  if (normalized.length === 0) {
    return (
      <ArchiveSelection
        data={data}
        fetchState="success"
        products={[]}
      />
    );
  }

  return (
    <ArchiveSelection
      data={data}
      fetchState="success"
      products={normalized}
    />
  );
}
