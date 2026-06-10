// Імпортуємо методи саме для СТАТЕЙ (блогів), а не категорій
import { deleteAdminArticle, updateAdminArticle } from '../../../shared/api/blogs.services'; 
import toast from '../../../shared/lib/toast';

export const putchClick = (slug, navigate) => {
  navigate(`/blog-rewrite/${slug}`);
};

// Функція для кліку "Видалити"
export const deleteBlogClick = async (articleId, onSuccess) => {
  if (window.confirm('Ви впевнені, що хочете видалити цю статтю?')) {
    const response = await deleteAdminArticle(articleId);

    if (!response?.error) {
      if (onSuccess) onSuccess(); // Викликаємо колбек, щоб приховати елемент в UI
    } else {
      toast.error(response.message || "Помилка при видаленні статті.");
    }
  }
};

// Функція для зміни статусу (isPublished)
export const changeStatusClick = async (idOrSlug, newPublishStatus, onSuccess) => {
  // Відправляємо PATCH запит з новим значенням isPublished (true/false)
  const response = await updateAdminArticle(idOrSlug, { isPublished: newPublishStatus });

  if (!response?.error) {
    if (onSuccess) onSuccess(newPublishStatus); // Оновлюємо локальний стейт
  } else {
    toast.error(response.message || "Помилка при зміні статусу");
  }
};