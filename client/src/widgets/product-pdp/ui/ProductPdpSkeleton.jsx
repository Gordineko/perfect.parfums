export default function ProductPdpSkeleton({
  busyAriaLabel = "Loading product",
}) {
  return (
    <section
      className="pdp section-margin pdp-skeleton"
      aria-busy="true"
      aria-label={busyAriaLabel}
    >
      <header className="pdp__header">
        <div className="pdp-skeleton__title" />
      </header>
      <div className="pdp__grid">
        <aside className="pdp__gallery" aria-hidden="true">
          <div className="pdp-skeleton__media" />
        </aside>
        <div className="pdp__info" aria-hidden="true">
          <div className="pdp-skeleton__aside">
            <div className="pdp-skeleton__line pdp-skeleton__line--short" />
            <div className="pdp-skeleton__line pdp-skeleton__line--mid" />
            <div className="pdp-skeleton__line" />
            <div className="pdp-skeleton__line" />
            <div className="pdp-skeleton__line pdp-skeleton__line--mid" />
          </div>
        </div>
      </div>
    </section>
  );
}
