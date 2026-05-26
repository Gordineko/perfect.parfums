# Брейкпоінти

Один набір значень у трьох місцях:

| Файл | Призначення |
|------|-------------|
| `src/shared/ui/styles/variables.scss` | SCSS-міксіни |
| `src/shared/styles/tokens/_layout.scss` | CSS-змінні `:root` |
| `src/shared/config/BREAKPOINTS.js` | JS (`matchMedia`, `sizes`) |

## Діапазони

| Viewport | Назва | SCSS |
|----------|--------|------|
| **≤399.98px** | Мобілка (макет Figma **400px**) | `@include mobile-only` |
| **400–767.98px** | Проміжок до планшета | ті самі стилі, що й «до планшета», якщо не задано окремо |
| **≤767.98px** | Усе нижче планшета (телефони) | `@include below-tablet` або `@include down($bp-tablet)` |
| **768–1249.98px** | Планшет | `@include tablet-only` |
| **≥1250px** | Десктоп | `@include desktop-only` |
| **≤1249.98px** | Не десктоп | `@include down($bp-desktop)` |

## Приклади

```scss
@use "@/shared/ui/styles/variables.scss" as *;

.card {
  padding: 2rem;

  @include below-tablet {
    padding: 1rem; // viewport < 768px
  }

  @include mobile-only {
    padding: 0.75rem; // viewport ≤ 400px (вузький макет)
  }
}
```

```js
import { BREAKPOINTS, MQ } from "@/shared/config/BREAKPOINTS";

window.matchMedia(MQ.belowTablet).matches;
```

## Відступи між секціями (`--space-section-y`)

| Viewport | Значення |
|----------|----------|
| Desktop (≥1250px) | `5rem` (80px) |
| Tablet (768–1249px) | `3.75rem` (60px) |
| Mobile (≤767px) | `2.5rem` (40px) |

Використовуй `padding-block: var(--space-section-y)` у секціях.

## Заголовки h2

| Viewport | `--fs-h2` / міксін `section-h2-title` |
|----------|--------------------------------------|
| Desktop (≥1250px) | `1.75rem` (28px) |
| Tablet (768–1249px) | `1.5rem` (24px) |
| Mobile (≤767px) | `1.25rem` (20px) |

Клас `.t-h2`, тег `h2` (глобально), або `@include section-h2-title` у SCSS модулі секції. **Банер hero** — окремі стилі, не ці значення.

## Часті помилки

- **`mobile-only` ≠ «мобільна вёрстка всього сайту»** — це лише вузький екран до 400px. Для хедера, сіток, каталогу зазвичай потрібен **`below-tablet`**.
- **`down($bp-tablet)`** = `below-tablet` (max **767.98px**), не 400px.
- Планшет починається з **`min-width: 768px`**, не з 400px.
