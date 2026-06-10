import { updateAdminOrder } from '../../../shared/api/orders.services'; 
import toast from '../../../shared/lib/toast';

// Переход на страницу редактирования
export const putchClick = (orderNumber, navigate) => {
  navigate(`/order-rewrite/${orderNumber}`); // Передаем номер заказа в URL
};

// Функция для клика "Удалить/Отменить"
export const cancelOrderClick = async (orderId, onSuccessRefresh) => {
  if (window.confirm('Ви впевнені, що хочете скасувати це замовлення?')) {
    // Вместо физического удаления меняем статус на 'canceled'
    const response = await updateAdminOrder(orderId, { status: 'canceled' });

    if (!response?.error) {
      if (onSuccessRefresh) onSuccessRefresh();
    } else {
      toast.error(response.message || "Помилка при скасуванні замовлення.");
    }
  }
};

// Если потребуется менять другие статусы прямо из списка
export const changeOrderStatusClick = async (orderId, newStatus, onSuccessRefresh) => {
  const response = await updateAdminOrder(orderId, { status: newStatus });

  if (!response?.error) {
    if (onSuccessRefresh) onSuccessRefresh();
  } else {
    toast.error(response.message || "Помилка при зміні статусу");
  }
};