import React from "react";
import { createPortal } from "react-dom";
import { useBulkOffersModal } from "../lib/useBulkOffersModal";
import { getAxisPresetLabel, getAxisPresetValue } from "../lib/presetUtils";

const BulkOffersModal = ({
  isOpen,
  onClose,
  selectableAxes,
  offers,
  setFieldValue,
}) => {
  const {
    bulkOfferSelections,
    toggleBulkOfferSelection,
    bulkCreateCount,
    bulkGeneratedOffers,
    bulkStep,
    handleBulkPriceChange,
    handleBackToSelection,
    handleBulkCreateOffers,
    handleConfirmBulkCreateOffers,
  } = useBulkOffersModal({
    selectableAxes,
    offers,
    isOpen,
    onClose,
    setFieldValue,
  });

  const [bulkPriceValue, setBulkPriceValue] = React.useState("");

  const applyBulkPriceToAllOffers = () => {
    bulkGeneratedOffers.forEach((_, index) => {
      handleBulkPriceChange(index, bulkPriceValue);
    });
  };

  if (!isOpen || typeof document === "undefined") {
    return null;
  }

  const isPricingStep = bulkStep === "pricing";

  return createPortal(
    <>
      <div onClick={onClose} className="bulk-offers-modal__overlay" />
      <div className="bulk-offers-modal__container">
        <button
          type="button"
          onClick={onClose}
          className="bulk-offers-modal__close"
        >
          ×
        </button>

        <h2 className="bulk-offers-modal__title">
          {isPricingStep ? "Ціни для нових варіацій" : "Масове створення"}
        </h2>
        <p className="bulk-offers-modal__subtitle">
          {isPricingStep
            ? "Вкажіть ціну для кожної нової варіації перед додаванням офферів."
            : "Оберіть характеристики, щоб автоматично згенерувати всі можливі комбінації офферів."}
        </p>

        {!isPricingStep &&
          (selectableAxes.length > 0 ? (
            <div className="bulk-offers-modal__axes">
              {selectableAxes.map((axis) => (
                <div key={axis.axisId}>
                  <h3 className="bulk-offers-modal__axis-title">
                    {axis.title?.ua || axis.axisId}
                  </h3>
                  <div className="bulk-offers-modal__axis-grid">
                    {axis.valuesPreset.map((preset) => {
                      const value = getAxisPresetValue(preset);
                      const checked = (
                        bulkOfferSelections[axis.axisId] || []
                      ).includes(value);

                      return (
                        <label
                          key={`${axis.axisId}-${value}`}
                          className="bulk-offers-modal__checkbox"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              toggleBulkOfferSelection(axis.axisId, value)
                            }
                            className="bulk-offers-modal__checkbox-input"
                          />
                          <span className="bulk-offers-modal__checkbox-box" />
                          <span className="bulk-offers-modal__checkbox-text">
                            {getAxisPresetLabel(preset)}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bulk-offers-modal__empty">
              Немає доступних характеристик з готовими значеннями. Спочатку
              оберіть категорію або налаштуйте варіації.
            </div>
          ))}

        {isPricingStep && (
          <>
            <div className="bulk-offers-modal__bulk-price-panel">
              <div className="bulk-offers-modal__bulk-price-header">
                <p className="bulk-offers-modal__bulk-price-title">
                  Ціна для всіх офферів
                </p>
                <p className="bulk-offers-modal__bulk-price-description">
                  Вкажіть одну ціну та застосуйте її до всіх згенерованих варіацій.
                </p>
              </div>
              <div className="bulk-offers-modal__bulk-price-controls">
                <input
                  type="text"
                  value={bulkPriceValue}
                  onChange={(event) => setBulkPriceValue(event.target.value)}
                  placeholder="Вкажіть загальну ціну"
                  className="bulk-offers-modal__price-input bulk-offers-modal__price-input--bulk"
                />
                <button
                  type="button"
                  onClick={applyBulkPriceToAllOffers}
                  disabled={bulkGeneratedOffers.length === 0}
                  className="bulk-offers-modal__confirm bulk-offers-modal__confirm--bulk"
                >
                  Застосувати до всіх
                </button>
              </div>
            </div>

            <div className="bulk-offers-modal__prices">

              {bulkGeneratedOffers.map((offer, index) => (
                <div
                  className="bulk-offers-modal__price-row"
                  key={`${offer.title}-${index}`}
                >
                  <p className="bulk-offers-modal__price-title">{offer.title}</p>
                  <input
                    type="text"
                    value={offer.price}
                    onChange={(event) =>
                      handleBulkPriceChange(index, event.target.value)
                    }
                    placeholder="Вкажіть ціну"
                    className="bulk-offers-modal__price-input"
                  />
                </div>
              ))}
            </div>
          </>
        )}

        <div className="bulk-offers-modal__footer">
          <button
            type="button"
            onClick={isPricingStep ? handleBackToSelection : onClose}
            className="bulk-offers-modal__cancel"
          >
            {isPricingStep ? "Назад" : "Скасувати"}
          </button>
          <div className="bulk-offers-modal__count">
            {isPricingStep ? (
              <>
                ДОДАЄТЬСЯ: <span>{bulkGeneratedOffers.length} ОФФЕРИ</span>
              </>
            ) : (
              <>
                БУДЕ СТВОРЕНО: <span>{bulkCreateCount} ОФФЕРИ</span>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={
              isPricingStep
                ? handleConfirmBulkCreateOffers
                : handleBulkCreateOffers
            }
            disabled={
              isPricingStep
                ? bulkGeneratedOffers.length === 0
                : !selectableAxes.length || bulkCreateCount === 0
            }
            className="bulk-offers-modal__confirm"
          >
            {isPricingStep ? "Створити оффери" : "Створити варіації"}
          </button>
        </div>
      </div>
    </>,
    document.body,
  );
};

export default BulkOffersModal;
