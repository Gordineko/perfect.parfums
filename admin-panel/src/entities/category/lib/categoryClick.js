import { deleteAdminCategory, updateAdminCategory } from '../../../shared/api/categories.services'; 
import toast from '../../../shared/lib/toast';

export const putchClick = (id, navigate) => {
  navigate(`/category-rewrite/${id}`);
};

// Функция для клика "Видалити"
export const deleteCategoryClick = async (categoryId, onSuccessRefresh) => {

  if (window.confirm('Ви впевнені, що хочете видалити цю категорію?')) {
    const response = await deleteAdminCategory(categoryId);

    if (!response?.error) {
     
      if (onSuccessRefresh) onSuccessRefresh();
    } else {
     
      toast.error(response.message || "Помилка при видаленні. Можливо, у категорії є підкатегорії.");
    }
  }
};


export const changeStatusClick = async (categoryId, newStatus, onSuccessRefresh) => {
  
  const response = await updateAdminCategory(categoryId, { status: newStatus });

  if (!response?.error) {
   
    if (onSuccessRefresh) onSuccessRefresh();
  } else {
    toast.error(response.message || "Помилка при зміні статусу");
  }
};