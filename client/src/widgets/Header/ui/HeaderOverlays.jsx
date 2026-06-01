"use client";

import { MODALS, useModals } from "@shared";
import Basket from "@widgets/basket";
import BurgerMenu from "@widgets/burger-menu";

export default function HeaderOverlays({
  locale,
  categories,
  headerNavItems,
  burgerNavItems,
}) {
  const { isModalOpen, setIsModalOpen } = useModals();

  return (
    <>
      <BurgerMenu
        categories={categories}
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        navItems={headerNavItems}
        burgerNavItems={burgerNavItems}
        locale={locale}
      />
      <Basket locale={locale} />
    </>
  );
}
