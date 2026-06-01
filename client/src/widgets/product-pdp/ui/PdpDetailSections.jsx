"use client";

import { ProductDescription } from "@entities/product";
import { useI18n } from "@shared";
import { PDP_USE_API_VARIATIONS } from "@widgets/product-info/lib/pdpStubMeta";
import { buildPdpDetailBlocks } from "@widgets/product-info/lib/pdpContentSections";
import {
  formatCharacteristicLabel,
  formatCharacteristicValue,
} from "@widgets/product-info/lib/formatCharacteristics";
import { useMemo } from "react";

export default function PdpDetailSections({ product, locale: localeProp }) {
  const { t, locale: i18nLocale } = useI18n();
  const locale = localeProp ?? i18nLocale ?? "ua";

  const blocks = useMemo(
    () =>
      buildPdpDetailBlocks(product, locale, {
        descriptionTitle: t("pdp.descriptionTitle"),
      }),
    [locale, product, t],
  );

  const specRows = useMemo(() => {
    if (!PDP_USE_API_VARIATIONS) return [];
    return Array.isArray(product?.characteristics)
      ? product.characteristics
      : [];
  }, [product?.characteristics]);

  const hasSpecs = specRows.some((row) => {
    const label = formatCharacteristicLabel(row, locale);
    const value = formatCharacteristicValue(row, locale);
    return label || value;
  });

  if (!blocks.length && !hasSpecs) return null;

  return (
    <div className="pdp-details">
      {blocks.map((block) => (
        <section
          key={block.key}
          className="pdp-details__section"
          aria-labelledby={`pdp-details-${block.key}-title`}
        >
          <h2
            id={`pdp-details-${block.key}-title`}
            className="pdp-details__title"
          >
            {block.title}
          </h2>
          <div className="pdp-details__body">
            <ProductDescription text={block.body} />
          </div>
        </section>
      ))}

      {hasSpecs ? (
        <section
          className="pdp-details__section"
          aria-labelledby="pdp-details-specs-title"
        >
          <h2 id="pdp-details-specs-title" className="pdp-details__title">
            {t("pdp.specsTableTitle")}
          </h2>
          <div className="pdp-details__body">
            <table className="pdp-details__spec-table">
              <tbody>
                {specRows.map((row, idx) => {
                  const label = formatCharacteristicLabel(row, locale);
                  const valueText = formatCharacteristicValue(row, locale);
                  if (!label && !valueText) return null;
                  return (
                    <tr key={row?.key ?? idx}>
                      <th scope="row">{label || row?.key}</th>
                      <td>{valueText || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
