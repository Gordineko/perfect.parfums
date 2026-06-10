import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import BannerForm from '../../features/banner-form/ui/BannerForm';
import { useFetchBanner } from '../banner-rewrite/lib/useFetchBanner';

export default function BannerRewritePage() {
    const navigate = useNavigate();
    const { id: bannerId } = useParams();
   
    const { banner, isLoading, error, isCreateMode } = useFetchBanner(bannerId);

    console.log(banner, "banner data");

    return (
        <>
            <section className="section-admin section-form">
                <div className="section-form__header">
                    <h2>{isCreateMode ? 'Додавання банера' : 'Редагування банера'}</h2>
                    <button onClick={() => navigate(-1)}>Повернутися</button>
                </div>

                <div className="section-form__content">
                    {isLoading && <p>Завантаження...</p>}
                    {error && <p className="error-text">{error}</p>}

                    {!isLoading && !error && (
                        <BannerForm
                            type={isCreateMode ? 'create' : 'edit'}
                            initialData={banner}
                            isEditMode={!isCreateMode}
                        />
                    )}
                </div>
            </section>

            <button form="banner-create-form" className="product-form__submit" type="submit">
                {banner ? 'Зберегти' : 'Додати'}
            </button>
        </>
    );
}