import {
  Geologica,
  Golos_Text,
  Inter,
  Montserrat,
  Urbanist,
} from "next/font/google";

export const sofiaSansCondensed = Montserrat({
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-sofia-sans-condensed",
});

export const manrope = Golos_Text({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-main",
});

export const urbanist = Urbanist({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-urbanist",
});

export const inter = Inter({
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500"],
  display: "swap",
  variable: "--font-inter",
});

export const geologica = Geologica({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--font-geologica",
  axes: ["slnt", "CRSV"],
});
