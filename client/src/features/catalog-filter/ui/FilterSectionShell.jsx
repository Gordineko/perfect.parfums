import { FilterAccordionChevron } from "./FilterAccordionChevron";

export default function FilterSectionShell({
  layoutMode = "accordion",
  title,
  sectionId,
  isSectionOpen,
  toggleSection,
  children,
}) {
  if (layoutMode === "column") {
    return (
      <div className="filters__column">
        <h3 className="filters__column-title">{title}</h3>
        {children}
      </div>
    );
  }

  const open = isSectionOpen(sectionId);

  return (
    <div
      className={`filters__accordion ${
        open ? "filters__accordion--open" : "filters__accordion--closed"
      }`}
    >
      <button
        type="button"
        className="filters__accordion-header"
        onClick={() => toggleSection(sectionId)}
        aria-expanded={open}
      >
        <span className="filters__title">{title}</span>
        <FilterAccordionChevron className="filters__accordion-chevron" />
      </button>
      <div className="filters__accordion-panel">
        <div className="filters__accordion-panel-inner">{children}</div>
      </div>
    </div>
  );
}
