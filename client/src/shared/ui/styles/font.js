import { Cormorant, Lato } from "next/font/google";

export const cormorant = Cormorant({
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-cormorant",
});

export const lato = Lato({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "700"],
  display: "swap",
  variable: "--font-lato",
});
