import React, { useState } from 'react'
import CatalogPagination from '../../../features/pagination'
import UserItem from '../../../entities/user/ui/UserItem'
import CustomSelect from '../../../shared/ui/filter/LimitSelect'
// Импортируем созданную функцию экспорта из сервисов
import { exportAdminUsersCsv } from '../../../shared/api/users.services'
import toast from '../../../shared/lib/toast'

const UsersList = ({ data, searchQuery = '' }) => {
    const [isExporting, setIsExporting] = useState(false);

    const handleExportCsv = async () => {
        if (isExporting) return;

        setIsExporting(true);
        try {
            // Передаем searchQuery, чтобы выгрузить отфильтрованный список
            await exportAdminUsersCsv(searchQuery);
        } catch (error) {
            console.error("User export failed:", error);
            toast.error(`Помилка експорту: ${error.message}`);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className='admin-list'>
            <div className="admin-list__header">
                <p className="admin-list__header-info">
                    {data.total || 0} Користувачів
                </p>
                <div className="admin-list__header-func">
                    <CustomSelect options={[10, 20, 50]} />
                    
                    <button 
                        onClick={handleExportCsv}
                        disabled={isExporting}
                        className={isExporting ? 'loading' : ''}
                        style={{ cursor: isExporting ? 'not-allowed' : 'pointer' }}
                    >
                        {isExporting ? 'Завантаження...' : 'Експорт CSV'}
                    </button>
                </div>
            </div>

            <div className="admin-list__content">
                <ul className="admin-list__content-titles clients-grid">
                    <li>Покупець</li>
                    <li>Надійність</li>
                    <li>Замовлень</li>
                    <li>Обіг</li>
                    <li>Дата реєстрації</li>
                    <li>Дія</li>
                </ul>
                
                <ul className="admin-list__content-items">
                    {data?.users?.length > 0 ? (
                        data.users.map((user) => (
                            <UserItem
                                key={user.id}
                                user={user}
                            />
                        ))
                    ) : (
                        <li className="admin-list__empty">Користувачів не знайдено</li>
                    )}
                </ul>
            </div>

            <div className="admin-list__pagination">
                <CatalogPagination 
                    data={{ 
                        limit: data.limit, 
                        page: data.page, 
                        pages: data.pages, 
                        total: data.total 
                    }} 
                />
            </div>
        </div>
    )
}

export default UsersList