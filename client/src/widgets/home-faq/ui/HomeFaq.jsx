"use client";

import { useI18n } from "@shared";
import { useId, useLayoutEffect, useRef, useState } from "react";

import { HOME_FAQ_ITEMS } from "../model/homeFaqItems";
import { FaqAccordionIconClosed, FaqAccordionIconOpen } from "./FaqAccordionIcon";
import styles from "./HomeFaq.module.scss";

const PANEL_INNER_PADDING_BOTTOM = 8;

export default function HomeFaq() {
  const sectionId = useId();
  const { locale, t } = useI18n();
  const [openIndex, setOpenIndex] = useState(0);
  const accordionRef = useRef(null);
  const measureRef = useRef(null);
  const [layoutMetrics, setLayoutMetrics] = useState({
    answerSlotHeight: 0,
    accordionMinHeight: 0,
  });

  const toggleItem = (index) => {
    setOpenIndex((current) => {
      if (current === index) {
        return index === 0 ? 0 : -1;
      }
      return index;
    });
  };

  useLayoutEffect(() => {
    const measure = () => {
      const accordion = accordionRef.current;
      const measureRoot = measureRef.current;
      if (!accordion || !measureRoot) return;

      measureRoot.style.width = `${accordion.getBoundingClientRect().width}px`;

      const answerNodes = measureRoot.querySelectorAll(`.${styles.answer}`);
      let maxAnswer = 0;
      answerNodes.forEach((node) => {
        maxAnswer = Math.max(maxAnswer, node.getBoundingClientRect().height);
      });

      const triggers = accordion.querySelectorAll(`.${styles.trigger}`);
      let triggersHeight = 0;
      triggers.forEach((node) => {
        triggersHeight += node.getBoundingClientRect().height;
      });

      const answerSlotHeight = Math.ceil(maxAnswer + PANEL_INNER_PADDING_BOTTOM);

      setLayoutMetrics({
        answerSlotHeight,
        accordionMinHeight: Math.ceil(triggersHeight + answerSlotHeight),
      });
    };

    measure();
    window.addEventListener("resize", measure);

    return () => {
      window.removeEventListener("resize", measure);
    };
  }, [locale, t]);

  const accordionStyle =
    layoutMetrics.accordionMinHeight > 0
      ? {
          "--faq-accordion-min-height": `${layoutMetrics.accordionMinHeight}px`,
          "--faq-answer-slot-height": `${layoutMetrics.answerSlotHeight}px`,
        }
      : undefined;

  return (
    <section className={styles.root} aria-labelledby={sectionId}>
      <div className={`ds-container ${styles.inner}`}>
        <div className={styles.layout}>
          <div className={styles.intro} id={sectionId}>
            <p className={styles.titleLine1}>{t("homeFaq.titleLine1")}</p>
            <p className={styles.titleLine2}>{t("homeFaq.titleLine2")}</p>
          </div>

          <div
            ref={accordionRef}
            className={styles.accordion}
            style={accordionStyle}
          >
            {HOME_FAQ_ITEMS.map((item, index) => {
              const isOpen = openIndex === index;
              const panelId = `${sectionId}-panel-${item.id}`;
              const triggerId = `${sectionId}-trigger-${item.id}`;

              return (
                <div className={styles.item} key={item.id}>
                  <button
                    type="button"
                    id={triggerId}
                    className={styles.trigger}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => toggleItem(index)}
                  >
                    <span className={styles.question}>
                      {t(`homeFaq.items.${item.id}.question`)}
                    </span>
                    <span className={styles.icon}>
                      {isOpen ? (
                        <FaqAccordionIconOpen />
                      ) : (
                        <FaqAccordionIconClosed />
                      )}
                    </span>
                  </button>

                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={triggerId}
                    aria-hidden={!isOpen}
                    className={`${styles.panel} ${isOpen ? styles.panelOpen : ""}`}
                  >
                    <div className={styles.panelInner}>
                      <p className={styles.answer}>
                        {t(`homeFaq.items.${item.id}.answer`)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div ref={measureRef} className={styles.measure} aria-hidden>
        {HOME_FAQ_ITEMS.map((item) => (
          <p key={item.id} className={styles.answer}>
            {t(`homeFaq.items.${item.id}.answer`)}
          </p>
        ))}
      </div>
    </section>
  );
}
