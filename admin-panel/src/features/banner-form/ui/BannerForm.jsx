"use client";

import React, { useEffect, useState } from 'react';
import { useBannerForm } from '../lib/useBannerForm';
import CustomSelect from '../../../shared/ui/select-form/CustomSelect';
import CustomInput from '../../../shared/ui/input-form/CustomInput';
import { generateSlug } from '../lib/generateSlug';
import { uploadAdminImages } from '../../../shared/api/products.services';
import { getAdminCategoriesTree } from '../../../shared/api/categories.services';
import { getStatusOptions } from '../../../shared/lib/statuses';
import toast from '../../../shared/lib/toast';
import { useAutoTranslate } from '../../../shared/lib/useAutoTranslate';
import TranslateButton from '../../../shared/ui/translate-button/TranslateButton';


const BASE_IMG_URL = 'https://worldofheels.com.ua';

const STATUS_OPTIONS = getStatusOptions(['active', 'hidden', 'draft'], { labelType: 'form' });

const BannerForm = ({ type, initialData }) => {
  const formik = useBannerForm(type, initialData);
  const { translateFields, isTranslating } = useAutoTranslate(formik);
  const [isUploadingDesktop, setIsUploadingDesktop] = useState(false);
  const [isUploadingMobile, setIsUploadingMobile] = useState(false);
  const [categoriesTree, setCategoriesTree] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Завантаження категорій
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const data = await getAdminCategoriesTree();
        const formatted = data.items.map(cat => ({
          value: cat._id,
          label: cat.title?.ua || cat.name || 'Без назви'
        }));
        setCategoriesTree(formatted);
      } catch (error) {
        console.error('Помилка завантаження категорій:', error);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  // Автогенерація slug
  useEffect(() => {
    const titleUa = formik.values.title?.ua;
    if (titleUa && !initialData?.slug && type === 'create') {
      const newSlug = generateSlug(titleUa);
      formik.setFieldValue('slug', newSlug);
    } else if (!titleUa && !initialData?.slug && type === 'create') {
      formik.setFieldValue('slug', '');
    }
  }, [formik.values.title?.ua, type, initialData]);

  const handleNestedChange = (field) => (e) => {
    const value = e?.target !== undefined ? e.target.value : e;
    formik.setFieldValue(field, value);
  };

  const handleImageUpload = async (e, targetField) => {
    const file = e.target.files[0];
    if (!file) return;

    const setIsUploading = targetField === 'imageURL' ? setIsUploadingDesktop : setIsUploadingMobile;
    try {
      setIsUploading(true);
      const data = await uploadAdminImages(file);
      const uploadedUrl = data.data?.[0]?.url || data.url || data;
      if (uploadedUrl) {
        formik.setFieldValue(targetField, uploadedUrl);
      } else {
        console.warn('URL не знайдено', data);
        toast.error('Файл завантажено, але бекенд не повернув URL');
      }
    } catch (error) {
      console.error('Помилка завантаження', error);
      toast.error('Помилка при завантаженні зображення');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form id="banner-create-form" onSubmit={formik.handleSubmit} className="banner-create-form">
    

      {/* ========== 1. ЗОБРАЖЕННЯ ========== */}
      <section className="form-section">
        <h2 className="section-title">Зображення</h2>
        <div className="form-row">
          <div className="form-group image-upload-group">
            <label>Десктопне зображення</label>
            <div className="image-upload-container">
              <label className={`image-dropzone ${isUploadingDesktop ? 'uploading' : ''}`}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'imageURL')}
                  disabled={isUploadingDesktop}
                  hidden
                />
                {isUploadingDesktop ? (
                  <div className="upload-state"><span className="spinner">⌛</span> Завантаження...</div>
                ) : (
                  <div className="upload-state"><span className="icon">📁</span><span className="text">Вибрати файл</span></div>
                )}
              </label>
              {formik.values.imageURL && (
                <div className="image-preview-box">
                  <img src={formik.values.imageURL.startsWith('http') ? formik.values.imageURL : `${BASE_IMG_URL}${formik.values.imageURL}`} alt="Desktop preview" />
                </div>
              )}
            </div>
            <CustomInput
              id="imageURL" name="imageURL" label="Або вставте URL вручну"
              value={formik.values.imageURL || ''} onChange={formik.handleChange} onBlur={formik.handleBlur}
              placeholder="https://..." error={formik.errors.imageURL} touched={formik.touched.imageURL}
            />
          </div>

          <div className="form-group image-upload-group">
            <label>Мобільне зображення</label>
            <div className="image-upload-container">
              <label className={`image-dropzone ${isUploadingMobile ? 'uploading' : ''}`}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'mobileImageURL')}
                  disabled={isUploadingMobile}
                  hidden
                />
                {isUploadingMobile ? (
                  <div className="upload-state"><span className="spinner">⌛</span> Завантаження...</div>
                ) : (
                  <div className="upload-state"><span className="icon">📁</span><span className="text">Вибрати файл</span></div>
                )}
              </label>
              {formik.values.mobileImageURL && (
                <div className="image-preview-box">
                  <img src={formik.values.mobileImageURL.startsWith('http') ? formik.values.mobileImageURL : `${BASE_IMG_URL}${formik.values.mobileImageURL}`} alt="Mobile preview" />
                </div>
              )}
            </div>
            <CustomInput
              id="mobileImageURL" name="mobileImageURL" label="Або вставте URL вручну"
              value={formik.values.mobileImageURL || ''} onChange={formik.handleChange} onBlur={formik.handleBlur}
              placeholder="https://..."
            />
          </div>
        </div>
      </section>

      {/* ========== 2. ТЕКСТ ========== */}
      <section className="form-section">
        <h2 className="section-title">Текст</h2>

        <div className="form-translate-bar">
          <TranslateButton
            isLoading={isTranslating}
            onClick={() => translateFields([
              { from: 'title.ua',       to: 'title.en' },
              { from: 'subtitle.ua',    to: 'subtitle.en' },
              { from: 'description.ua', to: 'description.en' },
              { from: 'buttonText.ua',  to: 'buttonText.en' },
            ])}
          />
        </div>

        <div className="form-row">
          <CustomInput id="title.ua" name="title.ua" label="Заголовок (UA)"
            value={formik.values.title?.ua || ''} onChange={handleNestedChange('title.ua')} onBlur={formik.handleBlur}
            placeholder="Заголовок українською" error={formik.errors.title?.ua} touched={formik.touched.title?.ua} />
          <CustomInput id="title.en" name="title.en" label="Заголовок (EN)"
            value={formik.values.title?.en || ''} onChange={handleNestedChange('title.en')} onBlur={formik.handleBlur}
            placeholder="Title in English" />
        </div>
        <div className="form-row">
          <CustomInput id="subtitle.ua" name="subtitle.ua" label="Підзаголовок (UA)"
            value={formik.values.subtitle?.ua || ''} onChange={handleNestedChange('subtitle.ua')} onBlur={formik.handleBlur}
            placeholder="Підзаголовок..." />
          <CustomInput id="subtitle.en" name="subtitle.en" label="Підзаголовок (EN)"
            value={formik.values.subtitle?.en || ''} onChange={handleNestedChange('subtitle.en')} onBlur={formik.handleBlur}
            placeholder="Subtitle..." />
        </div>
        <div className="form-row">
          <CustomInput id="description.ua" name="description.ua" label="Опис (UA)"
            value={formik.values.description?.ua || ''} onChange={handleNestedChange('description.ua')} onBlur={formik.handleBlur}
            placeholder="Короткий опис..." />
          <CustomInput id="description.en" name="description.en" label="Опис (EN)"
            value={formik.values.description?.en || ''} onChange={handleNestedChange('description.en')} onBlur={formik.handleBlur}
            placeholder="Short description..." />
        </div>
        <div className="form-row">
          <CustomInput id="buttonText.ua" name="buttonText.ua" label="Текст кнопки (UA)"
            value={formik.values.buttonText?.ua || ''} onChange={handleNestedChange('buttonText.ua')} onBlur={formik.handleBlur}
            placeholder="Напр., Купити" />
          <CustomInput id="buttonText.en" name="buttonText.en" label="Текст кнопки (EN)"
            value={formik.values.buttonText?.en || ''} onChange={handleNestedChange('buttonText.en')} onBlur={formik.handleBlur}
            placeholder="E.g., Shop Now" />
        </div>
      </section>

      {/* ========== 3. ПОСИЛАННЯ ТА КАТЕГОРІЯ ========== */}
      <section className="form-section">
        <h2 className="section-title">Посилання та категорія</h2>
        <div className="form-row">
          <CustomInput id="link" name="link" label="Посилання при кліку"
            value={formik.values.link || ''} onChange={formik.handleChange} onBlur={formik.handleBlur}
            placeholder="/category/some-slug або https://..." />
          <div className="form-group">
            <label htmlFor="categoryId">Категорія (опціонально)</label>
            <CustomSelect
              options={categoriesTree}
              value={formik.values.categoryId || ''}
              onChange={(value) => formik.setFieldValue('categoryId', value)}
              placeholder={loadingCategories ? 'Завантаження...' : 'Виберіть категорію'}
              isDisabled={loadingCategories}
            />
          </div>
        </div>
      </section>

      {/* ========== 4. НАЛАШТУВАННЯ ТА ДАТИ ========== */}
      <section className="form-section">
        <h2 className="section-title">Налаштування та дати</h2>
        <div className="form-row">
          <CustomInput id="slug" name="slug" label="Slug банера"
            value={formik.values.slug || ''} onChange={formik.handleChange} onBlur={formik.handleBlur}
            placeholder="banner-slug" error={formik.errors.slug} touched={formik.touched.slug} />
          <div className="form-group">
            <label htmlFor="status">Статус</label>
            <CustomSelect
              options={STATUS_OPTIONS}
              value={formik.values.status}
              onChange={(value) => formik.setFieldValue('status', value)}
              onBlur={formik.handleBlur}
              name="status"
              id="status"
              error={formik.errors.status}
              touched={formik.touched.status}
              placeholder="Виберіть статус"
            />
          </div>
        </div>
        <div className="form-row">
          <CustomInput id="position" name="position" label="Позиція (сортування)" type="number"
            value={formik.values.position} onChange={formik.handleChange} onBlur={formik.handleBlur}
            error={formik.errors.position} touched={formik.touched.position} />
          <div className="form-group color-group">
            <label>Колір фону (HEX)</label>
            <div className="color-input-wrapper">
              <input type="color" name="backgroundColor" value={formik.values.backgroundColor || '#ffffff'}
                onChange={formik.handleChange} className="color-preview" />
              <CustomInput id="backgroundColor" name="backgroundColor" value={formik.values.backgroundColor || '#ffffff'}
                onChange={formik.handleChange} placeholder="#ffffff" />
            </div>
          </div>
          <div className="form-group color-group">
            <label>Колір тексту (HEX)</label>
            <div className="color-input-wrapper">
              <input type="color" name="textColor" value={formik.values.textColor || '#000000'}
                onChange={formik.handleChange} className="color-preview" />
              <CustomInput id="textColor" name="textColor" value={formik.values.textColor || '#000000'}
                onChange={formik.handleChange} placeholder="#000000" />
            </div>
          </div>
        </div>
        <div className="form-row">
          <CustomInput id="startsAt" name="startsAt" label="Початок показу" type="datetime-local"
            value={formik.values.startsAt || ''} onChange={formik.handleChange} onBlur={formik.handleBlur} />
          <CustomInput id="endsAt" name="endsAt" label="Кінець показу" type="datetime-local"
            value={formik.values.endsAt || ''} onChange={formik.handleChange} onBlur={formik.handleBlur} />
        </div>
      </section>
        {/* === ДЕБАГ: ПОМИЛКИ ФОРМИ === */}
        {Object.keys(formik.errors).length > 0 && (
            <div style={{ marginTop: '24px', padding: '16px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px' }}>
                <strong style={{ color: '#DC2626', fontSize: '13px' }}>Помилки форми (чому не зберігається):</strong>
                <pre style={{ marginTop: '8px', fontSize: '12px', color: '#7F1D1D', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {JSON.stringify(formik.errors, null, 2)}
                </pre>
            </div>
        )}

    </form>
  );
};

export default BannerForm;