import { deleteAdminUser } from '../../../shared/api/users.services';
import toast from '../../../shared/lib/toast';

export const deleteUserClick = async (userId, onSuccessRefresh) => {
  if (window.confirm('Ви впевнені, що хочете видалити цього користувача?')) {
    try {
      const response = await deleteAdminUser(userId);

      // Перевіряємо на помилки (залежно від того, як працює ваш handleResponse)
      if (!response?.error) {
        toast.success('Користувача видалено');
        if (onSuccessRefresh) onSuccessRefresh();
      } else {
        toast.error(response.message || "Помилка при видаленні користувача.");
      }
    } catch (error) {
      console.error("Помилка при видаленні:", error);
      toast.error("Сталася помилка при видаленні користувача.");
    }
  }
};