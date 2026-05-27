"use client";

import { ProductPrice } from "@entities/product";
import CartButton from "@features/cart-buttons/ui/CartButton";
import { useI18n } from "@shared";
import { formatPriceDigits } from "@shared/lib/formatPrice";
import {
  getOfferCrossPrice,
  getOfferUnitPrice,
} from "@shared/lib/offerPrice";
import { pickLocalizedString } from "@shared/lib/pickLocalized";
import {
  colorPresetValueToHex,
  isPdpColorSwatchAxis,
} from "@widgets/product-info/lib/colorSwatchAxis";
import {
  axisOptionHasPurchasableOffer,
  buildOptionKey,
  collectGallerySlides,
  getActiveOffer,
  getAxisOptionLabel,
  isSelectionCompleteForAxes,
  offerIsPurchasable,
  repairSelectionToPurchasableOffer,
  resolveSelectionAfterAxisChange,
  stringifyOptionPart,
  valuesForAxis,
} from "@widgets/product-info/lib/pdpVariations";
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";

import {
  PDP_USE_API_VARIATIONS,
  resolvePdpMetaRows,
} from "../lib/pdpStubMeta";
import {
  formatStubVolumeLabel,
  isVolumeAxis,
  PDP_STUB_VOLUME_DEFAULT_ML,
  PDP_STUB_VOLUME_OPTIONS_ML,
  productHasVolumeAxis,
  resolvePdpArticleSku,
  resolvePdpDisplayPrices,
} from "../lib/pdpStubVolume";
import PdpProductMetaSpecs from "./PdpProductMetaSpecs";
import { buildAccessoryCartLines } from "../lib/resolveAccessoryCartLines";
import ProductInfoAccessoriesSection from "./ProductInfoAccessoriesSection";
import ProductInfoSizeChartDialog from "./ProductInfoSizeChartDialog";
import PdpWishlistAction from "./PdpWishlistAction";

function trimStr(v) {
  if (v == null) return "";
  const s = String(v).trim();
  return s;
}

