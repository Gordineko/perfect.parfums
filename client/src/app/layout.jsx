import "./globals.scss";

import { cormorant, italiana, lato } from "@shared";

export default function RootLayout({ children }) {
  return (
    <html
      lang="uk"
      suppressHydrationWarning
      className={`${cormorant.variable} ${lato.variable} ${italiana.variable}`}
    >
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
