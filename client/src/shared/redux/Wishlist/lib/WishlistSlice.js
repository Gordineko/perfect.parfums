import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import Cookies from "js-cookie";

import {
  deleteIamUserWishlistLine,
  fetchIamUserWishlist,
  postIamUserWishlistAdd,
} from "../api/iamUserWishlist";
import {
  collectWishlistGroupIdsFromItems,
  serverWishlistGroupIdSet,
  wishlistItemGroupId,
  wishlistRowKey,
} from "./wishlistGroupId";

const toggleFlightLocks = new Set();

function toggleLockKey(product) {
  if (!product || typeof product !== "object") {
    return "__invalid__";
  }
  return (
    wishlistItemGroupId(product) ??
    wishlistRowKey(product) ??
    "__guest__"
  );
}

const loadWishlistFromStorage = () => {
  if (typeof window === "undefined") return [];
  try {
    const wishlist = localStorage.getItem("wishlist");
    return wishlist ? JSON.parse(wishlist) : [];
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

export const getWishlistData = createAsyncThunk(
  "wishlist/getWishlistData",
  async (_, { rejectWithValue }) => {
    const token = Cookies.get("auth_token");
    if (!token) {
      return {
        wishlist: loadWishlistFromStorage(),
        source: "local",
        mergeFailures: 0,
      };
    }
    try {
      const localSnapshot = loadWishlistFromStorage();
      const localGroupIds = collectWishlistGroupIdsFromItems(localSnapshot);
      let serverList = await fetchIamUserWishlist();
      const serverIds = serverWishlistGroupIdSet(serverList);
      const missingOnServer = localGroupIds.filter((id) => !serverIds.has(id));

      let mergeFailures = 0;
      if (missingOnServer.length > 0) {
        const results = await Promise.allSettled(
          missingOnServer.map((groupId) => postIamUserWishlistAdd(groupId)),
        );
        mergeFailures = results.filter((r) => r.status === "rejected").length;
        if (mergeFailures > 0) {
          console.warn(
            "[wishlist] getWishlistData: some POST merges failed",
            mergeFailures,
          );
        }
        serverList = await fetchIamUserWishlist();
      }

      localStorage.setItem("wishlist", JSON.stringify(serverList));
      return {
        wishlist: serverList,
        source: "server",
        mergeFailures,
      };
    } catch (err) {
      console.error(err);
      return rejectWithValue("Wishlist load failed");
    }
  },
);

export const toggleWishlistAsync = createAsyncThunk(
  "wishlist/toggleAsync",
  async (product, { dispatch, getState, rejectWithValue }) => {
    const lockKey = toggleLockKey(product);
    try {
      const prevItems = cloneItems(getState().wishlist.items);
      try {
        dispatch({ type: "wishlist/toggleWishlist", payload: product });
        const token = Cookies.get("auth_token");
        if (!token) {
          return;
        }
        const gid = wishlistItemGroupId(product);
        if (!gid) {
          return;
        }
        const key = wishlistRowKey({ ...product, _id: product?._id });
        if (!key) {
          return;
        }
        const nowIn = getState().wishlist.items.some(
          (i) => wishlistRowKey(i) === key,
        );
        if (nowIn) {
          await postIamUserWishlistAdd(gid);
        } else {
          await deleteIamUserWishlistLine(gid);
        }
      } catch (e) {
        return rejectWithValue({ prevItems });
      }
    } finally {
      toggleFlightLocks.delete(lockKey);
    }
  },
  {
    condition: (product, { getState }) => {
      const w = getState().wishlist;
      if (w.syncPending || w.status === "loading") {
        return false;
      }
      const lockKey = toggleLockKey(product);
      if (toggleFlightLocks.has(lockKey)) {
        return false;
      }
      toggleFlightLocks.add(lockKey);
      return true;
    },
  },
);

const initialState = {
  items: loadWishlistFromStorage(),
  status: "idle",
  error: null,
  syncPending: false,
  lastMergeFailureCount: 0,
};

function rollbackWishlistFromRejected(state, action) {
  state.syncPending = false;
  const payload = action.payload;
  if (payload?.prevItems) {
    state.items = payload.prevItems;
    localStorage.setItem("wishlist", JSON.stringify(payload.prevItems));
  }
}

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState,
  reducers: {
    addToWishlist(state, action) {
      const product = action.payload;
      const key = wishlistRowKey(product);
      if (!key) {
        return;
      }
      const exists = state.items.some((i) => wishlistRowKey(i) === key);
      if (!exists) {
        state.items.push(product);
        localStorage.setItem("wishlist", JSON.stringify(state.items));
      }
    },

    removeFromWishlist(state, action) {
      const product = action.payload;
      const key = wishlistRowKey(product);
      if (!key) {
        return;
      }
      state.items = state.items.filter((i) => wishlistRowKey(i) !== key);
      localStorage.setItem("wishlist", JSON.stringify(state.items));
    },

    toggleWishlist(state, action) {
      const product = action.payload;
      const key = wishlistRowKey(product);
      if (!key) {
        return;
      }
      const exists = state.items.some((i) => wishlistRowKey(i) === key);
      if (exists) {
        state.items = state.items.filter((i) => wishlistRowKey(i) !== key);
      } else {
        state.items.push(product);
      }
      localStorage.setItem("wishlist", JSON.stringify(state.items));
    },

    clearWishlist(state) {
      state.items = [];
      localStorage.removeItem("wishlist");
    },
  },

  extraReducers: (builder) => {
    const setSyncPending = (pending) => (state) => {
      state.syncPending = pending;
    };

    builder
      .addCase(getWishlistData.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getWishlistData.fulfilled, (state, action) => {
        state.status = "succeeded";
        const { wishlist, mergeFailures } = action.payload;
        state.items = Array.isArray(wishlist) ? wishlist : [];
        state.lastMergeFailureCount =
          typeof mergeFailures === "number" ? mergeFailures : 0;
        state.error = null;
      })
      .addCase(getWishlistData.rejected, (state) => {
        state.status = "failed";
        state.error = "Wishlist load failed";
        state.items = loadWishlistFromStorage();
      })

      .addCase(toggleWishlistAsync.pending, setSyncPending(true))
      .addCase(toggleWishlistAsync.fulfilled, setSyncPending(false))
      .addCase(toggleWishlistAsync.rejected, rollbackWishlistFromRejected);
  },
});

export const {
  addToWishlist,
  removeFromWishlist,
  toggleWishlist,
  clearWishlist,
} = wishlistSlice.actions;

export default wishlistSlice.reducer;
