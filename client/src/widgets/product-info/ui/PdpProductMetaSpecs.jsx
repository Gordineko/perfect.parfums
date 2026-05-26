"use client";

export default function PdpProductMetaSpecs({ rows }) {
  const visible = (rows ?? []).filter(
    (row) => row?.label && row?.value,
  );
  if (!visible.length) return null;

  return (
    <dl className="pdp-info__meta-specs">
      {visible.map((row) => (
        <div key={row.key} className="pdp-info__meta-spec-row">
          <dt className="pdp-info__meta-spec-label">{row.label}</dt>
          <dd className="pdp-info__meta-spec-value-wrap">
            <span
              className="pdp-info__meta-spec-leader"
              aria-hidden="true"
            />
            <span className="pdp-info__meta-spec-value">{row.value}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}
