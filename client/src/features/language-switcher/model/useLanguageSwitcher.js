
import { MODALS, useModals } from "@shared";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { replaceLocaleInPath } from "../lib/replaceLocaleInPath";

export const useLanguageSwitcher = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isModalOpen, setIsModalOpen } = useModals();

  const getCurrentLocale = () => {
    const segments = pathname.split("/").filter(Boolean);
    return segments[0] || "ua";
  };

  const currentLocale = getCurrentLocale();
  const isOpen = isModalOpen === MODALS.LANGUAGE;

  const onSelect = (nextLocale) => {
    setIsModalOpen(null);
    if (nextLocale === currentLocale) return;

    const newPath = replaceLocaleInPath(pathname, nextLocale);
    const queryString = searchParams.toString();
    const urlWithQuery = queryString ? `${newPath}?${queryString}` : newPath;
    router.push(urlWithQuery);
  };

  const close = () => setIsModalOpen(null);

  return {
    currentLocale,
    isOpen,
    onSelect,
    close,
  };
};