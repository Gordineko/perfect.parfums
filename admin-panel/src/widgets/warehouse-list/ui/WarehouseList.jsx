import React, { useState } from 'react';
import CatalogPagination from '../../../features/pagination';
import WarehouseItem from '../../../entities/warehouse/ui/WarehouseItem';
import { auditAdminInventory } from '../../../shared/api/warehouse.services';
import toast from '../../../shared/lib/toast';

const WarehouseList = ({ data, refreshData }) => {
    const [isEditMode, setIsEditMode] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // drafts зберігає зміни у форматі: { "offerId_warehouseId": factQty }
    const [drafts, setDrafts] = useState({});

    // Функція оновлення чернетки при вводі в інпут
    const handleDraftChange = (offerId, warehouseId, value) => {
        const key = `${offerId}_${warehouseId}`;
        setDrafts(prev => ({
            ...prev,
            [key]: {
                offerId,
                warehouseId,
                factQty: Number(value)
            }
        }));
    };

    const handleCancel = () => {
        setIsEditMode(false);
        setDrafts({});
    };

    const handleApply = async () => {
        const itemsToUpdate = Object.values(drafts);

        if (itemsToUpdate.length === 0) {
            setIsEditMode(false);
            return;
        }

        setIsSubmitting(true);

        const payload = {
            currency: "UAH",
            comment: "Масова інвентаризація через адмін-панель",
            items: itemsToUpdate
        };
        console.log(payload)
        const result = await auditAdminInventory(payload);

        if (result && !result.error) {
            toast.success("Залишки успішно оновлено!");
            setIsEditMode(false);
            setDrafts({});
            if (refreshData) refreshData();
            window.location.reload();
        } else {
            toast.error("Помилка: " + (result?.message || "Невідома помилка"));
        }

        setIsSubmitting(false);
    };

    return (
        <div className='admin-list'>
            <div className="admin-list__header">
                <p className="admin-list__header-info">
                    {data?.meta?.total || 0} Товарів
                </p>
                <div className="admin-list__header-func">
                    {!isEditMode ? (
                        <button className='warehouse-rewrite' onClick={() => setIsEditMode(true)}>
                            Редагування залишків
                        </button>
                    ) : (
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                className='warehouse-rewrite'
                                style={{ background: 'var(--color-success)', color: 'var(--color-white)' }}
                                onClick={handleApply}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Збереження..." : "Застосувати"}
                            </button>
                            <button
                                className='warehouse-rewrite'
                                style={{ background: 'var(--color-danger)', color: 'var(--color-white)' }}
                                onClick={handleCancel}
                                disabled={isSubmitting}
                            >
                                Відмінити
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="admin-list__content">
                <ul className="admin-list__content-titles no-padding warehouse-grid">
                    <p className='w-padding'>Товар/Артикул</p>
                    {data?.warehouses?.map((wh, index) => (
                        <div key={index} className="admin-list__content-titles-container w-padding">
                            <p>{wh.title?.ua || `Склад ${index + 1}`}</p>
                            <div className="admin-list__content-titles-list">
                                <p>Усього</p>
                                <p>Резерв</p>
                                <p>Доступно</p>
                            </div>
                        </div>
                    ))}
                </ul>
                <ul className="admin-list__content-items">
                    {data?.items?.map((item) => (
                        <WarehouseItem
                            key={item.offerId}
                            product={item}
                            isEditMode={isEditMode}
                            drafts={drafts}
                            onDraftChange={handleDraftChange}
                        />
                    ))}
                </ul>
            </div>
            <div className="admin-list__pagination">
                <CatalogPagination data={data?.meta} />
            </div>
        </div>
    );
};

export default WarehouseList;