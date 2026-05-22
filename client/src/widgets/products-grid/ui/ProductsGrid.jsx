"use client";

import ProductItem from "@entities/product";
import ProductWishlistButton from "@features/toggle-wishlist";
import { CATALOG_GRID_PRIORITY_IMAGE_COUNT } from "@shared/api/productsServices";

export default function ProductsGrid({ products }) {
  const isRequestFailed = Array.isArray(products);
  const items =
    !isRequestFailed && Array.isArray(products?.items)
      ? products.items
      : [];
  const showEmptyMessage =
    isRequestFailed || items.length === 0;

  const GridWishButton = ({ product }) => (
    <ProductWishlistButton product={product} />
  );

  if (showEmptyMessage) {
    return (
      <div className="products-grid">
        <p className="products-grid__empty" role="status">
          На жаль, за вашими параметрами товарів не знайдено
        </p>
      </div>
    );
  }

  return (
    <div className="products-grid">
      {items.map((item, index) => (
        <ProductItem
          key={item._id ?? item.slug ?? index}
          product={item}
          imagePriority={
            index < CATALOG_GRID_PRIORITY_IMAGE_COUNT
          }
          actionButtons={{
            WishButton: GridWishButton,
          }}
        />
      ))}
    </div>
  );
}
