import { Cormorant, Italiana } from "next/font/google";
import localFont from "next/font/local";

export const cormorant = Cormorant({
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-cormorant",
});

export const lato = localFont({
  src: [
    {
      path: "../../../../public/fonts/lato/Lato-Light.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../../../public/fonts/lato/Lato-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../../../public/fonts/lato/Lato-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {

      path: "../../../../public/fonts/lato/Lato-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {

      path: "../../../../public/fonts/lato/Lato-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-lato",
  display: "swap",
  fallback: ["system-ui", "Segoe UI", "sans-serif"],
});

export const italiana = Italiana({
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
  variable: "--font-italiana",
});
