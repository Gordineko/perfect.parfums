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
      id: "title_asc",
      label: labels.sortTitleAsc ?? "",
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
        <div className="sort-modal__header">
          <p className="sort-modal__title">
            {labels?.sort ?? ""}
          </p>
        </div>
        <ul className="sort-modal__list">
          {sortOptions.map((opt) => (
            <li key={opt.id}>
              <button
                className={`sort-modal__item ${
                  currentSort === opt.id
                    ? "sort-modal__item--active"
                    : ""
                }`}
                onClick={() => handleSortChange(opt.id)}
              >
                <p>{opt.label}</p>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Sort;