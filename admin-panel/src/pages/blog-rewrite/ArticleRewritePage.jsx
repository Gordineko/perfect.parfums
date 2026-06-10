import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFetchArticle } from './lib/useFetchArticle'; 
import ArticleForm from '../../features/blog-form/ui/ArticleForm';

export default function ArticleRewritePage() {
    const navigate = useNavigate();
    const { id: articlePath } = useParams();
   
    const { article, isLoading, error, isCreateMode } = useFetchArticle(articlePath);

    return (
        <>
            <section className="section-admin section-form">
                <div className="section-form__header">
                    <h2>{isCreateMode ? 'Додавання статті' : 'Редагування статті'}</h2>
                    <button onClick={() => navigate(-1)}>Повернутися</button>
                </div>

                <div className="section-form__content">
                    {isLoading && <p>Завантаження...</p>}
                    {error && <p className="error-text">{error}</p>}

                    {!isLoading && !error && (
                        <ArticleForm
                            type={articlePath}
                            initialData={article}
                            isEditMode={!isCreateMode}
                        />
                    )}
                </div>
            </section>

            <button form="article-create-form" className="product-form__submit" type="submit">
                {article ? 'Зберегти' : 'Додати'}
            </button>
        </>
    );
}