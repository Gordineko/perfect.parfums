import { combineReducers } from 'redux';

import cartReducer from '../../redux/Cart/lib/CartSlice';
import WishlistReducer from '../../redux/Wishlist/lib/WishlistSlice';

const rootReducer = combineReducers({
  cart: cartReducer,
  wishlist: WishlistReducer,
});

export default rootReducer;