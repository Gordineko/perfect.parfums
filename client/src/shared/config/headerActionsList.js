import Basket from "../ui/icons/Basket";
import  BurgerMenu  from "../ui/icons/BurgerMenu";
import FavoriteHeart from "../ui/icons/FavoriteHeart";
import  LanguageSwitcher  from "../ui/icons/LanguageSwitcher";
import Profile from "../ui/icons/Profile";
import Search from "../ui/icons/Search";

export const headerActionsList = [
  { id: "search", label: "Пошук", Icon: Search },
  {
    id: "profile",
    label: "Профіль",
    Icon: Profile,
  },
  {
    id: "favorite",
    label: "Обране",
    Icon: FavoriteHeart,
  },
  { id: "basket", label: "Кошик", Icon: Basket },

  {
    id: "lang",
    label: "Мова",
    Icon: LanguageSwitcher,
  },
  {
    id: "menu",
    label: "Меню",
    Icon: BurgerMenu,
  },
];