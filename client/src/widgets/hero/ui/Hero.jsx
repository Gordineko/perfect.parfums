import styles from "./Hero.module.scss";
import Link from "next/link";

function normalizeLines(lines) {
  if (Array.isArray(lines)) {
    return lines
      .map((line) => String(line ?? "").trim())
      .filter(Boolean);
  }
  if (typeof lines === "string") {
    return lines
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  }
  return [];
}

export default function Hero({
  slides = [],
  heroCta = "Дивитися колекцію",
  heroFallbackTitle = "Естетика ательє\nв кожній деталі",
}) {
  const firstSlide = Array.isArray(slides) && slides.length > 0 ? slides[0] : null;
  const title =
    typeof firstSlide?.title === "string" && firstSlide.title.trim()
      ? firstSlide.title.trim()
      : heroFallbackTitle;
  const titleLines = normalizeLines(firstSlide?.lines);
  const ctaLink =
    typeof firstSlide?.link === "string" && firstSlide.link.trim()
      ? firstSlide.link.trim()
      : "";
  const desktopImage =
    typeof firstSlide?.imageURL === "string" && firstSlide.imageURL.trim()
      ? firstSlide.imageURL.trim()
      : "";
  const mobileImage =
    typeof firstSlide?.mobileImageURL === "string" && firstSlide.mobileImageURL.trim()
      ? firstSlide.mobileImageURL.trim()
      : desktopImage;
  const desktopVideo =
    typeof firstSlide?.videoURL === "string" && firstSlide.videoURL.trim()
      ? firstSlide.videoURL.trim()
      : "";
  const mobileVideo =
    typeof firstSlide?.mobileVideoURL === "string" && firstSlide.mobileVideoURL.trim()
      ? firstSlide.mobileVideoURL.trim()
      : desktopVideo;
  const hasVideo = Boolean(desktopVideo);
  const hasImage = Boolean(desktopImage);
  const label = "New Season '26";

  return (
    <section className={styles.root}>
      {hasVideo ? (
        <>
          <video
            className={`${styles.video} ${styles.videoDesktop}`}
            src={desktopVideo}
            autoPlay
            muted
            loop
            playsInline
          />
          <video
            className={`${styles.video} ${styles.videoMobile}`}
            src={mobileVideo || desktopVideo}
            autoPlay
            muted
            loop
            playsInline
          />
        </>
      ) : hasImage ? (
        <picture className={styles.media}>
          <source media="(max-width: 767.98px)" srcSet={mobileImage} />
          <img className={styles.mediaAsset} src={desktopImage} alt={title} loading="eager" />
        </picture>
      ) : (
        <video
          className={styles.video}
          src="/media/home/hero/hero-video.mp4"
          autoPlay
          muted
          loop
          playsInline
        />
      )}
      <div className={styles.overlay}>
        <div className={`ds-container ${styles.content}`}>
          <p className={styles.label}>{label}</p>
          <h1 className={styles.title}>
            {(titleLines.length > 0 ? titleLines : title.split("\n")).map((line, idx) => (
              <span
                key={idx}
                className={idx === 1 ? styles.titleLineItalic : styles.titleLine}
              >
                {line}
              </span>
            ))}
          </h1>
          {ctaLink ? (
            <Link href={ctaLink} className={styles.cta}>
              <span className={styles.ctaText}>{heroCta}</span>
            </Link>
          ) : (
            <button type="button" className={styles.cta}>
              <span className={styles.ctaText}>{heroCta}</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
