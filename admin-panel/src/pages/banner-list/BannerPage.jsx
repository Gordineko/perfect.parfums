import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom'; // Изменили импорт

import { PageHeader } from "../../shared/ui";
import ModalConfirm from '../../shared/ui/modal-confirm/ui/ModalConfirm';
import Filter from '../../shared/ui/filter/Filter';

import { useModals } from '../../app/context/modals-context';
import { getAdminArticles } from '../../shared/api/blogs.services';
import { useBlogsFilters } from '../../widgets/blogs-list/config/filter';
import BannersList from '../../widgets/banners-list/ui/BannersList';
import { getAdminHomeBanners } from '../../shared/api/banners.services';

export default function BannerPage() {
  const location = useLocation(); 
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const blogFilters = useBlogsFilters();
  const { setIsModalOpen } = useModals();

  useEffect(() => {
    
    console.log("URL изменился на:", location.search);

    const fetchData = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams(location.search);
        const queryParams = Object.fromEntries(params.entries());

        const result = await getAdminHomeBanners(queryParams);
        setData(result);
      } catch (error) {
        console.error("Ошибка при загрузке данных:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

   
  }, [location.search]);

  return (
    <>
      <ModalConfirm title="Ви впевнені, що хочете видалити цю групу товарів?" />
      <PageHeader placeholder={"Пошук за назвою, артикулом (SKU), тегом"} link={"/banner-rewrite/create"} />
      <Filter fields={blogFilters} />

      <section className="section-admin">
        {loading ? (
          <p>Завантаження...</p>
        ) : (
          <BannersList data={data} />
        )}
      </section>
    </>
  );
}