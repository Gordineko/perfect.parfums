import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// Импортируем все клики из твоего файла
import { putchClick, deleteCategoryClick, changeStatusClick } from '../lib/categoryClick';
import { getStatusLabel } from '../../../shared/lib/statuses';

const CategoryItem = ({ category, depth = 0 }) => {
  const navigate = useNavigate();
  
  const [currentStatus, setCurrentStatus] = useState(category?.status || "active");
  const [isDeleted, setIsDeleted] = useState(false);

  if (isDeleted) return null;

  const title = category?.title?.ua || "Назва";
  const secondTitle = category?.title?.en || "Назва";
  const subCategory = Array.isArray(category?.path) ? category.path.join(' / ') : (category?.fullSlug || '—'); 
  
  const isHidden = currentStatus === 'hidden' || currentStatus === 'draft';

  // Логіка видалення: викликаємо твою функцію і передаємо callback для успішного результату
  const handleDelete = () => {
    // Вся логіка з window.confirm і alert вже всередині deleteCategoryClick!
    deleteCategoryClick(category._id, () => {
      setIsDeleted(true); // Ховаємо карточку, якщо видалення успішне
    });
  };

  // Логіка зміни статусу
  const handleToggleStatus = () => {
    const newStatus = isHidden ? 'active' : 'hidden';
    
    // Вся логіка з alert вже всередині changeStatusClick!
    changeStatusClick(category._id, newStatus, () => {
      setCurrentStatus(newStatus); // Оновлюємо статус в UI, якщо запит успішний
    });
  };

  return (
    <div className='category-item categories-grid'>
      <div className="category-item__info with-list">
        <div className="category-item__info-txt">
          <p>{`${'— '.repeat(depth)}${title}`}</p>
        </div>
        <div className="category-item__info-txt-list">
          <p>{subCategory}</p>
        </div>
      </div>
      
      <div className="category-item__info">
        <div className="category-item__info-txt">
          <p>{secondTitle}</p>
        </div>
      </div> 
      
      <div className="category-item__info">
        <div className="category-item__info-txt">
          <p>{getStatusLabel(currentStatus)}</p>
        </div>
      </div>
      
      <div className="category-item__func">
        <button 
          type="button" 
          className='func-rewrite' 
          onClick={() => putchClick(encodeURIComponent(category.fullSlug || category.slug), navigate)}
        >
          Редагувати
        </button>

        <button 
          type="button" 
          className='func-delete'
          onClick={handleDelete}
        >
          Видалити
        </button>
        
        <button 
          type="button" 
          className='func-hide'
          onClick={handleToggleStatus}
        >
          {isHidden ? 'Показати' : 'Сховати'}
        </button>
      </div>
    </div>
  )
}

export default CategoryItem;