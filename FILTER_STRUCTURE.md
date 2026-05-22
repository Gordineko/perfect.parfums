# Структура фильтров в приложении

## Обзор

Система фильтров состоит из двух основных частей:
1. **Facets (фасеты)** — ответ от API с готовыми фильтрующими данными и количеством товаров
2. **Characteristics Meta** — метаинформация о характеристиках для отображения в UI

---

## 1. API Запросы

### `getAllFilters(params, categoryId, locale)`
**Endpoint:** `GET /catalog/facets?{params}&sticky=true`

**Параметры:**
- `status: "active"` - только активные товары
- `lang: "ua" | "en"` - язык
- `preview: true` - превью товаров
- `depth: 2` - уровень вложенности
- `categoryId` (опционально) - фильтр по категории
- `categoryInclude: "branch"` - включать подкатегории
- `sticky: true` - зафиксированные фильтры

### `getCharacteristicsMeta(params)`
**Endpoint:** `GET /catalog/characteristics/meta`

**Параметры:**
- `status: "active"` - только активные характеристики

---

## 2. Структура `filters` (Facets)

```javascript
{
  facets: {
    // Категории
    categories: {
      meta: {
        title: { ua: "Категорії", en: "Categories" },
        key: "categories"
      },
      buckets: [
        {
          count: 45,
          value: {
            _id: "cat-1",
            title: { ua: "Платья", en: "Dresses" },
            slug: "sukni",
            fullSlug: "clothing/sukni",
            label: null,
            sort: 1,
            children: [ /* вложенные категории */ ]
          }
        }
      ]
    },

    // Характеристики товаров (групповые)
    groupCharacteristics: {
      // Каждый ключ — это technical key характеристики
      "color": {
        meta: {
          key: "color",
          title: { ua: "Колір", en: "Color" },
          type: "string"
        },
        buckets: [
          {
            count: 12,
            value: {
              value: "red",
              label: { ua: "Червоний", en: "Red" }
            }
          },
          {
            count: 8,
            value: {
              value: "blue",
              label: { ua: "Синій", en: "Blue" }
            }
          }
        ]
      },

      "size": {
        meta: {
          key: "size",
          title: { ua: "Розмір", en: "Size" },
          type: "string"
        },
        buckets: [
          { count: 5, value: { value: "XS", label: { ua: "XS", en: "XS" } } },
          { count: 10, value: { value: "S", label: { ua: "S", en: "S" } } }
        ]
      }
    },

    // Характеристики предложений (offer-level)
    offerCharacteristics: {
      // Например: размер, цвет, цена для конкретного предложения товара
      "material": {
        meta: {
          key: "material",
          title: { ua: "Матеріал", en: "Material" }
        },
        buckets: [
          { count: 25, value: "cotton" },
          { count: 18, value: "polyester" }
        ]
      }
    },

    // Ценовые диапазоны
    pricing: {
      min: 100,
      max: 5000,
      currency: "UAH"
    }
  }
}
```

### Структура bucket'ов

**Для groupCharacteristics (структурированные):**
```javascript
{
  count: number,           // Количество товаров с этим значением
  value: {
    value: any,            // Техническое значение (для запроса)
    label: {               // Локализованный текст
      ua: string,
      en: string
    }
  }
}
```

**Для offerCharacteristics (простые):**
```javascript
{
  count: number,           // Количество предложений
  value: string | number   // Техническое значение
  label?: {
    ua: string,
    en: string
  }
}
```

---

## 3. Структура `characteristicsMeta` (Метаинформация)

```javascript
{
  items: [
    {
      _id: "char-uuid-1",
      key: "color",                    // Техническое имя
      type: "string",                  // "string" | "number" | "boolean"
      scope: "group",                  // "group" | "offer"
      title: {
        ua: "Колір",
        en: "Color"
      },
      filterable: true,                // Можно ли фильтровать
      status: "active",                // "active" | "hidden" | "draft"
      sort: 1,                         // Порядок в списке фильтров
      unit: null,                      // Единица измерения (для чисел)
      valuesPreset: [                  // Предзаданные значения
        {
          value: "red",
          label: { ua: "Червоний", en: "Red" }
        },
        {
          value: "blue",
          label: { ua: "Синій", en: "Blue" }
        }
      ]
    },

    {
      key: "size",
      type: "string",
      scope: "group",
      title: { ua: "Розмір", en: "Size" },
      filterable: true,
      status: "active",
      sort: 2,
      valuesPreset: [
        { value: "XS", label: { ua: "XS", en: "XS" } },
        { value: "S", label: { ua: "S", en: "S" } },
        { value: "M", label: { ua: "M", en: "M" } }
      ]
    },

    {
      key: "availability",
      type: "boolean",
      scope: "offer",
      title: { ua: "Наявність", en: "Availability" },
      filterable: true,
      status: "active",
      sort: 10
      // Для boolean — нет valuesPreset, значения true/false
    },

    {
      key: "weight",
      type: "number",
      scope: "offer",
      title: { ua: "Вага", en: "Weight" },
      filterable: true,
      status: "active",
      sort: 5,
      unit: "kg",
      valuesPreset: [100, 200, 500, 1000]
    }
  ]
}
```

