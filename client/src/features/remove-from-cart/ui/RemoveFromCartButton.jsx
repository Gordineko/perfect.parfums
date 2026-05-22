"use client";

import { DeleteBasket } from "@shared";

import { useRemoveFromCart } from "../model/useRemoveFromCart";

export default function RemoveFromCartButton({ product }) {
  const handleRemoveFromCart = useRemoveFromCart(product);

  return (
    <button
      type="button"
      className="product-item__remove"
      onClick={handleRemoveFromCart}
    >
      <DeleteBasket />
    </button>
  );
}
