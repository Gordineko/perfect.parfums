import styles from "./BlogArticleContent.module.scss";

export default function BlogArticleContent({ blocks = [] }) {
  if (!blocks.length) return null;

  return (
    <div className={styles.content}>
      {blocks.map((block, index) => {
        if (block.type === "paragraph") {
          return (
            <p key={index} className={styles.paragraph}>
              {block.text}
            </p>
          );
        }

        if (block.type === "quote") {
          return (
            <p key={index} className={styles.paragraph}>
              {block.text}
            </p>
          );
        }

        if (block.type === "list") {
          return block.items.map((item, itemIndex) => (
            <p key={`${index}-${itemIndex}`} className={styles.paragraph}>
              {item}
            </p>
          ));
        }

        return null;
      })}
    </div>
  );
}
