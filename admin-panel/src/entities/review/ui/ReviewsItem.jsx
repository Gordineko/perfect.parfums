import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { patchClick, deleteReviewClick } from '../lib/reviewsClick';

const ReviewsItem = ({ review, depth = 0 }) => {
  const navigate = useNavigate();
  const [isDeleted, setIsDeleted] = useState(false);

  if (isDeleted) return null;

  const title = review?.product?.title?.ua || "Назва";
  const point = review?.rating || "Оцінка";
  const comment = review?.text || "Коментар";
  const dateSource = review?.updatedAt || review?.createdAt;
  const status = String(review?.status || '').toLowerCase();
  const isPublished = status === 'published';
  const statusLabel = isPublished ? 'Видимий' : 'Прихований';

  const formatReviewDate = (isoDate) => {
    if (!isoDate) return 'Дата';
    const dateObj = new Date(isoDate);
    if (Number.isNaN(dateObj.getTime())) return 'Дата';

    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const handleDelete = () => {
    deleteReviewClick(review?._id, () => {
      setIsDeleted(true);
    });
  };

  return (
    <div className='reviews-item reviews-grid'>
      <div className="reviews-item__info">
        <div className="reviews-item__info-txt ">
          <p className='reviews_name'>{title}</p>
        </div>
      </div>
      <div className="reviews-item__info">
        <div className="reviews-item__info-txt ">
          <p className='reviews_point'>{point}</p>
        </div>
      </div>
      <div className="reviews-item__info">
        <div className="reviews-item__info-txtt">
          <p className='reviews_comment'>{comment}</p>
        </div>
      </div>
      <div className="reviews-item__info">
        <div className="reviews-item__info-txt reviews_date">
          <p className='reviews_date'>{formatReviewDate(dateSource)}</p>
        </div>
      </div>
      <div className="reviews-item__info">
        <div className={`reviews-item__status ${isPublished ? 'is-visible' : 'is-hidden'}`}>
          <p>{statusLabel}</p>
        </div>
      </div>

      <div className="reviews-item__func">
        <button
          type="button"
          className='func-rewrite'
          onClick={() => patchClick(review?._id, navigate)}
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
      </div>
    </div>
  )
}

export default ReviewsItem;