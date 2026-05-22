"use client";

import {
  CounterMinusIcon,
  CounterPlusIcon,
} from "@shared";
import {
  decrementQuantityAsync,
  incrementQuantityAsync,
} from "@shared";
import { useDispatch } from "react-redux";

import BasketCounterMinusIcon from "./icons/BasketCounterMinusIcon";
import BasketCounterPlusIcon from "./icons/BasketCounterPlusIcon";

const Counter = ({
  prod,
  value,
  onIncrement,
  onDecrement,
  min = 1,
  max,
  variant,
}) => {
  const dispatch = useDispatch();

  const isControlled = value !== undefined;
  const quantity = isControlled ? value : (prod?.quantityInCart || 0);
  const isMin = quantity <= min;
  const isMax = typeof max === "number" ? quantity >= max : false;
  const isMinusDisabled = isMin;
  const isPlusDisabled = isMax;

  const handleMinus = (e) => {
    e.stopPropagation();
    if (isMinusDisabled) return;
    if (isControlled) {
      if (onDecrement) onDecrement();
    } else {
      dispatch(decrementQuantityAsync(prod._id));
    }
  };

  const handlePlus = (e) => {
    e.stopPropagation();
    if (isPlusDisabled) return;
    if (isControlled) {
      if (onIncrement) onIncrement();
    } else {
      dispatch(incrementQuantityAsync(prod._id));
    }
  };

  const isBasketCounter = variant === "basket";

  return (
    <div className="product-item__counter">
      <button
        className="product-item__counter-btn"
        onClick={handleMinus}
        disabled={isMinusDisabled}
        aria-disabled={isMinusDisabled ? "true" : undefined}
      >
        {isBasketCounter ? (
          <BasketCounterMinusIcon disabled={isMinusDisabled} />
        ) : (
          <CounterMinusIcon />
        )}
      </button>

      <span className="product-item__count">
        {quantity}
      </span>

      <button
        className="product-item__counter-btn"
        onClick={handlePlus}
        disabled={isPlusDisabled}
        aria-disabled={isPlusDisabled ? "true" : undefined}
      >
        {isBasketCounter ? (
          <BasketCounterPlusIcon disabled={isPlusDisabled} />
        ) : (
          <CounterPlusIcon />
        )}
      </button>
    </div>
  );
};

export default Counter;