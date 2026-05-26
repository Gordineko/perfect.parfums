import { i18n } from "../i18n/config";

export function localePath(locale, path = "") {
  const loc = locale || i18n.defaultLocale;
  let normalized = String(path ?? "").trim();

  if (!normalized || normalized === "/") {
    return loc === i18n.defaultLocale ? "/" : `/${loc}`;
  }

  if (!normalized.startsWith("/")) {
    normalized = `/${normalized}`;
  }

  if (loc === i18n.defaultLocale) {
    return normalized;
  }

  return `/${loc}${normalized}`;
}

export function pathWithoutLocale(pathname) {
  if (!pathname || pathname === "/") {
    return "/";
  }

  const segments = pathname.split("/").filter(Boolean);

  if (segments.length > 0 && i18n.locales.includes(segments[0])) {
    const rest = segments.slice(1).join("/");
    return rest ? `/${rest}` : "/";
  }

  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}

export function getLocaleFromPathname(pathname) {
  const segments = (pathname || "").split("/").filter(Boolean);
  const first = segments[0];

  if (
    first &&
    i18n.locales.includes(first) &&
    first !== i18n.defaultLocale
  ) {
    return first;
  }

  return i18n.defaultLocale;
}