---

## 4. Как это работает в UI (Filters.jsx)

### Обработка данных:

1. **Извлечение groupCharacteristics:**
```javascript
const groupChars = filters?.facets?.groupCharacteristics ?? {}
// Итерируем и ищем facet по meta.key
```

2. **Обработка bulkets:**
```javascript
// Для каждого bucket получаем:
- count: используется для отключения опций без товаров
- value.value или value: техническое значение для запроса
- value.label или bucket.label: отображаемый текст
```

3. **Кэшевание выбранных фильтров:**
```javascript
// URL параметры
QUERY_CHAR = "c"           // Групповые характеристики: {"color":"red","size":"M"}
QUERY_OFFER_CHAR = "oc"    // Offer характеристики: {"material":"cotton"}
QUERY_PRICE_MIN = "priceMin"
QUERY_PRICE_MAX = "priceMax"
```

---

## 5. Ключевые компоненты

### `Filters.jsx` (основной компонент)
- Отображает все доступные фильтры
- Управляет состоянием аккордеонов
- Передает изменения в URL

### `MetaFilterSections.jsx`
- Рендерит секции характеристик на основе `characteristicsMeta`
- Соединяет meta-данные с facets для отображения count

### `CategoryTree.jsx`
- Показывает иерархию категорий из `facets.categories`

### `PriceRange.jsx`
- Слайдер цен на основе `facets.pricing.min/max`

### `ActiveFilterTags.jsx`
- Отображает выбранные фильтры с кнопкой удаления

---

## 6. Примеры запросов и ответов

### Запрос фильтров с параметрами:
```
GET /catalog/facets?status=active&lang=ua&depth=2&sticky=true&categoryId=cat-123
```

### Ответ (фрагмент):
```json
{
  "facets": {
    "categories": { /* ... */ },
    "groupCharacteristics": { /* ... */ },
    "offerCharacteristics": { /* ... */ },
    "pricing": { "min": 100, "max": 5000, "currency": "UAH" }
  }
}
```

### Запрос мета-характеристик:
```
GET /catalog/characteristics/meta?status=active
```

---

## 7. Утилиты для работы с фильтрами

### `characteristicsMetaHelpers.js`
- `prepareFilterableMetaItems()` — фильтрует и сортирует характеристики
- `pickLocalizedField()` — выбирает текст на нужном языке
- `normalizePresetRows()` — нормализует значения с учетом типа
- `buildFacetPresetRows()` — связывает meta + facets для отображения

### `filterFacetHelpers.js`
- `getFacetBucketRawValue()` — извлекает техническое значение bucket'а
- `findBucketForTechnicalValue()` — ищет bucket по техническому значению
- `resolveFacetValueDisplayLabel()` — выбирает отображаемый текст

---

## 8. Поток данных

```
API /catalog/facets          API /catalog/characteristics/meta
        ↓                                    ↓
    filters                          characteristicsMeta
        ↓                                    ↓
  CatalogView                           CatalogView
        ↓                                    ↓
    Filters.jsx ←← ← ← ← ← ← ← ← ← ← ← ← ← ← ←
        ↓
  MetaFilterSections
  CategoryTree
  PriceRange
  ActiveFilterTags
```

---

## 9. Важные моменты

1. **Кэширование:** `getAllFilters` использует `cache: "no-store"` для актуальных данных
2. **Localization:** Все текстовые поля поддерживают `{ ua, en }`
3. **Count фильтрация:** Опции с count=0 обычно скрываются (если не выбраны)
4. **Type-specific:** 
   - `boolean` — только true/false
   - `string` — свободные значения из valuesPreset
   - `number` — числовые с опциональной единицей измерения
