"use client";

import { store } from "@shared";
import React from "react";
import { Provider } from "react-redux";

export default function ReduxProvider({ children }) {
  return <Provider store={store}>{children}</Provider>;
}