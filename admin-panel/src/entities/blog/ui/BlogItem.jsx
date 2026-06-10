import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// Імпортуємо правильні функції
import { putchClick, deleteBlogClick, changeStatusClick } from '../lib/blogsClick';

const BlogItem = ({ blog }) => {
  const navigate = useNavigate();

  // Використовуємо локальний стан для миттєвого оновлення UI
  const [isPublished, setIsPublished] = useState(blog?.isPublished || false);
  const [isDeleted, setIsDeleted] = useState(false);

  // Якщо статтю видалили, просто нічого не рендеримо
  if (isDeleted) return null;

  const title = blog?.title?.ua || "Назва відсутня";
  const secondTitle = blog?.title?.en || "No title";
  const statusText = isPublished ? "Показується" : "Приховано";

  // Обробник видалення
  const handleDelete = () => {
    // Передаємо _id статті та колбек, який змінить isDeleted на true
    deleteBlogClick(blog._id, () => setIsDeleted(true));
  };

  // Обробник Показати/Приховати
  const handleToggleStatus = () => {
    const newStatus = !isPublished; // Змінюємо на протилежне значення
    // Можна передавати blog._id або blog.slug
    changeStatusClick(blog._id, newStatus, () => setIsPublished(newStatus));
  };

  return (
    <div className='blog-item blogs-grid'>
      <div className="blog-item__txt">
        <p>{title}</p>
      </div>
      <div className="blog-item__txt">
        <p>{secondTitle}</p>
      </div>
      <div className={`blog-item__status ${isPublished ? "" : "hidden"}`}>
        <p>{statusText}</p>
      </div>
      
      <div className="blog-item__func">
        <button
          type="button"
          className='func-rewrite'
          onClick={() => putchClick(blog.slug, navigate)}
        >
          Редагувати
        </button>

        {/* Кнопка Показати / Приховати */}
        <button
          type="button"
          // Можеш додати свої класи для стилізації, наприклад func-hide / func-show
          className={isPublished ? 'func-hide' : 'func-show'} 
          onClick={handleToggleStatus}
        >
          {isPublished ? "Приховати" : "Показати"}
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
}

export default BlogItem;