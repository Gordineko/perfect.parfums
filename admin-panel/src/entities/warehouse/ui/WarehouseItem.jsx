import React from 'react';

const buildVariationText = (product) => {
    if (product?.optionKey) {
        return product.optionKey;
    }

    if (Array.isArray(product?.optionValues) && product.optionValues.length > 0) {
        return product.optionValues.map(String).join('|');
    }

    return '';
};

const WarehouseItem = ({ product, isEditMode, drafts, onDraftChange }) => {
    const img = product?.imageURL || "/img/test.png";
    const title = product?.title?.ua || product?.title?.en || "Назва товару";
    const sku = product?.sku || "SKU";
    const optionKey = buildVariationText(product);
    const offerId = product?.offerId;
    const variationOptions = Array.isArray(product?.variation?.options) ? product.variation.options : [];

    const renderQtyField = (warehouse) => {
        if (!warehouse) return <p>0</p>;

        const key = `${offerId}_${warehouse.warehouseId}`;
        const currentValue = drafts[key] !== undefined ? drafts[key].factQty : warehouse.onHand;

        if (isEditMode) {
            return (
                <input
                    type="number"
                    min="0"
                    className="warehouse-edit-input"
                    value={currentValue}
                    onChange={(e) => onDraftChange(offerId, warehouse.warehouseId, e.target.value)}
                    style={{
                        width: '50px',
                        padding: '2px 4px',
                        border: '1px solid var(--color-border-light)',
                        borderRadius: '4px'
                    }}
                />
            );
        }

        return <p>{currentValue}</p>;
    };

    return (
        <div className="warehouse-item warehouse-grid">
            <div className="warehouse-item__data">
                <img src={img} alt='' />
                <div className="warehouse-item__data-txt">
                    <p>{title}</p>
                    <span>SKU: {sku}</span>
                    {variationOptions.length > 0 && (
                        <div className="warehouse-item__variation-list">
                            {variationOptions.map((option) => {
                                const optionTitle = option?.title?.ua || option?.title?.en || option?.axisId || '';
                                const optionValue = option?.label?.ua || option?.label?.en || String(option?.value || '');
                                const unit = option?.unit ? ` ${option.unit}` : '';

                                return (
                                    <span className="warehouse-item__variation-chip" key={option?.axisId || `${optionTitle}-${optionValue}`}>
                                        <b>{optionTitle}</b>
                                        {optionValue}{unit}
                                    </span>
                                );
                            })}
                        </div>
                    )}
                    {variationOptions.length === 0 && optionKey && (
                        <div className="warehouse-item__variation-list">
                            <span className="warehouse-item__variation-chip">
                                <b>Варіація</b>
                                {optionKey}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {product?.warehouses?.map((wh, idx) => (
                <div className="warehouse-item__store" key={idx}>
                    <div className="warehouse-item__store-item">
                        {renderQtyField(wh)}
                    </div>
                    <div className="warehouse-item__store-item">
                        <p>{wh.reserved || 0}</p>
                    </div>
                    <div className="warehouse-item__store-item">
                        <p>{wh.available || 0}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default WarehouseItem;
