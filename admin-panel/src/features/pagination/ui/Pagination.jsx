import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

export default function CatalogPagination({ data }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const pathname = location.pathname;

  const currentPage = Number(data?.page || 1);
  const totalPages = Number(data?.pages || data?.totalPages || 1);
  const [jumpPage, setJumpPage] = useState(String(currentPage));

  useEffect(() => {
    setJumpPage(String(currentPage));
  }, [currentPage]);

  if (!data || !data.page || !data.total || !data.limit) {
    return null;
  }

  const goToPage = (pageNumber) => {
    const normalizedPage = Math.min(Math.max(Number(pageNumber) || 1, 1), totalPages);
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(normalizedPage));
    navigate(`${pathname}?${params.toString()}`);
  };

  const getPagesArray = () => {
    const pages = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i += 1) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (currentPage > 3) {
        pages.push("dots");
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i += 1) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push("dots");
      }

      pages.push(totalPages);
    }

    return pages;
  };

  const pagesArray = getPagesArray();

  const handleJumpSubmit = () => {
    const parsedPage = Number.parseInt(jumpPage, 10);
    if (Number.isNaN(parsedPage)) {
      setJumpPage(String(currentPage));
      return;
    }

    goToPage(parsedPage);
  };

  return (
    <div className="catalog-pagination">
      <div className="catalog-pagination__wrapper">
        <button
          type="button"
          className="catalog-pagination__item catalog-pagination__item-arrow"
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Попередня сторінка"
        >
          <p>&lt;</p>
        </button>

        {pagesArray.map((page, index) => {
          if (page === "dots") {
            return (
              <span key={`dots-${index}`} className="catalog-pagination__dots">
                ...
              </span>
            );
          }

          return (
            <button
              key={page}
              type="button"
              className={`catalog-pagination__item ${
                currentPage === page ? "is-active" : ""
              }`}
              onClick={() => goToPage(page)}
              aria-current={currentPage === page ? "page" : undefined}
            >
              <p>{page}</p>
            </button>
          );
        })}

        <button
          type="button"
          className="catalog-pagination__item catalog-pagination__item-arrow"
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Наступна сторінка"
        >
          <p>&gt;</p>
        </button>
      </div>

      {totalPages > 7 && (
        <div className="catalog-pagination__jump">
          <input
            max={totalPages}
            value={jumpPage}
            className="catalog-pagination__jump-input"
            onChange={(event) => setJumpPage(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleJumpSubmit();
              }
            }}
          />
          <button
            type="button"
            className="catalog-pagination__jump-button"
            onClick={handleJumpSubmit}
          >
            OK
          </button>
          <span className="catalog-pagination__jump-total">/ {totalPages}</span>
        </div>
      )}
    </div>
  );
}
