import { removeFromCartAsync } from "@shared";
import { useCallback } from "react";
import { useDispatch } from "react-redux";

export function useRemoveFromCart(product) {
  const dispatch = useDispatch();

  return useCallback(
    (e) => {
      e.stopPropagation();
      const id =
        product?._id ?? product?.id ?? product?.offers?.[0]?._id;
      if (!id) return;
      dispatch(removeFromCartAsync({ _id: id }));
    },
    [dispatch, product],
  );
}
