import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ProductForm from '../../features/product-form/ui/ProductForm';
import { useFetchProductGroup } from '../../pages/product-rewrite/lib/useFetchProductGroup';
import AdminPageLoader from '../../shared/ui/admin-loader/AdminPageLoader';

export default function ProductRewritePage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [isBulkOffersModalOpen, setIsBulkOffersModalOpen] = useState(false);


    const { productGroup, productVariation, isLoading, error, isCreateMode } = useFetchProductGroup(id);

    console.log(productGroup, "productGroup");
    console.log(productVariation, "productVariation");

    return (
        <>
            <section className="section-admin section-form">
                <div className="section-form__header">
                    <h2>{isCreateMode ? 'Додавання товару' : 'Редагування товару'}</h2>
                    <div className="section-form__header-btns">
                         <button
                            type="button"
                            className='btn-groups'
                            onClick={() => setIsBulkOffersModalOpen(true)}
                        ><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 15 15" fill="none">
                            <path d="M7.49465 8.03693C7.40902 8.03693 7.3341 8.0155 7.25917 7.98337L0.301898 4.50186C0.211415 4.458 0.135106 4.38952 0.0817125 4.30426C0.0283189 4.21901 0 4.12042 0 4.0198C0 3.91918 0.0283189 3.8206 0.0817125 3.73534C0.135106 3.65009 0.211415 3.58161 0.301898 3.53775L7.25917 0.0562398C7.40902 -0.0187466 7.59098 -0.0187466 7.74083 0.0562398L14.6981 3.53775C14.7886 3.58161 14.8649 3.65009 14.9183 3.73534C14.9717 3.8206 15 3.91918 15 4.0198C15 4.12042 14.9717 4.21901 14.9183 4.30426C14.8649 4.38952 14.7886 4.458 14.6981 4.50186L7.74083 7.98337C7.6659 8.02622 7.58028 8.03693 7.50535 8.03693H7.49465ZM1.73617 4.0198L7.49465 6.90142L13.2531 4.0198L7.49465 1.13819L1.73617 4.0198Z" fill="#68181F" />
                            <path d="M7.49465 11.5186C7.40902 11.5186 7.3341 11.4972 7.25917 11.465L0.301898 7.98354C0.211415 7.93968 0.135106 7.8712 0.0817125 7.78594C0.0283189 7.70068 0 7.6021 0 7.50148C0 7.40086 0.0283189 7.30228 0.0817125 7.21702C0.135106 7.13176 0.211415 7.06328 0.301898 7.01943L3.78053 5.28403C4.04812 5.15548 4.36923 5.2626 4.49767 5.5197C4.62611 5.78751 4.51908 6.10888 4.26219 6.23743L1.73617 7.50148L7.49465 10.3831L13.2531 7.50148L10.7271 6.23743C10.6637 6.20674 10.6071 6.16358 10.5607 6.11052C10.5143 6.05746 10.4791 5.99559 10.4571 5.92861C10.4351 5.86162 10.4268 5.79089 10.4328 5.72063C10.4387 5.65038 10.4587 5.58204 10.4916 5.5197C10.6201 5.25189 10.9412 5.14477 11.2088 5.28403L14.6874 7.01943C14.7779 7.06328 14.8542 7.13176 14.9076 7.21702C14.961 7.30228 14.9893 7.40086 14.9893 7.50148C14.9893 7.6021 14.961 7.70068 14.9076 7.78594C14.8542 7.8712 14.7779 7.93968 14.6874 7.98354L7.73013 11.465C7.6552 11.5079 7.56957 11.5186 7.49465 11.5186Z" fill="#68181F" />
                            <path d="M7.49465 15.0001C7.40902 15.0001 7.3341 14.9786 7.25917 14.9465L0.301898 11.465C0.211415 11.4211 0.135106 11.3526 0.0817125 11.2674C0.0283189 11.1821 0 11.0835 0 10.9829C0 10.8823 0.0283189 10.7837 0.0817125 10.6985C0.135106 10.6132 0.211415 10.5447 0.301898 10.5009L3.78053 8.76547C4.04812 8.63692 4.36923 8.74405 4.49767 9.00114C4.62611 9.26895 4.51908 9.59032 4.26219 9.71887L1.73617 10.9829L7.49465 13.8645L13.2531 10.9829L10.7271 9.71887C10.6637 9.68818 10.6071 9.64502 10.5607 9.59196C10.5143 9.5389 10.4791 9.47704 10.4571 9.41005C10.4351 9.34306 10.4268 9.27233 10.4328 9.20208C10.4387 9.13182 10.4587 9.06349 10.4916 9.00114C10.6201 8.73334 10.9412 8.62621 11.2088 8.76547L14.6874 10.5009C14.7779 10.5447 14.8542 10.6132 14.9076 10.6985C14.961 10.7837 14.9893 10.8823 14.9893 10.9829C14.9893 11.0835 14.961 11.1821 14.9076 11.2674C14.8542 11.3526 14.7779 11.4211 14.6874 11.465L7.73013 14.9465C7.6552 14.9893 7.56957 15.0001 7.49465 15.0001Z" fill="#68181F" />
                        </svg></button>
                        <button onClick={() => navigate(-1)}>Повернутися</button>
                       
                    </div>
                </div>

                <div className="section-form__content prod">




                    {isLoading && <AdminPageLoader label="Завантаження товару..." />}
                    {error && <p className="error-text">{error}</p>}

                    {!isLoading && !error && (
                        <ProductForm
                            type={id}
                            variationsData={productVariation}
                            initialData={productGroup}
                            isEditMode={!isCreateMode}
                            isBulkOffersModalOpen={isBulkOffersModalOpen}
                            onCloseBulkOffersModal={() => setIsBulkOffersModalOpen(false)}
                        />
                    )}

                </div>
            </section>
            <button form="product-create-form" className="product-form__submit" type="submit" disabled={isLoading}>
                {productGroup ? 'Зберегти' : 'Додати'}
            </button></>

    );
}
