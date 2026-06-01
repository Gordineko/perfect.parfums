import { pathWithoutLocale } from "./localePath";

export function isNavLinkActive(pathname, href) {
  if (typeof pathname !== "string" || !href) {
    return false;
  }

  const current = pathWithoutLocale(pathname);
  const target = pathWithoutLocale(href);

  if (current === target) {
    return true;
  }

  if (target === "/") {
    return false;
  }

  return current.startsWith(`${target}/`);
}
