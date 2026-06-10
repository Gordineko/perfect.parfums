import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom'; // Изменили импорт

import { PageHeader } from "../../shared/ui";
import ModalConfirm from '../../shared/ui/modal-confirm/ui/ModalConfirm';
import Filter from '../../shared/ui/filter/Filter';

import { getAdminInventory } from '../../shared/api/warehouse.services';
import WarehouseList from '../../widgets/warehouse-list/ui/WarehouseList';
import { useWarehouseFilters } from '../../widgets/warehouse-list/config/filter';

export default function WarehousePage() {
  const location = useLocation(); // Берем location вместо searchParams
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const warehouseFilters = useWarehouseFilters();

  useEffect(() => {
   
    console.log("URL изменился на:", location.search);

    const fetchData = async () => {
      try {
        setLoading(true);
        // Берем параметры прямо из строки URL
        const params = new URLSearchParams(location.search);
        const queryParams = Object.fromEntries(params.entries());
        
        const result = await getAdminInventory(queryParams);
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

  return (
    <>

     
        <ModalConfirm title="Ви впевнені, що хочете видалити цю групу товарів?" />


        <PageHeader placeholder={"Пошук за номером, ПІБ, телефоном, email, містом"} link={"/order-rewrite/create"} />
        <Filter fields={warehouseFilters} />

        <section className="section-admin">
          {loading ? (
            <p>Завантаження...</p>
          ) : (
            <WarehouseList data={data} />
          )}
        </section>
    
    </>
  );
}
