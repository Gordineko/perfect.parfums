"use client";

import {
  ProductDescription,
  ProductPrice,
} from "@entities/product";
import CartButton from "@features/cart-buttons/ui/CartButton";
import Counter from "@features/counter";
import { useI18n } from "@shared";
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

import { buildAccessoryCartLines } from "../lib/resolveAccessoryCartLines";
import PdpAccordionChevron from "./PdpAccordionChevron";
import ProductInfoAccessoriesSection from "./ProductInfoAccessoriesSection";
import ProductInfoCharacteristicsSection from "./ProductInfoCharacteristicsSection";
import ProductInfoSizeChartDialog from "./ProductInfoSizeChartDialog";

function trimStr(v) {
  if (v == null) return "";
  const s = String(v).trim();
  return s;
}

function pickGroupArticleSku(product) {
  if (!product || typeof product !== "object") return "";
  const keys = [
    "sku",
    "article",
    "articleNumber",
    "vendorCode",
    "productSku",
    "groupSku",
  ];
  for (const k of keys) {
    const s = trimStr(product[k]);
    if (s) return s;
  }
  return "";
}

function num(v) {
  if (v == null || v === "") return NaN;
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

function sortedContentSections(product) {
  const list = Array.isArray(product?.contentSections)
    ? [...product.contentSections]
    : [];
  return list.sort((a, b) => (a?.sort ?? 0) - (b?.sort ?? 0));
}

function initialAccordionState(sections) {
  const o = {};
  if (!sections.length) {
    o.fallback = true;
    return o;
  }
  sections.forEach((s, i) => {
    const k = s.key ?? `section-${i}`;
    o[k] = i === 0;
  });
  return o;
}

const ProductInfo = ({
  product,
  locale: localeProp,
  categoryLabel,
  onGallerySlidesChange,
  onActiveOfferChange,
}) => {
  const locale = localeProp ?? "ua";
  const { t } = useI18n();
  const axes = product?.variationAxes ?? [];
  const offers = product?.offers ?? [];

  const [quantity, setQuantity] = useState(1);
  const [selectedByAxisId, setSelectedByAxisId] = useState(() => ({}));
  const [isSizeChartOpen, setIsSizeChartOpen] = useState(false);

  const contentSections = useMemo(
    () => sortedContentSections(product),
    [product],
  );

  const [accordionOpen, setAccordionOpen] = useState(() => ({
    ...initialAccordionState(sortedContentSections(product)),
    specTable: false,
  }));

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
    const secs = sortedContentSections(product);
    setAccordionOpen({
      ...initialAccordionState(secs),
      specTable: false,
    });
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

  const oldPrice = useMemo(() => {
    if (hasActiveSku) {
      const cross = getOfferCrossPrice(activeOffer);
      return cross != null ? cross : null;
    }
    const mn = num(pricing?.min);
    const mx = num(pricing?.max);
    if (Number.isFinite(mn) && Number.isFinite(mx) && mx !== mn) return mx;
    return null;
  }, [activeOffer, hasActiveSku, pricing?.max, pricing?.min]);

  const currency = pricing?.currency ?? "UAH";

  const artLine = useMemo(() => {
    const sku = trimStr(activeOffer?.sku);
    if (sku) {
      return `ART: ${sku}`;
    }
    const groupArticle = pickGroupArticleSku(product);
    if (axes.length > 0 && offers.length > 0) {
      if (groupArticle) {
        return `ART: ${groupArticle}`;
      }
      return t("pdp.pickVariantHint");
    }
    if (groupArticle) {
      return `ART: ${groupArticle}`;
    }
    return "";
  }, [
    activeOffer?._id,
    activeOffer?.sku,
    axes.length,
    offers.length,
    product,
    t,
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

  const characteristics = Array.isArray(product?.characteristics)
    ? product.characteristics
    : [];

  const specRows = useMemo(() => characteristics, [characteristics]);

  const toggleAccordion = (key) => {
    setAccordionOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const metaCategory =
    typeof categoryLabel === "string" && categoryLabel.trim()
      ? categoryLabel.toUpperCase()
      : "—";

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

  const renderContentAccordions = () => {
    if (contentSections.length) {
      return contentSections.map((section, idx) => {
        const key = section.key ?? `section-${idx}`;
        const title =
          pickLocalizedString(section.title, locale) ||
          String(key).toUpperCase();
        const body = pickLocalizedString(section.content, locale);
        const open = Boolean(accordionOpen[key]);
        const panelId = `pdp-content-${key}-panel`;
        const triggerId = `pdp-content-${key}-trigger`;

        return (
          <div
            key={key}
            className={`pdp-info__accordion ${open ? "is-open" : ""}`}
          >
            <button
              type="button"
              className="pdp-info__accordion-head"
              aria-expanded={open}
              aria-controls={panelId}
              id={triggerId}
              onClick={() => toggleAccordion(key)}
            >
              <span>{title}</span>
              <span className="pdp-info__accordion-icon" aria-hidden="true">
                <PdpAccordionChevron />
              </span>
            </button>
            <div
              id={panelId}
              className="pdp-info__accordion-panel"
              role="region"
              aria-labelledby={triggerId}
              aria-hidden={!open}
            >
              <div className="pdp-info__accordion-panel-inner">
                <div className="pdp-info__accordion-body">
                  <ProductDescription text={body} />
                </div>
              </div>
            </div>
          </div>
        );
      });
    }

    const fallback = pickLocalizedString(product?.description, locale);
    if (!fallback) return null;

    return (
      <div
        className={`pdp-info__accordion ${accordionOpen.fallback ? "is-open" : ""}`}
      >
        <button
          type="button"
          className="pdp-info__accordion-head"
          aria-expanded={accordionOpen.fallback}
          aria-controls="pdp-fallback-desc"
          id="pdp-fallback-trigger"
          onClick={() => toggleAccordion("fallback")}
        >
          <span>ОПИС МОДЕЛІ</span>
          <span className="pdp-info__accordion-icon" aria-hidden="true">
            <PdpAccordionChevron />
          </span>
        </button>
        <div
          id="pdp-fallback-desc"
          className="pdp-info__accordion-panel"
          role="region"
          aria-labelledby="pdp-fallback-trigger"
          aria-hidden={!accordionOpen.fallback}
        >
          <div className="pdp-info__accordion-panel-inner">
            <div className="pdp-info__accordion-body">
              <ProductDescription text={fallback} />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const sizeChart = product?.sizeChart;

  return (
    <div className="pdp-info">
      <div className="pdp-info__meta">
        <p className="pdp-info__meta-row">
          <span className="pdp-info__meta-label">Collection:</span>{" "}
          <span className="pdp-info__meta-value pdp-info__meta-value--series">
            SHOES
          </span>
          <span className="pdp-info__meta-sep" aria-hidden="true" />
          <span className="pdp-info__meta-label pdp-info__meta-label--category">
            Gender:
          </span>{" "}
          <span className="pdp-info__meta-value pdp-info__meta-value--category">
            {metaCategory}
          </span>
        </p>
      </div>

      <div className="pdp-info__price-row">
        {hasNumericPrice ? (
          <ProductPrice
            quantity={quantity}
            price={{
              min: currentPrice,
              old: oldPrice,
              currency,
            }}
            isBasket={false}
            showCurrent={true}
            showOld={true}
          />
        ) : (
          <p className="pdp-info__price-on-request">Ціна за запитом</p>
        )}

        {artLine ? (
          <span className="pdp-info__art" title={artLine}>
            {artLine}
          </span>
        ) : null}
      </div>

      {axes.length > 0 ? (
        <div className="pdp-info__options">
          {axes.map((axis, axisIndex) => {
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
            const current = axisId != null ? selectedByAxisId?.[axisId] : undefined;
            const titleLc = String(title).toLowerCase();
            const showSizeChart =
              Boolean(sizeChart?.imageUrl) &&
              (titleLc.includes("розмір") ||
                titleLc.includes("size") ||
                titleLc.includes("розм") ||
                titleLc.includes("стельк"));
            const useColorSwatches = isPdpColorSwatchAxis(axis);

            return (
              <div
                key={axisId ?? axisIndex}
                className={`pdp-info__option pdp-info__option--axis${useColorSwatches ? " pdp-info__option--color" : ""}`}
              >
                <div className="pdp-info__option-head pdp-info__option-head--between">
                  <p className="pdp-info__option-title">{title}</p>
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
                    const optionLabel = getAxisOptionLabel(
                      axis,
                      opt,
                      locale,
                    );

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
              </div>
            );
          })}
        </div>
      ) : null}

      <div className="pdp-info__buy">
        <Counter
          value={quantity}
          min={1}
          max={maxQty}
          onIncrement={() =>
            setQuantity((q) =>
              typeof maxQty === "number" ? Math.min(maxQty, q + 1) : q + 1,
            )
          }
          onDecrement={() => setQuantity((q) => Math.max(1, q - 1))}
        />
        <CartButton
          product={product}
          activeOffer={activeOffer}
          location="prod-page"
          isQuantity={quantity}
          style="pdp-info__add-to-cart"
          getCompanionCartItems={getCompanionCartItems}
        />
      </div>

      <div className="pdp-info__divider" aria-hidden="true" />

      {accessories.length > 0 ? (
        <ProductInfoAccessoriesSection
          accessories={accessories}
          locale={locale}
          selectedAccessoryIds={selectedAccessoryIds}
          onToggleAccessory={toggleAccessory}
        />
      ) : null}

      <div className="pdp-info__accordions">
        {renderContentAccordions()}

        <ProductInfoCharacteristicsSection
          specRows={specRows}
          locale={locale}
          isOpen={Boolean(accordionOpen.specTable)}
          onToggle={() => toggleAccordion("specTable")}
        />
      </div>

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
