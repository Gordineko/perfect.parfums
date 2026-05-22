import "./globals.scss";

import {
  geologica,
  inter,
  manrope,
  sofiaSansCondensed,
  urbanist,
} from "@shared";

export default function RootLayout({ children }) {
  return (
    <html
      lang="uk"
      suppressHydrationWarning
      className={`${sofiaSansCondensed.variable} ${urbanist.variable} ${manrope.variable} ${inter.variable} ${geologica.variable}`}
    >
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
