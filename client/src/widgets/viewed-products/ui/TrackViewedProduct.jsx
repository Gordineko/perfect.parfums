"use client";

import { pushViewedProduct } from "@shared/index";
import { useEffect } from "react";

const TrackViewedProduct = ({ product }) => {
  useEffect(() => {
    pushViewedProduct(product);
  }, [product]);

  return null;
};

export default TrackViewedProduct;

