// Імпортуємо методи для роботи з баннерами
import { deleteAdminHomeBanner, updateAdminHomeBanner } from '../../../shared/api/banners.services';
import toast from '../../../shared/lib/toast';

// Редагування - перехід на сторінку редагування баннера
export const putchClick = (bannerId, navigate) => {
  navigate(`/banner-rewrite/${bannerId}`);
};

// Функція для кліку "Видалити"
export const deleteBannerClick = async (bannerId, onSuccess) => {
  if (window.confirm('Ви впевнені, що хочете видалити цей баннер?')) {
    const response = await deleteAdminHomeBanner(bannerId);

    if (!response?.error) {
      if (onSuccess) onSuccess(); // Викликаємо колбек, щоб приховати елемент в UI
    } else {
      toast.error(response.message || "Помилка при видаленні баннера.");
    }
  }
};

// Функція для зміни статусу (active / hidden)
export const changeStatusClick = async (bannerId, newStatus, onSuccess) => {
  // newStatus очікуємо як 'active' або 'hidden'
  const response = await updateAdminHomeBanner(bannerId, { status: newStatus });

  if (!response?.error) {
    if (onSuccess) onSuccess(newStatus); // Оновлюємо локальний стан
  } else {
    toast.error(response.message || "Помилка при зміні статусу");
  }
};