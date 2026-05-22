import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import Cookies from "js-cookie";

import { getOfferUnitPrice } from "../../../lib/offerPrice";
import {
  deleteIamUserCartLine,
  fetchIamUserCart,
  mergeGuestCartLinesWithPost,
  patchIamUserCartQty,
  postIamUserCartAdd,
} from "../api/iamUserCart";
import {
  markGuestCartMerged,
  shouldMergeGuestCart,
} from "./cartMergeSession";
import { formatIamCartLines } from "./formatIamCartLines";

const loadCartFromStorage = () => {
  if (typeof window === "undefined") return [];
  try {
    const cart = localStorage.getItem("cart");
    const parsed = cart ? JSON.parse(cart) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

function cloneItems(items) {
  try {
    return JSON.parse(JSON.stringify(Array.isArray(items) ? items : []));
  } catch {
    return [];
  }
}

function isLikelyMongoId(value) {
  return typeof value === "string" && /^[a-f\d]{24}$/i.test(value);
}

function buildMergePayloadFromLocal(localLines) {
  if (!Array.isArray(localLines)) {
    return [];
  }
  const byOffer = new Map();
  for (const line of localLines) {
    const offerId = line?._id;
    if (!isLikelyMongoId(String(offerId))) {
      continue;
    }
    const id = String(offerId);
    const qty = Math.max(
      1,
      Math.floor(Number(line?.quantityInCart ?? line?.qty ?? 1)) || 1,
    );
    const prev = byOffer.get(id) ?? 0;
    byOffer.set(id, Math.max(prev, qty));
  }
  return Array.from(byOffer.entries()).map(([offerId, qty]) => ({
    offerId,
    qty,
  }));
}

const calcTotal = (items) => {
  if (!Array.isArray(items)) return 0;
  return items.reduce((sum, item) => {
    const o = Array.isArray(item?.offers) ? item.offers[0] : null;
    const fromOffer = o ? getOfferUnitPrice(o) : NaN;
    const unit = Number.isFinite(fromOffer)
      ? fromOffer
      : Number(item?.pricing?.min);
    const price = Number.isFinite(unit) ? unit : 0;
    const quantity = item?.quantityInCart ?? 1;
    return sum + price * quantity;
  }, 0);
};

function formatServerCartLines(serverCart) {
  const arr = Array.isArray(serverCart) ? serverCart : [];
  return arr.map((item) => ({
    ...item,
    quantityInCart: item.quantity ?? item.quantityInCart ?? 1,
  }));
}

export const fetchCartFromDB = createAsyncThunk(
  "cart/fetchCartFromDB",
  async () => {
    try {
      const token = Cookies.get("auth_token");
      if (!token) {
        const localCart = loadCartFromStorage();
        return { cart: localCart, source: "local" };
      }

      const rawCart = await fetchIamUserCart();
      const formattedCart = formatIamCartLines(rawCart);
      return {
        cart: formattedCart,
        source: "server",
      };
    } catch (err) {
      console.error("fetchCartFromDB failed:", err);
      const localCart = loadCartFromStorage();
      return { cart: localCart, source: "error" };
    }
  },
);

export const getCartData = createAsyncThunk(
  "cart/getCartData",
  async (_, { rejectWithValue }) => {
    const token = Cookies.get("auth_token");
    if (!token) {
      return { cart: loadCartFromStorage(), source: "local" };
    }
    try {
      const localSnapshot = loadCartFromStorage();
      const shouldMerge = shouldMergeGuestCart(token);
      const mergePayload = buildMergePayloadFromLocal(localSnapshot);
      let mergeFailures = 0;

      if (shouldMerge && mergePayload.length > 0) {
        const serverBeforeMerge = await fetchIamUserCart();
        const { failed } = await mergeGuestCartLinesWithPost(
          mergePayload,
          serverBeforeMerge,
        );
        mergeFailures = failed.length;
      }

      const rawCart = await fetchIamUserCart();
      const formattedCart = formatIamCartLines(rawCart);
      localStorage.setItem("cart", JSON.stringify(formattedCart));

      if (shouldMerge) {
        markGuestCartMerged(token);
      }

      return {
        cart: formattedCart,
        source: "server",
        mergeFailures,
      };
    } catch (err) {
      console.error(err);
      return rejectWithValue("Cart load failed");
    }
  },
);

export const addToCartAsync = createAsyncThunk(
  "cart/addAsync",
  async (payload, { dispatch, getState, rejectWithValue }) => {
    const prevItems = cloneItems(getState().cart.items);
    const delta = Math.max(
      1,
      Math.floor(Number(payload?.quantityInCart ?? 1)) || 1,
    );
    try {
      dispatch({ type: "cart/addToCart", payload });
      const token = Cookies.get("auth_token");
      if (!token) return;
      const id = payload._id;
      if (!id) return;
      await postIamUserCartAdd(String(id), delta);
    } catch (e) {
      return rejectWithValue({ prevItems });
    }
  },
);

export const incrementQuantityAsync = createAsyncThunk(
  "cart/incrementAsync",
  async (productId, { dispatch, getState, rejectWithValue }) => {
    const prevItems = cloneItems(getState().cart.items);
    try {
      dispatch({ type: "cart/incrementQuantity", payload: productId });
      const token = Cookies.get("auth_token");
      if (!token) return;
      await postIamUserCartAdd(String(productId), 1);
    } catch (e) {
      return rejectWithValue({ prevItems });
    }
  },
);

export const decrementQuantityAsync = createAsyncThunk(
  "cart/decrementAsync",
  async (productId, { dispatch, getState, rejectWithValue }) => {
    const prevItems = cloneItems(getState().cart.items);
    try {
      dispatch({ type: "cart/decrementQuantity", payload: productId });
      const token = Cookies.get("auth_token");
      if (!token) return;
      const item = getState().cart.items.find((i) => i._id === productId);
      if (!item) return;
      await patchIamUserCartQty(productId, item.quantityInCart);
    } catch (e) {
      return rejectWithValue({ prevItems });
    }
  },
);

export const removeFromCartAsync = createAsyncThunk(
  "cart/removeAsync",
  async (item, { dispatch, getState, rejectWithValue }) => {
    const prevItems = cloneItems(getState().cart.items);
    try {
      dispatch({ type: "cart/removeFromCart", payload: item });
      const token = Cookies.get("auth_token");
      if (!token) return;
      if (!item?._id) return;
      await deleteIamUserCartLine(item._id);
    } catch (e) {
      return rejectWithValue({ prevItems });
    }
  },
);

export const clearCartAsync = createAsyncThunk(
  "cart/clearAsync",
  async (_, { dispatch, getState, rejectWithValue }) => {
    const prevItems = cloneItems(getState().cart.items);
    const token = Cookies.get("auth_token");
    if (!token) {
      dispatch({ type: "cart/clearCart" });
      return;
    }
    try {
      const ids = prevItems.map((i) => i?._id).filter(Boolean);
      const results = await Promise.allSettled(
        ids.map((id) => deleteIamUserCartLine(id)),
      );
      const failCount = results.filter((r) => r.status === "rejected").length;
      if (failCount > 0) {
        console.warn(
          "[cart] clearCartAsync: some DELETE cart line failed",
          failCount,
        );
        return rejectWithValue({ prevItems });
      }
      dispatch({ type: "cart/clearCart" });
    } catch (e) {
      return rejectWithValue({ prevItems });
    }
  },
);

export const changeQuantityAsync = createAsyncThunk(
  "cart/changeQtyAsync",
  async ({ id, quantityInCart }, { dispatch, getState, rejectWithValue }) => {
    const prevItems = cloneItems(getState().cart.items);
    try {
      dispatch({
        type: "cart/changeQuantity",
        payload: { id, quantityInCart },
      });
      const token = Cookies.get("auth_token");
      if (!token) return;
      const item = getState().cart.items.find((i) => i._id === id);
      if (!item) return;
      await patchIamUserCartQty(id, item.quantityInCart);
    } catch (e) {
      return rejectWithValue({ prevItems });
    }
  },
);

const initialState = {
  items: loadCartFromStorage(),
  total: calcTotal(loadCartFromStorage()),
  status: "idle",
  error: null,
  lastSynced: null,
  syncPending: false,
  lastMergeFailureCount: 0,
};

function rollbackFromRejected(state, action) {
  state.syncPending = false;
  const payload = action.payload;
  if (payload?.prevItems) {
    state.items = payload.prevItems;
    state.total = calcTotal(payload.prevItems);
    localStorage.setItem("cart", JSON.stringify(payload.prevItems));
  }
}

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart(state, action) {
      const item = action.payload;
      const exists = state.items.find((i) => i._id === item._id);

      if (exists) {
        exists.quantityInCart += item.quantityInCart ?? 1;
      } else {
        state.items.push({
          ...item,
          quantityInCart: item.quantityInCart ?? 1,
        });
      }

      state.total = calcTotal(state.items);
      localStorage.setItem("cart", JSON.stringify(state.items));
    },

    removeFromCart(state, action) {
      const item = action.payload;
      if (!item?._id) return;
      state.items = state.items.filter((i) => i._id !== item._id);
      state.total = calcTotal(state.items);
      localStorage.setItem("cart", JSON.stringify(state.items));
    },

    changeQuantity(state, action) {
      const { id, quantityInCart } = action.payload;
      const item = state.items.find((i) => i._id === id);

      if (item) {
        item.quantityInCart = Math.max(1, quantityInCart);
        state.total = calcTotal(state.items);
        localStorage.setItem("cart", JSON.stringify(state.items));
      }
    },

    incrementQuantity(state, action) {
      const id = action.payload;
      const item = state.items.find((i) => i._id === id);

      if (item) {
        item.quantityInCart += 1;
        state.total = calcTotal(state.items);
        localStorage.setItem("cart", JSON.stringify(state.items));
      }
    },

    decrementQuantity(state, action) {
      const id = action.payload;
      const item = state.items.find((i) => i._id === id);

      if (item) {
        if (item.quantityInCart > 1) {
          item.quantityInCart -= 1;
        } else {
          item.quantityInCart = 1;
        }

        state.total = calcTotal(state.items);
        localStorage.setItem("cart", JSON.stringify(state.items));
      }
    },

    clearCart(state) {
      state.items = [];
      state.total = 0;
      localStorage.removeItem("cart");
    },
  },

  extraReducers: (builder) => {
    const setSyncPending = (pending) => (state) => {
      state.syncPending = pending;
    };

    builder
      .addCase(fetchCartFromDB.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchCartFromDB.fulfilled, (state, action) => {
        state.status = "succeeded";
        const { cart: serverCart, source } = action.payload;

        if (source === "server") {
          const formattedCart = formatServerCartLines(serverCart);
          state.items = formattedCart;
          state.total = calcTotal(formattedCart);
          localStorage.setItem("cart", JSON.stringify(formattedCart));
          state.lastSynced = new Date().toISOString();
        } else if (source === "local" || source === "error") {
          const formattedCart = formatServerCartLines(serverCart);
          state.items = formattedCart;
          state.total = calcTotal(formattedCart);
          localStorage.setItem("cart", JSON.stringify(formattedCart));
        }
      })
      .addCase(fetchCartFromDB.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      .addCase(getCartData.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getCartData.fulfilled, (state, action) => {
        state.status = "succeeded";
        const { cart, source, mergeFailures } = action.payload;
        state.items = cart;
        state.total = calcTotal(cart);
        state.lastMergeFailureCount =
          typeof mergeFailures === "number" ? mergeFailures : 0;
        if (source === "server") {
          state.lastSynced = new Date().toISOString();
        }
      })
      .addCase(getCartData.rejected, (state) => {
        state.status = "failed";
        state.error = "Cart load failed";
        const fallback = loadCartFromStorage();
        state.items = fallback;
        state.total = calcTotal(fallback);
      })

      .addCase(addToCartAsync.pending, setSyncPending(true))
      .addCase(addToCartAsync.fulfilled, setSyncPending(false))
      .addCase(addToCartAsync.rejected, rollbackFromRejected)
      .addCase(incrementQuantityAsync.pending, setSyncPending(true))
      .addCase(incrementQuantityAsync.fulfilled, setSyncPending(false))
      .addCase(incrementQuantityAsync.rejected, rollbackFromRejected)
      .addCase(decrementQuantityAsync.pending, setSyncPending(true))
      .addCase(decrementQuantityAsync.fulfilled, setSyncPending(false))
      .addCase(decrementQuantityAsync.rejected, rollbackFromRejected)
      .addCase(removeFromCartAsync.pending, setSyncPending(true))
      .addCase(removeFromCartAsync.fulfilled, setSyncPending(false))
      .addCase(removeFromCartAsync.rejected, rollbackFromRejected)
      .addCase(clearCartAsync.pending, setSyncPending(true))
      .addCase(clearCartAsync.fulfilled, setSyncPending(false))
      .addCase(clearCartAsync.rejected, rollbackFromRejected)
      .addCase(changeQuantityAsync.pending, setSyncPending(true))
      .addCase(changeQuantityAsync.fulfilled, setSyncPending(false))
      .addCase(changeQuantityAsync.rejected, rollbackFromRejected);
  },
});

export const {
  addToCart,
  removeFromCart,
  changeQuantity,
  incrementQuantity,
  decrementQuantity,
  clearCart,
} = cartSlice.actions;

export default cartSlice.reducer;
