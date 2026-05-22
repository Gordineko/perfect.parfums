import "./globals.scss";

import { cormorant, lato } from "@shared";

export default function RootLayout({ children }) {
  return (
    <html
      lang="uk"
      suppressHydrationWarning
      className={`${cormorant.variable} ${lato.variable}`}
    >
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
