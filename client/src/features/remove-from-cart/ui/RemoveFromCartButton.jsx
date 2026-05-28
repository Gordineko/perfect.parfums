"use client";

import { useRemoveFromCart } from "../model/useRemoveFromCart";

export default function RemoveFromCartButton({ product }) {
  const handleRemoveFromCart = useRemoveFromCart(product);

  return (
    <button
      type="button"
      className="product-item__remove"
      onClick={handleRemoveFromCart}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="13"
        height="14"
        viewBox="0 0 13 14"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M1 0.510742L12.4892 12.5106"
          stroke="currentColor"
          strokeLinecap="round"
        />
        <path
          d="M0.488281 12.5107L11.9774 0.510848"
          stroke="currentColor"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}
