import { deleteAdminReview } from '../../../shared/api/reviews.services';
import toast from '../../../shared/lib/toast';

export const patchClick = (id, navigate) => {
  navigate(`/review-rewrite/${id}`);
};

// Функция для клика "Видалити"
export const deleteReviewClick = async (reviewId, onSuccessRefresh) => {
  if (window.confirm('Ви впевнені, що хочете видалити цей відгук?')) {
    const response = await deleteAdminReview(reviewId);

    if (!response?.error) {
      if (onSuccessRefresh) onSuccessRefresh();
    } else {
      toast.error(response.message || 'Помилка при видаленні відгуку.');
    }
  }
};