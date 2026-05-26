"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

const Sort = ({
  active = "updated_desc",
  onClose,
  labels,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const sortOptions = [
    {
      id: "updated_desc",
      label: labels.sortDefault ?? "",
    },
    {
      id: "popularity",
      label: labels.sortPopular ?? "",
    },
    {
      id: "price_asc",
      label: labels.sortPriceAsc ?? "",
    },
    {
      id: "price_desc",
      label: labels.sortPriceDesc ?? "",
    },
  ];

  const currentSort = searchParams.get("sort") || active;

  const handleSortChange = (sortId) => {
    const params = new URLSearchParams(searchParams.toString());

    params.set("sort", sortId);
    params.set("page", "1");

    router.push(`${pathname}?${params.toString()}`);
    onClose?.();
  };

  return (
    <div className="sort-modal" onClick={onClose}>
      <div
        className="sort-modal__content"
        onClick={(e) => e.stopPropagation()}
      >
        <ul className="sort-modal__list">
          {sortOptions.map((opt) => (
            <li key={opt.id}>
              <button
                type="button"
                className={`sort-modal__item ${
                  currentSort === opt.id
                    ? "sort-modal__item--active"
                    : ""
                }`}
                onClick={() => handleSortChange(opt.id)}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Sort;
