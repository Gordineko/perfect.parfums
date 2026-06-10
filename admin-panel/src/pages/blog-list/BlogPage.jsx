import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom'; // Изменили импорт

import { PageHeader } from "../../shared/ui";
import ModalConfirm from '../../shared/ui/modal-confirm/ui/ModalConfirm';
import Filter from '../../shared/ui/filter/Filter';

import { useModals } from '../../app/context/modals-context';
import { getAdminCategoriesTree } from '../../shared/api/categories.services';
import { useCategoryFilters } from '../../widgets/categories-list/config/filter';
import BlogsList from '../../widgets/blogs-list/ui/BlogsList';
import { getAdminArticles } from '../../shared/api/blogs.services';
import { useBlogsFilters } from '../../widgets/blogs-list/config/filter';

export default function BlogPage() {
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

        const result = await getAdminArticles(queryParams);
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


      <PageHeader placeholder={"Пошук за назвою, артикулом (SKU), тегом"} link={"/blog-rewrite/create"} />
      <Filter fields={blogFilters} />

      <section className="section-admin">
        {loading ? (
          <p>Завантаження...</p>
        ) : (
          <BlogsList data={data} />
        )}
      </section>
    </>
  );
}