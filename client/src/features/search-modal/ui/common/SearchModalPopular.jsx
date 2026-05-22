import styles from "./SearchModalPopular.module.scss";

const SearchModalPopular = ({
  labels,
  items = ["Лляний сет \"Sable\"", "Плаття \"Fleur d'été\""],
  activeQuery,
  onSelect,
}) => {
  return (
    <div className={styles.popular}>
      <span className={styles.popularLabel}>
        {labels?.popular ?? "Популярне:"}
      </span>

      <div className={styles.tags}>
        {items.map((item) => (
          <button
            key={item}
            type="button"
            className={`${styles.tag} ${activeQuery === item ? styles.tagActive : ""}`}
            onClick={() => onSelect?.(item)}
          >
            <p className={styles.tagText}>{item}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SearchModalPopular;
