import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import CustomInput from '../../../shared/ui/input-form/CustomInput';
import { getAdminInventory } from '../../../shared/api/warehouse.services';

const ReviewProductSelectionModal = ({ isOpen, onClose, onSelect }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [offers, setOffers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        return () => setIsMounted(false);
    }, []);

    useEffect(() => {
        if (!isOpen) return;

        const fetchOffers = async () => {
            setIsLoading(true);
            try {
                const params = { limit: 20 };
                if (searchQuery.trim()) {
                    params.q = searchQuery.trim();
                }

                const response = await getAdminInventory(params);
                setOffers(response?.items || []);
            } catch (error) {
                console.error('Помилка завантаження варіацій:', error);
                setOffers([]);
            } finally {
                setIsLoading(false);
            }
        };

        const timeoutId = setTimeout(fetchOffers, 300);
        return () => clearTimeout(timeoutId);
    }, [isOpen, searchQuery]);

    if (!isOpen || !isMounted) return null;

    return createPortal(
        <div className="product-modal-overlay" onClick={onClose}>
            <div className="product-modal" onClick={(e) => e.stopPropagation()}>
                <div className="product-modal__header">
                    <h3>Оберіть товар для відгуку</h3>
                    <button type="button" onClick={onClose} className="product-modal__close-btn">&times;</button>
                </div>

                <div className="product-modal__body">
                    <CustomInput
                        id="review-product-search"
                        name="search"
                        label="Пошук за артикулом (SKU)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />

                    <div className="product-modal__list">
                        {isLoading ? (
                            <p className="product-modal__empty">Завантаження...</p>
                        ) : offers.length > 0 ? (
                            offers.map((offer) => {
                                if (!offer) return null;

                                const offerId = String(offer.offerId || '');
                                if (!offerId) return null;

                                const groupId = String(
                                    offer.groupId ||
                                    offer.productGroupId ||
                                    offer.productId ||
                                    offer.catalogGroupId ||
                                    offer.offerGroupId ||
                                    ''
                                );
                                const title = offer.title?.ua || offer.title?.en || 'Без назви';
                                const sku = offer.sku || 'Немає';
                                const img = offer.imageURL || 'https://via.placeholder.com/56';
                                const price = Number(offer.price || 0);
                                const available = Number(offer.available || 0);

                                return (
                                    <div key={offerId} className="product-modal__item">
                                        <img src={img} alt="product" className="product-modal__img" />
                                        <div className="product-modal__info">
                                            <strong>{title}</strong>
                                            <span className="product-modal__sku">SKU: {sku}</span>
                                            <span className="product-modal__price">Ціна: {price} грн</span>
                                            <span className="product-modal__sku">Доступно: {available} шт.</span>
                                        </div>
                                        <button
                                            type="button"
                                            className="product-modal__add-btn submit-button"
                                            onClick={() => onSelect({
                                                _id: groupId || offerId,
                                                offerId,
                                                groupId,
                                                title,
                                                sku,
                                                img,
                                            })}
                                        >
                                            Додати
                                        </button>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="product-modal__empty">Варіації не знайдені</p>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ReviewProductSelectionModal;
