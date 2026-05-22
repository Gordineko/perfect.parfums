import Cookies from "js-cookie";
import React, { useEffect } from "react";
import { useDispatch } from "react-redux";

import { fetchCartFromDB } from "../Cart/lib/CartSlice";
import { getWishlistData } from "../Wishlist/lib/WishlistSlice";

export function DataLoader() {
  const dispatch = useDispatch();
  const id = Cookies.get("profile_id");

  useEffect(() => {
    if (id) {
      dispatch(fetchCartFromDB(id));
      dispatch(getWishlistData());
    }
  }, [dispatch, id]);

  return null;
}
