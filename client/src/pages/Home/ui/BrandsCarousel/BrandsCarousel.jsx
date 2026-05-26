import { BRANDS } from "./brandsData";
import BrandsCarouselClient from "./BrandsCarouselClient";

export default function BrandsCarousel() {
  return <BrandsCarouselClient brands={BRANDS} />;
}
