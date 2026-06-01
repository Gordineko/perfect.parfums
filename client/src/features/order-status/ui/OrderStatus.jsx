
"use client"
import { fetchCartFromDB, formatPrice, removeFromCartAsync } from '@shared'
import { useI18n } from '@shared/i18n/use-i18n'
import { cartLineVariantSummary } from '@shared/lib/cartLineVariantSummary'
import { getOfferUnitPrice } from '@shared/lib/offerPrice'
import { pickLocalizedString } from '@shared/lib/pickLocalized'
import Image from 'next/image';
import { useParams } from 'next/navigation';
import React, { useEffect } from 'react'
import { useDispatch } from 'react-redux';
import { useSelector } from 'react-redux';

import OrderStatusSkeleton from './OrderStatusSkeleton';

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
    const formatPriceNbsp = (value) =>
      String(formatPrice(value)).replace(/\s/g, "\u00A0");

    const isCartLoading = cart.status === "loading" || cart.status === "idle";
    const skeletonItemCount = cart.items?.length ?? 0;

    if (isCartLoading) {
        return <OrderStatusSkeleton itemCount={skeletonItemCount} />;
    }

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
                    const id =
                      prod?._id ?? prod?.id ?? prod?.offers?.[0]?._id

                    return (
                    <div className='order__status__item' key={prod?._id ?? prod?.id ?? index}>
                        <Image
                          src={prod.imageURL}
                          alt={pickLocalizedString(prod?.title, locale) ?? ""}
                          width={120}
                          height={120}
                        />
                        <div className="order__status__wrapper">
                            <div className="order__status__meta">
                                <p className="order__status__item-title">
                                  {pickLocalizedString(prod?.title, locale)}
                                </p>
                                {variantLine ? (
                                    <p className="order__status__item-variant">{variantLine}</p>
                                ) : null}
                                <p className="order__status__item-total">
                                  {qty} × {formatPriceNbsp(Number.isFinite(unit) ? unit : 0)} ₴
                                </p>

                                <p className="order__status__item-cost">
                                  {formatPriceNbsp(lineTotal)} ₴
                                </p>
                            </div>
                            <div className="order__status__aside">
                              <button
                                type="button"
                                className="order__status__remove"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!id) return;
                                  dispatch(removeFromCartAsync({ _id: id }));
                                }}
                                aria-label={t("basket.removeItem")}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="14" viewBox="0 0 13 14" fill="none">
                                  <path d="M1 0.510742L12.4892 12.5106" stroke="#11110F" strokeLinecap="round"/>
                                  <path d="M0.488281 12.5107L11.9774 0.510848" stroke="#11110F" strokeLinecap="round"/>
                                </svg>
                              </button>
                            </div>
                        </div>
                    </div>
                    )
                })}
            </div>
            <div className="order__status__data">
              <div className='order__status__data-wrapper'>
                  <p className='final'>{t("order-status.all-cost")}</p>
                  <p className='final-cost'>{formatPriceNbsp(cart.total)} грн</p>
              </div>
            </div>
        </div>
    )
}

export default OrderStatus
