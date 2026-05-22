
const LABELS = {
    elegant: {
        en: "limited edition",
        ua: "обмежена колекція",
    },
    sport: {
        en: "for better experience",
        ua: "для кращого досвіду",
    },
    casual: {
        en: "SPRING SUMMER '26",
        ua: "ВЕСНА ЛІТО '26",
    },
  
};

const IMAGES = {
    elegant: "/img/collection-elegant.png",
    sport: "/img/collection-sport.png",
    casual: "/img/collection-casual.png",
    
};

export const createSlides = (categories, locale = "en") => {
    const items = Array.isArray(categories?.items)
        ? categories.items
        : [];

    const collectionsRoot = items.find(
        (item) => item?.slug === "collections",
    );
    const children = Array.isArray(collectionsRoot?.children)
        ? collectionsRoot.children
        : [];
    const activeChildren = children.filter(
        (child) => child?.status === "active",
    );
    const sortedChildren = [...activeChildren].sort(
        (a, b) => (a?.sort ?? 0) - (b?.sort ?? 0),
    );
    
    return sortedChildren.map((child) => ({
        id: child.slug,
        title: child.title?.[locale] || child.title?.en || "",
        label:
            LABELS[child.slug]?.[locale] ||
            LABELS[child.slug]?.en ||
            "",
        image: IMAGES[child.slug] || null,
        href: child.fullSlug,
    }));
}