import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom'; // Изменили импорт

import { PageHeader } from "../../shared/ui";
import ModalConfirm from '../../shared/ui/modal-confirm/ui/ModalConfirm';
import Filter from '../../shared/ui/filter/Filter';
import { getAdminReviews } from '../../shared/api/reviews.services';
import ReviewsList from '../../widgets/reviews-list/ui/ReviewsList';
import { useReviewFilters } from '../../widgets/reviews-list/config/filter';

export default function ReviewsPage() {
  const location = useLocation(); // Берем location вместо searchParams
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const reviewFilters = useReviewFilters();

  useEffect(() => {
    // Внимание! Если вы видите этот лог бесконечно, 
    // значит URL постоянно скачет. Смотрите на значение:
    console.log("URL изменился на:", location.search);

    const fetchData = async () => {
      try {
        setLoading(true);
        // Берем параметры прямо из строки URL
        const params = new URLSearchParams(location.search);
        const queryParams = Object.fromEntries(params.entries());

        const result = await getAdminReviews(queryParams);
        setData(result);
      } catch (error) {
        console.error("Ошибка при загрузке данных:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Следим только за строкой location.search (например, "?page=1")
  }, [location.search]);
  console.log(data, "data в ReviewsPage");
  return (
    <>
      <ModalConfirm title="Ви впевнені, що хочете видалити цю групу товарів?" />


      <PageHeader placeholder={"Пошук за іменем або текстом відгуку"} link={"/review-rewrite/create"} />
  <Filter fields={reviewFilters} />

      <section className="section-admin">
        {loading ? (
          <p>Завантаження...</p>
        ) : (
          <ReviewsList data={data} />
        )}
      </section>
    </>
  );
}