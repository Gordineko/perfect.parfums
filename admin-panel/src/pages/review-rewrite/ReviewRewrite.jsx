import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReviewForm from '../../features/review-form/ui/ReviewForm';
import { useFetchReview } from './lib/useFetchReview';

export default function ReviewRewritePage() {
    const navigate = useNavigate();
    const { id: reviewId } = useParams();

    const { review, isLoading, error, isCreateMode } = useFetchReview(reviewId);

    return (
        <>
            <section className="section-admin section-form">
                <div className="section-form__header">
                    <h2>{isCreateMode ? 'Додавання відгуку' : 'Редагування відгуку'}</h2>
                    <button onClick={() => navigate('/reviews')}>Повернутися</button>
                </div>

                <div className="section-form__content">
                    {isLoading && <p>Завантаження...</p>}
                    {error && <p className="error-text">{error}</p>}

                    {!isLoading && !error && (
                        <ReviewForm
                            type={reviewId}
                            initialData={review}
                            isEditMode={!isCreateMode}
                        />
                    )}
                </div>
            </section>

            <button form="review-create-form" className="product-form__submit" type="submit">
                {review ? 'Зберегти' : 'Додати'}
            </button>
        </>
    );
}
