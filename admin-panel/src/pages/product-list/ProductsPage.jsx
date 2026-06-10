import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { PageHeader } from '../../shared/ui';
import toast from '../../shared/lib/toast';
// ДОДАНО: імпорт функції видалення
import { getAdminCatalogGroups, deleteAdminCatalogGroup } from '../../shared/api/products.services';
import ProductsList from '../../widgets/products-list/ui/ProductsList';
import Filter from '../../shared/ui/filter/Filter';
import { useProductFilters } from '../../widgets/products-list/config/filter';
import ModalConfirm from '../../shared/ui/modal-confirm/ui/ModalConfirm';

// ДОДАНО: імпорт контексту модалок
import { useModals } from '../../app/context/modals-context';

export default function ProductsPage() {
  const [searchParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // ДОДАНО: Стан для тригеру оновлення списку
  const [refreshKey, setRefreshKey] = useState(0); 
  // ДОДАНО: Стан для збереження ID товару, який видаляємо
  const [itemToDelete, setItemToDelete] = useState(null); 
  
  const dynamicFilters = useProductFilters();
  const { setIsModalOpen } = useModals();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const queryParams = Object.fromEntries([...searchParams]);
        const result = await getAdminCatalogGroups(queryParams);
        setData(result);
      } catch (error) {
        console.error("Ошибка при загрузке данных:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [searchParams, refreshKey]); 


  const handleDeleteClick = (groupId) => {
      setItemToDelete(groupId);
      setIsModalOpen('confirm');
  };

  // 2. Клік "Прийняти" у модалці
  const handleConfirmDelete = async () => {
      if (!itemToDelete) return;

      try {
          // Робимо запит на бекенд
          await deleteAdminCatalogGroup(itemToDelete);
          // Оновлюємо список товарів
          setRefreshKey(prev => prev + 1); 
      } catch (error) {
          console.error("Помилка видалення:", error);
          toast.error("Не вдалося видалити товар");
      } finally {
          // Очищаємо стан і закриваємо модалку
          setItemToDelete(null);
          setIsModalOpen(null);
      }
  };

  return (
    <>
   
      <ModalConfirm 
          onConfirm={handleConfirmDelete} 
          title="Ви впевнені, що хочете видалити цю групу товарів?" 
      />
      <PageHeader placeholder={"Пошук за назвою, артикулом (SKU), тегом"} link={"/product-rewrite/create"} />
      <Filter fields={dynamicFilters} />
      <section className="section-admin">
        {loading ? (
          null
        ) : (
          
          <ProductsList data={data} onDeleteClick={handleDeleteClick} />
        )}
      </section>
    </>
  );
}