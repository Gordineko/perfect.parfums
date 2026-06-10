import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { putchClick, deleteBannerClick, changeStatusClick } from '../lib/bannerClick';
import { getStatusLabel } from '../../../shared/lib/statuses';

const BannerItem = ({ banner }) => {
  console.log("Rendering BannerItem with banner:", banner); // Додайте цей лог для відладки
  const navigate = useNavigate();

  // Статус баннера: 'active' або 'hidden'
  const [status, setStatus] = useState(banner?.status || 'hidden');
  const [isDeleted, setIsDeleted] = useState(false);

  if (isDeleted) return null;

  const title = banner?.title?.ua || "Назва відсутня";
  const secondTitle = banner?.title?.en || "No title";
  const statusText = getStatusLabel(status);

  const handleDelete = () => {
    deleteBannerClick(banner._id, () => setIsDeleted(true));
  };

  const handleToggleStatus = () => {
    const newStatus = status === 'active' ? 'hidden' : 'active';
    changeStatusClick(banner._id, newStatus, (updatedStatus) => setStatus(updatedStatus));
  };

  return (
    <div className='blog-item blogs-grid'> {/* класи можна змінити */}
      <div className="blog-item__txt">
        <p>{title}</p>
      </div>
      <div className="blog-item__txt">
        <p>{secondTitle}</p>
      </div>
      <div className={`blog-item__status ${status === 'active' ? "" : "hidden"}`}>
        <p>{statusText}</p>
      </div>

      <div className="blog-item__func">
        <button
          type="button"
          className='func-rewrite'
          onClick={() => putchClick(banner._id, navigate)}
        >
          Редагувати
        </button>

        <button
          type="button"
          className={status === 'active' ? 'func-hide' : 'func-show'}
          onClick={handleToggleStatus}
        >
          {status === 'active' ? "Приховати" : "Показати"}
        </button>

        <button
          type="button"
          className='func-delete'
          onClick={handleDelete}
        >
          Видалити
        </button>
      </div>
    </div>
  );
};

export default BannerItem;