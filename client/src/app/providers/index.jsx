"use client";

import { WishlistAddSuccessProvider } from "@features/toggle-wishlist";
import { I18nProvider, ModalsProvider, ToastProvider } from "@shared";

export default function Providers({ children, locale, messages }) {
  return (
    <I18nProvider locale={locale} messages={messages}>
      <WishlistAddSuccessProvider locale={locale}>
        <ToastProvider>
          <ModalsProvider>{children}</ModalsProvider>
        </ToastProvider>
      </WishlistAddSuccessProvider>
    </I18nProvider>
  );
}