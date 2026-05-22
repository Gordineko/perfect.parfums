"use client";

import {
  formatCharacteristicLabel,
  formatCharacteristicValue,
} from "@widgets/product-info/lib/formatCharacteristics";
import PdpAccordionChevron from "./PdpAccordionChevron";

export default function ProductInfoCharacteristicsSection({
  specRows,
  locale,
  isOpen,
  onToggle,
}) {
  return (
    <div
      className={`pdp-info__accordion ${isOpen ? "is-open" : ""}`}
    >
      <button
        type="button"
        className="pdp-info__accordion-head"
        aria-expanded={isOpen}
        aria-controls="pdp-acc-spec-table-panel"
        id="pdp-acc-spec-table-trigger"
        onClick={onToggle}
      >
        <span>ТАБЛИЦЯ ХАРАКТЕРИСТИК</span>
        <span className="pdp-info__accordion-icon" aria-hidden="true">
          <PdpAccordionChevron />
        </span>
      </button>
      <div
        id="pdp-acc-spec-table-panel"
        className="pdp-info__accordion-panel"
        role="region"
        aria-labelledby="pdp-acc-spec-table-trigger"
        aria-hidden={!isOpen}
      >
        <div className="pdp-info__accordion-panel-inner">
          <div className="pdp-info__accordion-body">
            {specRows.length ? (
              <table className="pdp-info__spec-table">
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
            ) : (
              <p className="pdp-info__text-muted">
                Характеристики не надані.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
