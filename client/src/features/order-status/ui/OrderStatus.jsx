
"use client"
import { fetchCartFromDB, formatPrice } from '@shared'
import { useI18n } from '@shared/i18n/use-i18n'
import { cartLineVariantSummary } from '@shared/lib/cartLineVariantSummary'
import { getOfferUnitPrice } from '@shared/lib/offerPrice'
import { pickLocalizedString } from '@shared/lib/pickLocalized'
import Image from 'next/image';
import { useParams } from 'next/navigation';
import React, { useEffect } from 'react'
import { useDispatch } from 'react-redux';
import { useSelector } from 'react-redux';

const OrderStatus = ({ formik }) => {
    const params = useParams();
    const locale = params?.locale ?? "ua";
    const cart = useSelector((state) => state.cart);
    const dispatch = useDispatch();

    useEffect(() => {
        if (cart.status === "idle") {
            dispatch(fetchCartFromDB());
        }
    }, [cart.status, dispatch]);

    const { t } = useI18n()

    return (
        <div className='order__status'>
            <p className='order__status__title'>{t("order-status.title")}</p>
            <div className="order__status__list">
                {cart.items.map((prod, index) => {
                    const offer = prod?.offers?.[0]
                    const unit = getOfferUnitPrice(offer)
                    const qty = prod?.quantityInCart ?? 1
                    const lineTotal = Number.isFinite(unit) ? unit * qty : 0
                    const variantLine = cartLineVariantSummary(prod, locale)

                    return (
                    <div className='order__status__item' key={prod?._id ?? prod?.id ?? index}>
                        <Image src={prod.imageURL} alt='' width={88} height={88} />
                        <div className="order__status__wrapper">
                            <div className="order__status__meta">
                                <p className="order__status__item-title">
                                  {pickLocalizedString(prod?.title, locale)}
                                </p>
                                {variantLine ? (
                                    <p className="order__status__item-variant">{variantLine}</p>
                                ) : null}
                                <p className="order__status__item-total">
                                    {qty} × {formatPrice(Number.isFinite(unit) ? unit : 0)} ₴
                                </p>
                            </div>
                            <p className="order__status__item-cost">{formatPrice(lineTotal)} ₴</p>
                        </div>
                    </div>
                    )
                })}
            </div>
            <div className="order__status__data">
                <div className='order__status__data-wrapper'>
                    <p>{t("order-status.sum")}</p>
                    <p>{formatPrice(cart.total)} ₴</p>
                </div>
                <div className='order__status__data-wrapper'>
                    <p>{t("order-status.delivery")}</p>
                    <p className='stat-delivery'>{t("order-status.delivery-ststus")}</p>
                </div>
                <div className='order__status__data-wrapper'>
                    <p className='final'>{t("order-status.all-cost")}</p>
                    <p className='final-cost'>{formatPrice(cart.total)} ₴</p>
                </div>
            </div>
            {formik?.status?.submitError ? (
                <div className="error-text" role="alert" aria-live="polite">
                    {formik.status.submitError}
                </div>
            ) : null}
            <button
                form='prof-checkout-form'
                type='submit'
                className="order__status__btn"
                disabled={Boolean(formik?.isSubmitting)}
                aria-busy={Boolean(formik?.isSubmitting)}
            >
                {formik?.isSubmitting ? `${t("order-status.btn")}...` : t("order-status.btn")}
            </button>
        </div>
    )
}

export default OrderStatus
