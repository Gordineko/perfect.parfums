"use client";

import ProductItem from "@entities/product";
import Pagination from "@features/catalog-pagination";
import ProductWishlistButton, {
  getWishlistProductId,
} from "@features/toggle-wishlist";
import { useI18n } from "@shared";
import { useParams, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { useSelector } from "react-redux";

import styles from "./ProfileWishlistContent.module.scss";

const WISHLIST_PAGE_SIZE = 12;
const WISHLIST_DEFAULT_LIMIT = 12;

export default function ProfileWishlistContent() {
  const params = useParams();
  const locale = params?.locale ?? "ua";
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const items = useSelector((state) => state?.wishlist?.items ?? []);
  const totalCount = items.length;

  const limitFromQuery = Number(searchParams?.get("limit"));
  const limit =
    Number.isFinite(limitFromQuery) && limitFromQuery > 0
      ? Math.max(WISHLIST_DEFAULT_LIMIT, limitFromQuery)
      : WISHLIST_DEFAULT_LIMIT;

  const currentPage = Math.max(1, Number(searchParams?.get("page")) || 1);
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));
  const clampedPage = Math.min(currentPage, totalPages);

  const pagedItems = useMemo(() => {
    const start = (clampedPage - 1) * limit;
    return items.slice(start, start + limit);
  }, [clampedPage, items, limit]);

  const WishButton = ({ product }) => (
    <ProductWishlistButton product={product} />
  );

  if (items.length === 0) {
    return (
      <p className={styles.empty} role="status">
        {t("wishlist.emptyText")}
      </p>
    );
  }

  return (
    <>
      <div className={`product-cards-context ${styles.grid}`}>
        {pagedItems.map((product, index) => (
          <ProductItem
            key={
              getWishlistProductId({
                ...(product ?? {}),
                __locale: locale,
              }) ?? index
            }
            product={product}
            actionButtons={{
              WishButton,
            }}
          />
        ))}
      </div>

      <Pagination
        showLoadMore={true}
        pageSize={WISHLIST_PAGE_SIZE}
        moreLabel={t("wishlist.loadMore")}
        data={{
          page: clampedPage,
          pages: totalPages,
          limit,
        }}
        labels={{
          prev: t("catalog.paginationPrev"),
          next: t("catalog.paginationNext"),
        }}
      />
    </>
  );
}
