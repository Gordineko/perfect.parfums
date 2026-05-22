import mongoose from "mongoose";
import { ArticleModel } from "../Modules/Article/Models/Article.model.js";

const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb://mongoAdmin:ofoaOFFO8282c@185.237.204.185:27017/test?authSource=admin";

const articles = [
  {
    title: {
      ua: "Гіалуронова кислота: Чому молекулярна вага має вирішальне значення для синтезу колагену?",
      en: "Hyaluronic Acid: Why Molecular Weight Matters for Collagen Synthesis?",
    },
    slug: "hyaluronic-acid-molecular-weight-collagen",
    excerpt: {
      ua: "Розбираємо останні клінічні дослідження про те, як різні фракції гіалуронової кислоти впливають на клітинний матрикс та чому високомолекулярні сполуки можуть бути менш ефективними.",
      en: "A review of recent clinical findings on how different fractions of hyaluronic acid affect the cellular matrix and why high-molecular-weight compounds may be less effective.",
    },
    body: {
      ua: `
        <p>Гіалуронова кислота (ГК) — це не просто зволожувач. Це фундаментальний компонент екстрацелюлярного матриксу, який диктує правила поведінки клітин шкіри та суглобів. Проте в науковій спільноті точаться палкі дискусії щодо її молекулярної ваги.</p>

        <h2>Фракції та їх біологічний вплив</h2>
        <p>Дослідження 2024 року підтвердили, що молекули різного розміру “спілкуються” з клітинами через різні рецептори. Наприклад, великі молекули створюють захисний бар’єр, тоді як дрібні — здатні проникати глибше, сигналізуючи організму про необхідність регенерації.</p>

        <h2>Синергія з іншими компонентами</h2>
        <p>Важливо розуміти, що ГК не працює в ізоляції. Для її стабілізації та захисту від ферментативного розпаду необхідна присутність кофакторів, таких як Вітамін C та Магній.</p>
      `,
      en: `
        <p>Hyaluronic acid (HA) is not just a moisturizer. It is a fundamental component of the extracellular matrix that governs the behavior of skin and joint cells. However, scientific discussion continues around the importance of molecular weight.</p>

        <h2>Fractions and Their Biological Impact</h2>
        <p>Recent studies have confirmed that molecules of different sizes communicate with cells through different receptor pathways. Larger molecules can form a protective barrier, while smaller ones are able to penetrate deeper and stimulate regeneration signaling.</p>

        <h2>Synergy with Other Components</h2>
        <p>It is important to understand that HA does not work in isolation. For stabilization and protection from enzymatic degradation, cofactors such as Vitamin C and Magnesium are also important.</p>
      `,
    },
    cover: {
      url: "https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&w=1600&q=80",
      preview: "https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&w=500&q=60",
      alt: {
        ua: "Ілюстрація клітинної активності та молекулярної взаємодії",
        en: "Illustration of cellular activity and molecular interaction",
      },
    },
    publishedAt: new Date("2026-01-16T09:00:00.000Z"),
    isPublished: true,
    tags: ["hyaluronic-acid", "collagen", "research", "longevity"],
    seo: {
      title: {
        ua: "Гіалуронова кислота і молекулярна вага — вплив на синтез колагену",
        en: "Hyaluronic Acid and Molecular Weight — Impact on Collagen Synthesis",
      },
      description: {
        ua: "Науковий огляд впливу молекулярної ваги гіалуронової кислоти на колаген, регенерацію та клітинний матрикс.",
        en: "A scientific overview of how hyaluronic acid molecular weight affects collagen synthesis, regeneration, and the cellular matrix.",
      },
    },
  },

  {
    title: {
      ua: "Синергія Магнію та Вітаміну D3",
      en: "Magnesium and Vitamin D3 Synergy",
    },
    slug: "magnesium-vitamin-d3-synergy",
    excerpt: {
      ua: "Як створити ідеальний біологічний протокол для підтримки нервової системи в умовах мегаполіса.",
      en: "How to build an effective biological protocol to support the nervous system in modern urban life.",
    },
    body: {
      ua: `
        <p>Магній бере участь у сотнях ферментативних реакцій, а Вітамін D3 впливає на імунну систему, кісткову тканину та нервову регуляцію. Разом вони працюють значно ефективніше, ніж окремо.</p>

        <h2>Чому ця комбінація важлива</h2>
        <p>Нестача магнію може знижувати ефективність засвоєння та активації Вітаміну D3. Саме тому багато сучасних протоколів передбачають їх паралельний прийом.</p>

        <h2>Кому варто звернути увагу</h2>
        <p>Особливо актуально це для людей із хронічним стресом, порушенням сну, високими когнітивними навантаженнями та низьким рівнем сонячної активності.</p>
      `,
      en: `
        <p>Magnesium is involved in hundreds of enzymatic reactions, while Vitamin D3 plays a major role in immunity, bone health, and nervous system regulation. Together, they work more effectively than in isolation.</p>

        <h2>Why This Combination Matters</h2>
        <p>Magnesium deficiency may reduce the absorption and activation efficiency of Vitamin D3. That is why many modern supplementation protocols recommend combining them.</p>

        <h2>Who Should Pay Attention</h2>
        <p>This is especially relevant for people with chronic stress, sleep disturbances, high cognitive load, and low sunlight exposure.</p>
      `,
    },
    cover: {
      url: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1600&q=80",
      preview: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=500&q=60",
      alt: {
        ua: "Флакони з добавками та капсули на світлому фоні",
        en: "Supplement bottles and capsules on a light surface",
      },
    },
    publishedAt: new Date("2026-01-15T09:00:00.000Z"),
    isPublished: true,
    tags: ["magnesium", "vitamin-d3", "supplements", "protocol"],
    seo: {
      title: {
        ua: "Синергія Магнію та Вітаміну D3 — як поєднувати правильно",
        en: "Magnesium and Vitamin D3 Synergy — How to Combine Them Properly",
      },
      description: {
        ua: "Пояснюємо, чому Магній і Вітамін D3 часто варто приймати разом та кому це особливо актуально.",
        en: "Why Magnesium and Vitamin D3 are often best taken together and who benefits most from this protocol.",
      },
    },
  },

  {
    title: {
      ua: "Протокол Longevity: як уповільнити старіння",
      en: "Longevity Protocol: How to Slow Aging",
    },
    slug: "longevity-protocol-slow-aging",
    excerpt: {
      ua: "Аналіз впливу сенолітиків на тривалість активного життя та відновлення тканин.",
      en: "An analysis of senolytics and their role in extending active lifespan and tissue recovery.",
    },
    body: {
      ua: `
        <p>Сучасна longevity-медицина все частіше концентрується не лише на тривалості життя, а й на якості функціонування тканин, мозку та енергетичних систем організму.</p>

        <h2>Що таке сенолітики</h2>
        <p>Сенолітики — це речовини, які досліджуються як потенційний інструмент очищення організму від старіючих клітин, що накопичуються з віком.</p>

        <h2>Практичний підхід</h2>
        <p>Будь-який longevity-протокол має включати діагностику, оцінку дефіцитів, сон, харчування, фізичну активність і лише потім — додаткові фармакологічні або нутріцевтичні стратегії.</p>
      `,
      en: `
        <p>Modern longevity medicine is increasingly focused not only on lifespan but also on the quality of tissue function, brain performance, and systemic energy balance.</p>

        <h2>What Are Senolytics</h2>
        <p>Senolytics are compounds studied for their potential to help clear senescent cells that accumulate with age.</p>

        <h2>Practical Approach</h2>
        <p>A real longevity protocol should begin with diagnostics, deficiency correction, sleep, nutrition, and physical activity before moving to advanced pharmacological or nutraceutical strategies.</p>
      `,
    },
    cover: {
      url: "https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=1600&q=80",
      preview: "https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=500&q=60",
      alt: {
        ua: "Лабораторне дослідження під мікроскопом",
        en: "Laboratory research under a microscope",
      },
    },
    publishedAt: new Date("2026-01-10T09:00:00.000Z"),
    isPublished: true,
    tags: ["longevity", "aging", "senolytics", "healthspan"],
    seo: {
      title: {
        ua: "Протокол Longevity — як уповільнити старіння та зберегти активність",
        en: "Longevity Protocol — How to Slow Aging and Preserve Vitality",
      },
      description: {
        ua: "Огляд сучасного підходу до longevity: сенолітики, дефіцити, сон, відновлення та якість активного життя.",
        en: "A modern longevity overview: senolytics, deficiencies, sleep, recovery, and preserving active lifespan.",
      },
    },
  },

  {
    title: {
      ua: "Циркадні ритми та засвоєння нутрієнтів",
      en: "Circadian Rhythms and Nutrient Absorption",
    },
    slug: "circadian-rhythms-nutrient-absorption",
    excerpt: {
      ua: "Чому час прийому вітамінів важливіший за їх дозування. Налаштовуємо ваш біологічний годинник.",
      en: "Why timing may matter more than dosage when taking vitamins and nutrients.",
    },
    body: {
      ua: `
        <p>Біологічний годинник людини впливає на гормональний фон, чутливість до інсуліну, температуру тіла та активність ферментних систем.</p>

        <h2>Коли приймати нутрієнти</h2>
        <p>Жиророзчинні вітаміни частіше краще засвоюються разом із їжею, а стимулюючі комплекси небажано переносити на вечірній час.</p>

        <h2>Чому це важливо</h2>
        <p>Навіть якісний продукт може працювати слабше, якщо його приймати у невідповідний час відносно сну, фізичної активності та харчування.</p>
      `,
      en: `
        <p>The human biological clock influences hormones, insulin sensitivity, body temperature, and enzyme system activity.</p>

        <h2>When to Take Nutrients</h2>
        <p>Fat-soluble vitamins are usually better absorbed with meals, while stimulating formulations should generally not be taken late in the day.</p>

        <h2>Why It Matters</h2>
        <p>Even a high-quality supplement may work less effectively if taken at the wrong time relative to sleep, activity, and meals.</p>
      `,
    },
    cover: {
      url: "https://images.unsplash.com/photo-1532187643603-ba119ca4109e?auto=format&fit=crop&w=1600&q=80",
      preview: "https://images.unsplash.com/photo-1532187643603-ba119ca4109e?auto=format&fit=crop&w=500&q=60",
      alt: {
        ua: "DNA-спіраль як метафора біологічних процесів",
        en: "DNA strand as a metaphor for biological processes",
      },
    },
    publishedAt: new Date("2026-01-10T12:00:00.000Z"),
    isPublished: true,
    tags: ["circadian-rhythm", "nutrients", "vitamins", "protocol"],
    seo: {
      title: {
        ua: "Циркадні ритми та засвоєння нутрієнтів — коли приймати вітаміни",
        en: "Circadian Rhythms and Nutrient Absorption — Best Timing for Vitamins",
      },
      description: {
        ua: "Пояснюємо, як біологічний годинник впливає на ефективність прийому вітамінів та нутрієнтів.",
        en: "Learn how circadian rhythms affect the effectiveness of vitamins and nutrient intake.",
      },
    },
  },
];

async function seedArticles() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected");

    for (const article of articles) {
      await ArticleModel.updateOne(
        { slug: article.slug },
        { $set: article },
        { upsert: true }
      );
      console.log(`Seeded: ${article.slug}`);
    }

    console.log("Articles seeded successfully");
    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }
}

seedArticles();