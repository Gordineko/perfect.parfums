"use client";
import ProductItem from "@entities/product";
import CartButton from "@features/cart-buttons";
import Pagination from "@features/catalog-pagination";
import Counter from "@features/counter";
import WishlistButton from "@features/wish-buttons";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";

const WishList = ({ isEmpty }) => {
  const dispatch = useDispatch();
  const wishlistItems = useSelector(
    (state) => state.wishlist.items,
  );
  return (
    <section className="wishlist section-margin">
      {isEmpty ? (
        <div className="wishlist-empty">
          Ваш вішлист порожній
        </div>
      ) : (
        <ul className="wishlist-grid">
          {wishlistItems?.map((item, index) => (
            <li
              key={index}
              className="wishlist-grid__item"
            >
              <ProductItem
                product={item}
                active={true}
                location="wishlist"
                actionButtons={{
                  CartButton: () => (
                    <CartButton
                      location="prod-item"
                      product={item}
                    />
                  ),
                  WishButton: () => (
                    <WishlistButton
                      product={item}
                      className="wishlist-button"
                    />
                  ),
                  Counter: (props) => (
                    <Counter prod={props?.product || item} />
                  ),
                }}
              />
            </li>
          ))}
        </ul>
      )}

      {/* <Pagination /> */}
    </section>
  );
};

export default WishList;