function num(v) {
  if (v == null || v === "") return NaN;
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

const ProductInfo = ({
  product,
  locale: localeProp,
  productTitle = "",
  categoryLabel,
  onGallerySlidesChange,
  onActiveOfferChange,
}) => {
  const locale = localeProp ?? "ua";
  const { t } = useI18n();
  const axes = product?.variationAxes ?? [];
  const offers = product?.offers ?? [];

  const [quantity, setQuantity] = useState(1);
  const [stubVolumeMl, setStubVolumeMl] = useState(
    PDP_STUB_VOLUME_DEFAULT_ML,
  );
  const [selectedByAxisId, setSelectedByAxisId] = useState(() => ({}));
  const [isSizeChartOpen, setIsSizeChartOpen] = useState(false);

  const hasApiVolumeAxis = useMemo(
    () => productHasVolumeAxis(axes, locale),
    [axes, locale],
  );
  const useStubVolumeSelect =
    !PDP_USE_API_VARIATIONS || !hasApiVolumeAxis;

  const [selectedAccessoryIds, setSelectedAccessoryIds] = useState(() => {
    const list = product?.accessories ?? [];
    return new Set(
      list
        .filter((a) => a?.selectedByDefault)
        .map((a) => a?.productGroupId)
        .filter(Boolean)
        .map((id) => String(id)),
    );
  });

  useEffect(() => {
    setSelectedByAxisId({});
    setQuantity(1);
    setStubVolumeMl(PDP_STUB_VOLUME_DEFAULT_ML);
    const acc = product?.accessories ?? [];
    setSelectedAccessoryIds(
      new Set(
        acc
          .filter((a) => a?.selectedByDefault)
          .map((a) => a?.productGroupId)
          .filter(Boolean)
          .map((id) => String(id)),
      ),
    );
  }, [product?._id, product?.id, product?.slug]);

  const selectionKey = useMemo(
    () => buildOptionKey(axes, selectedByAxisId, product),
    [axes, selectedByAxisId, product],
  );

  const activeOffer = useMemo(
    () => getActiveOffer(product, selectedByAxisId),
    [product, selectedByAxisId, selectionKey],
  );

  useLayoutEffect(() => {
    if (!axes.length || !offers.length) return;
    if (!isSelectionCompleteForAxes(axes, selectedByAxisId)) return;
    const o = getActiveOffer(product, selectedByAxisId);
    if (o && offerIsPurchasable(o)) return;
    const fixed = repairSelectionToPurchasableOffer(product, selectedByAxisId);
    const unchanged = axes.every((ax) => {
      const id = ax?.axisId;
      if (id == null) return true;
      return (
        stringifyOptionPart(fixed[id]) ===
        stringifyOptionPart(selectedByAxisId[id])
      );
    });
    if (!unchanged) setSelectedByAxisId(fixed);
  }, [product, axes, offers.length, selectedByAxisId, selectionKey]);

  useEffect(() => {
    if (!onGallerySlidesChange) return;
    onGallerySlidesChange(
      collectGallerySlides(activeOffer, product, locale),
    );
  }, [activeOffer, product, locale, onGallerySlidesChange]);

  useEffect(() => {
    onActiveOfferChange?.(activeOffer ?? null);
  }, [activeOffer, onActiveOfferChange]);

  const pricing = product?.pricing;
  const hasActiveSku = Boolean(activeOffer);

  const hasNumericPrice = useMemo(() => {
    if (hasActiveSku) {
      const u = getOfferUnitPrice(activeOffer);
      if (Number.isFinite(u)) return true;
    }
    return (
      Number.isFinite(num(pricing?.min)) ||
      Number.isFinite(num(pricing?.max))
    );
  }, [activeOffer, hasActiveSku, pricing?.min, pricing?.max]);

  const currentPrice = useMemo(() => {
    if (hasActiveSku) {
      const u = getOfferUnitPrice(activeOffer);
      if (Number.isFinite(u)) return u;
    }
    const mn = num(pricing?.min);
    if (Number.isFinite(mn)) return mn;
    return 0;
  }, [activeOffer, hasActiveSku, pricing?.min]);

  const oldPriceFromApi = useMemo(() => {
    if (hasActiveSku) {
      const cross = getOfferCrossPrice(activeOffer);
      return cross != null ? cross : null;
    }
    const mn = num(pricing?.min);
    const mx = num(pricing?.max);
    if (Number.isFinite(mn) && Number.isFinite(mx) && mx !== mn) return mx;
    return null;
  }, [activeOffer, hasActiveSku, pricing?.max, pricing?.min]);

  const { current: displayCurrentPrice, old: displayOldPrice } =
    useMemo(
      () =>
        resolvePdpDisplayPrices({
          hasNumericPrice,
          currentPrice,
          oldPriceFromApi,
        }),
      [hasNumericPrice, currentPrice, oldPriceFromApi],
    );

  const showPdpPrices =
    hasNumericPrice ||
    (displayCurrentPrice > 0 && displayOldPrice > 0);

  const currency = pricing?.currency ?? "UAH";

  const displayArticleSku = useMemo(
    () => resolvePdpArticleSku(product, activeOffer),
    [activeOffer, product],
  );

  const inStock = Boolean(
    activeOffer && offerIsPurchasable(activeOffer),
  );

  const volumeMultiplier = useStubVolumeSelect ? stubVolumeMl : 1;

  const lineTotal = useMemo(() => {
    if (!showPdpPrices) return null;
    return displayCurrentPrice * quantity * volumeMultiplier;
  }, [
    displayCurrentPrice,
    quantity,
    showPdpPrices,
    volumeMultiplier,
  ]);

  const lineTotalOld = useMemo(() => {
    if (
      displayOldPrice == null ||
      !Number.isFinite(displayOldPrice) ||
      displayOldPrice === displayCurrentPrice
    ) {
      return null;
    }
    return displayOldPrice * quantity * volumeMultiplier;
  }, [
    displayCurrentPrice,
    displayOldPrice,
    quantity,
    volumeMultiplier,
  ]);

  const isUnavailable =
    (Boolean(activeOffer) && !offerIsPurchasable(activeOffer)) ||
    (offers.length > 0 &&
      axes.length > 0 &&
      isSelectionCompleteForAxes(axes, selectedByAxisId) &&
      !activeOffer);

  const onHandRaw =
    activeOffer?.stocks?.[0]?.onHand ?? activeOffer?.quantity;
  const maxQty =
    typeof onHandRaw === "number" && onHandRaw > 0 ? onHandRaw : undefined;

  const handleAxisPick = useCallback(
    (axisIndex, value) => {
      setSelectedByAxisId((prev) =>
        resolveSelectionAfterAxisChange(
          product,
          prev,
          axisIndex,
          value,
        ),
      );
    },
    [product],
  );

  const metaSpecRows = useMemo(
    () =>
      resolvePdpMetaRows(product, locale, {
        gender: t("pdp.meta.gender"),
        brand: t("pdp.meta.brand"),
        fragranceGroup: t("pdp.meta.fragranceGroup"),
      }),
    [locale, product, t],
  );

  const accessories = Array.isArray(product?.accessories)
    ? product.accessories
    : [];

  const toggleAccessory = (id) => {
    if (!id) return;
    const key = String(id);
    setSelectedAccessoryIds((prev) => {
      const next = new Set(prev);
      if ([...next].some((x) => String(x) === key)) {
        for (const x of next) {
          if (String(x) === key) next.delete(x);
        }
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const getCompanionCartItems = useCallback(
    () =>
      buildAccessoryCartLines({
        accessories: product?.accessories ?? [],
        selectedAccessoryIds,
        quantity,
        mainOfferId: activeOffer?._id,
        currency,
      }),
    [
      product?.accessories,
      selectedAccessoryIds,
      quantity,
      activeOffer?._id,
      currency,
    ],
  );

  const sizeChart = product?.sizeChart;

  const renderVariationAxis = (axis, axisIndex) => {
    const axisId = axis?.axisId;
    const title =
      axis?.title?.[locale] ??
      axis?.title?.ua ??
      axis?.title?.uk ??
      axis?.title?.en ??
      axisId ??
      "";
    const options = valuesForAxis(
      product,
      axisIndex,
      selectedByAxisId,
      "display",
    );
    const current =
      axisId != null ? selectedByAxisId?.[axisId] : undefined;
    const titleLc = String(title).toLowerCase();
    const showSizeChart =
      Boolean(sizeChart?.imageUrl) &&
      (titleLc.includes("розмір") ||
        titleLc.includes("size") ||
        titleLc.includes("розм") ||
        titleLc.includes("стельк"));
    const useColorSwatches = isPdpColorSwatchAxis(axis);
    const useVolumeSelect = isVolumeAxis(axis, locale);

    return (
      <div
        key={axisId ?? axisIndex}
        className={`pdp-info__option pdp-info__option--axis${useColorSwatches ? " pdp-info__option--color" : ""}${useVolumeSelect ? " pdp-info__option--volume" : ""}`}
      >
        <div className="pdp-info__option-head pdp-info__option-head--between">
          <p className="pdp-info__option-title">
            {useVolumeSelect ? t("pdp.chooseVolume") : title}
          </p>
          {showSizeChart ? (
            <button
              type="button"
              className="pdp-info__size-chart"
              onClick={() => setIsSizeChartOpen(true)}
            >
              {(
                pickLocalizedString(sizeChart?.title, locale) ||
                t("pdp.sizeChartTitle")
              ).toUpperCase()}
            </button>
          ) : null}
        </div>
        {useVolumeSelect ? (
          <select
            className="pdp-info__volume-select"
            aria-label={t("pdp.chooseVolume")}
            value={current != null ? stringifyOptionPart(current) : ""}
            onChange={(e) => {
              const raw = e.target.value;
              const match = options.find(
                (opt) => stringifyOptionPart(opt) === raw,
              );
              if (match !== undefined) {
                handleAxisPick(axisIndex, match);
              }
            }}
          >
            {options.map((opt) => {
              const optionLabel = getAxisOptionLabel(axis, opt, locale);
              const selectable = axisOptionHasPurchasableOffer(
                product,
                axisIndex,
                opt,
                selectedByAxisId,
              );
              return (
                <option
                  key={`${axisId}-${stringifyOptionPart(opt)}`}
                  value={stringifyOptionPart(opt)}
                  disabled={!selectable}
                >
                  {optionLabel}
                </option>
              );
            })}
          </select>
        ) : (
          <div
            className={`pdp-info__chips${useColorSwatches ? " pdp-info__chips--color-swatches" : ""}`}
            role="list"
            aria-label={title}
          >
            {options.map((opt) => {
              const active =
                String(opt) === String(current) ||
                (typeof opt === "number" &&
                  typeof current === "number" &&
                  opt === current);
              const selectable = axisOptionHasPurchasableOffer(
                product,
                axisIndex,
                opt,
                selectedByAxisId,
              );
              const optionLabel = getAxisOptionLabel(axis, opt, locale);

              if (useColorSwatches) {
                const hex = colorPresetValueToHex(opt);
                const isWhite =
                  String(opt).toLowerCase().trim() === "white";
                return (
                  <button
                    key={`${axisId}-${stringifyOptionPart(opt)}`}
                    type="button"
                    role="listitem"
                    className={`pdp-info__color-swatch${isWhite ? " pdp-info__color-swatch--white" : ""}${active ? " is-active" : ""}${!selectable ? " is-disabled" : ""}`}
                    style={
                      hex
                        ? { backgroundColor: hex }
                        : { backgroundColor: "#bdbdbd" }
                    }
                    aria-label={optionLabel}
                    aria-pressed={active ? "true" : "false"}
                    disabled={!selectable}
                    onClick={() => handleAxisPick(axisIndex, opt)}
                  />
                );
              }

              return (
                <button
                  key={`${axisId}-${stringifyOptionPart(opt)}`}
                  type="button"
                  role="listitem"
                  className={`pdp-info__chip${active ? " is-active" : ""}${!selectable ? " is-disabled" : ""}`}
                  aria-pressed={active ? "true" : "false"}
                  disabled={!selectable}
                  onClick={() => handleAxisPick(axisIndex, opt)}
                >
                  {optionLabel}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const hasNonVolumeAxes = axes.some(
    (axis) => !isVolumeAxis(axis, locale),
  );

  return (
    <div className="pdp-info">
      <div className="pdp-info__head">
        <h1 className="pdp-info__title">{productTitle}</h1>
        <p
          className={`pdp-info__stock${inStock ? " pdp-info__stock--in" : " pdp-info__stock--out"}`}
        >
          {inStock ? t("pdp.inStock") : t("pdp.outOfStock")}
        </p>
      </div>

      <p className="pdp-info__article">
        <span className="pdp-info__article-label">
          {t("pdp.articleLabel")}
        </span>{" "}
        <span className="pdp-info__article-value">
          {displayArticleSku.value}
        </span>
      </p>

      <div className="pdp-info__meta-divider" aria-hidden="true" />

      <div className="pdp-info__price-row">
        {showPdpPrices ? (
          <ProductPrice
            variant="pdp"
            price={{
              min: displayCurrentPrice,
              old: displayOldPrice,
              currency,
            }}
            isBasket={false}
            showCurrent={true}
            showOld={true}
          />
        ) : (
          <p className="pdp-info__price-on-request">Ціна за запитом</p>
        )}
      </div>

      <div className="pdp-info__purchase-panel">
        {useStubVolumeSelect ? (
          <div className="pdp-info__option pdp-info__option--volume pdp-info__option--volume-stub">
            <p className="pdp-info__option-title">{t("pdp.chooseVolume")}</p>
            <select
              className="pdp-info__volume-select"
              aria-label={t("pdp.chooseVolume")}
              value={String(stubVolumeMl)}
              onChange={(e) => {
                const next = Number(e.target.value);
                if (Number.isFinite(next) && next > 0) {
                  setStubVolumeMl(next);
                }
              }}
            >
              {PDP_STUB_VOLUME_OPTIONS_ML.map((ml) => (
                <option key={ml} value={String(ml)}>
                  {formatStubVolumeLabel(ml, locale)}
                </option>
              ))}
            </select>
          </div>
        ) : (
          PDP_USE_API_VARIATIONS
            ? axes.map((axis, axisIndex) =>
                isVolumeAxis(axis, locale)
                  ? renderVariationAxis(axis, axisIndex)
                  : null,
              )
            : null
        )}

        {showPdpPrices && lineTotal != null ? (
          <div className="pdp-info__total-row">
            <span className="pdp-info__total-label">{t("pdp.totalLabel")}</span>
            <span className="pdp-info__total-prices">
              <span className="pdp-info__total-value">
                {formatPriceDigits(lineTotal)} {t("currency.uah")}
              </span>
              {lineTotalOld != null && lineTotalOld !== lineTotal ? (
                <span className="pdp-info__total-old">
                  {formatPriceDigits(lineTotalOld)} {t("currency.uah")}
                </span>
              ) : null}
            </span>
          </div>
        ) : null}
      </div>

      <div className="pdp-info__buy">
        <CartButton
          product={product}
          activeOffer={activeOffer}
          location="prod-page"
          isQuantity={quantity}
          style="pdp-info__add-to-cart"
          getCompanionCartItems={getCompanionCartItems}
        />
        <PdpWishlistAction product={product} />
      </div>

      <PdpProductMetaSpecs rows={metaSpecRows} />

      {PDP_USE_API_VARIATIONS && hasNonVolumeAxes ? (
        <div className="pdp-info__options">
          {axes.map((axis, axisIndex) =>
            isVolumeAxis(axis, locale)
              ? null
              : renderVariationAxis(axis, axisIndex),
          )}
        </div>
      ) : null}

      {accessories.length > 0 ? (
        <ProductInfoAccessoriesSection
          accessories={accessories}
          locale={locale}
          selectedAccessoryIds={selectedAccessoryIds}
          onToggleAccessory={toggleAccessory}
        />
      ) : null}

      <ProductInfoSizeChartDialog
        open={isSizeChartOpen}
        onClose={() => setIsSizeChartOpen(false)}
        sizeChart={sizeChart}
        locale={locale}
      />
    </div>
  );
};

export default ProductInfo;
