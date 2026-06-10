import React, { useState } from 'react'
import CatalogPagination from '../../../features/pagination'
import { exportAdminCategoriesCsv } from '../../../shared/api/categories.services'
import toast from '../../../shared/lib/toast'
import ReviewsItem from '../../../entities/review/ui/ReviewsItem'
import CustomSelect from '../../../shared/ui/filter/LimitSelect'

const SORT_OPTIONS = [
    { value: '-createdAt', label: 'Спочатку нові' },
    { value: 'createdAt', label: 'Спочатку старі' },
    { value: '-rating', label: 'Оцінка: від більшої' },
    { value: 'rating', label: 'Оцінка: від меншої' },

];

const ReviewsList = ({ data }) => {
    console.log(data, "data в ReviewsList");
    const [isExporting, setIsExporting] = useState(false);




    const handleExportCsv = async () => {
        if (isExporting) return;

        setIsExporting(true);
        try {
            // Можно передать { status: 'active' }, если нужен фильтр
            const result = await exportAdminCategoriesCsv();

            if (result?.error) {
                toast.error(`Помилка при експорті: ${result.message || 'Невідома помилка'}`);
            }
        } catch (err) {
            console.error("Export failed", err);
            toast.error("Сталася критична помилка при завантаженні файлу");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className='admin-list'>
            <div className="admin-list__header">
                <p className="admin-list__header-info">
                    {data?.total || data?.items?.length || 0} Відгуків
                </p>
                <div className="admin-list__header-func">
                    <CustomSelect options={[10, 20, 50]} />
                    <CustomSelect options={SORT_OPTIONS} queryKey="sort" defaultValue="-createdAt" />

                    <button
                        onClick={handleExportCsv}
                        disabled={isExporting}
                        className={isExporting ? 'loading' : ''}
                    >
                        {isExporting ? 'Завантаження...' : 'Експорт CSV'}
                    </button>
                </div>
            </div>

            <div className="admin-list__content">
                <ul className="admin-list__content-titles reviews-grid">
                    {/* <li>ID</li> */}
                    <li>Товар</li>
                    <li>Оцінка</li>
                    <li>Коментар</li>
                    <li>Дата</li>
                    <li>Видимість</li>
                    <li>Дія</li>
                </ul>
                <ul className="admin-list__content-items">
                    {data?.items?.length > 0 ? (
                        data.items.map((review) => (
                            <ReviewsItem
                                key={review._id || review.id || review.slug}
                                review={review}
                            />
                        ))
                    ) : (
                        <li className="admin-list__empty">Дані відсутні</li>
                    )}
                </ul>
            </div>

            <div className="admin-list__pagination">
                <CatalogPagination data={data} />
            </div>
        </div>
    )
}

export default ReviewsList