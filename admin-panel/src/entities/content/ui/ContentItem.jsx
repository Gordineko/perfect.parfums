import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// Импортируем все клики из твоего файла
import { putchClick, deleteCategoryClick, changeStatusClick } from '../lib/contentClick';

const ContentItem = ({ content }) => {
  const navigate = useNavigate();



  const title = content?.title || "Назва";
  const secondTitle = content?.subtitle || "Інформація";
  const subCategory = content?.btn || "Редагувати";




  return (
    <div className='content-item'>
      <p className='content-item__title'>{title}</p>
      <p className='content-item__subtitle'>{secondTitle}</p>
      <button className='content-item__btn' onClick={() => navigate(content.link)}>{subCategory}</button>

    </div>
  )
}

export default ContentItem;