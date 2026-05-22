# Подробная документация для фронта: Catalog Admin API

## Общая концепция

Данный API предназначен для управления каталогом в админке.

Архитектура каталога разделена на 2 сущности:

1. **Группа товара** (`ProductGroup`)  
   Это общая сущность товара:
   - slug
   - title
   - subtitle
   - description
   - imageURL
   - categoryIds
   - status
   - variationAxes
   - characteristics

2. **Оффер** (`Offer`)  
   Это конкретная вариация товара внутри группы:
   - sku
   - price
   - opt_price
   - available
   - img
   - optionMap
   - optionValues
   - optionKey
   - characteristics
   - stocks

---

## Важнейшая концепция

### variationAxes
На уровне группы задаются оси вариаций.

Пример:
- `A1` = вкус
- `A2` = количество
- `A3` = формат упаковки

### optionMap
У каждого оффера есть `optionMap`, который хранит выбранные значения только по тем осям, для которых значение реально задано.

Оси, пришедшие из `variationTemplate` корневой категории, можно не включать в `optionMap`, если пользователь не заполнил их значение. В этом случае backend не добавляет такую ось в оффер автоматически.

Пример:

```json
{
  "A1": "berry",
  "A2": 60,
  "A3": "box"
}
```

### Что фронт НЕ должен сам вычислять
Бэкенд автоматически строит:
- `optionValues`
- `optionKey`

Поэтому при создании/обновлении фронт **не должен** присылать:
- `optionValues`
- `optionKey`

Фронт присылает:
- `optionMap`
- остальные поля оффера

---

## Рекомендованная стратегия интеграции фронта

Если у товара может быть 100, 200, 400 и более офферов, **нельзя** строить UX как одну гигантскую форму, в которой всё грузится и сохраняется целиком при каждом изменении.

Правильная схема:

1. Открываем страницу редактирования товара
2. Грузим данные группы отдельно:  
   `GET /catalog/admin/catalog/groups/{groupId}`
3. Грузим офферы отдельно, с пагинацией:  
   `GET /catalog/admin/catalog/groups/{groupId}/offers?page=1&limit=50&compact=true`
4. При изменении одного оффера используем:
   - `PATCH /catalog/admin/catalog/offers/{offerId}`
   - или специализированные PATCH endpoints
5. Полный `PUT /catalog/admin/catalog/groups/{groupId}` используем только тогда, когда реально нужна полная пересборка матрицы офферов, например:
   - изменение variationAxes
   - массовая генерация/удаление офферов
   - импорт большой матрицы

---

## Когда использовать какой endpoint

### Создание группы
`POST /catalog/admin/catalog/groups`

Используется когда создается новая группа товара.  
Можно передать:
- группу без офферов
- группу с несколькими офферами
- группу с полной матрицей офферов

### Получение группы
`GET /catalog/admin/catalog/groups/{groupId}`

Используется для загрузки формы товара.  
По умолчанию лучше не тянуть офферы внутри этого ответа.

### Полное обновление группы + офферов
`PUT /catalog/admin/catalog/groups/{groupId}`

Использовать только когда нужно заменить/пересобрать **всю** матрицу офферов.

Очень важно:
- это тяжелый запрос
- нужно передавать **полное актуальное состояние**
- офферы, которых нет в payload, могут быть удалены

### Частичное обновление только группы
`PATCH /catalog/admin/catalog/groups/{groupId}`

Использовать, если меняются только поля группы:
- title
- subtitle
- description
- status
- imageURL
- categoryIds
- characteristics
- slug

Нельзя использовать для:
- variationAxes
- offers

### Получение офферов группы
`GET /catalog/admin/catalog/groups/{groupId}/offers`

Основной endpoint для таблицы офферов в админке.  
Поддерживает:
- пагинацию
- поиск
- compact режим
- фильтрацию по available

### Создание одного оффера
`POST /catalog/admin/catalog/groups/{groupId}/offers`

Используется, если нужно добавить один новый оффер без полного пересохранения всей группы.

### Частичное обновление одного оффера
`PATCH /catalog/admin/catalog/offers/{offerId}`

Используется, если нужно обновить один оффер:
- sku
- price
- opt_price
- available
- img
- optionMap
- characteristics
- stocks

### Быстрые PATCH endpoints
Использовать для inline-редактирования таблицы:
- `PATCH /catalog/admin/catalog/offers/{offerId}/availability`
- `PATCH /catalog/admin/catalog/offers/{offerId}/price`
- `PATCH /catalog/admin/catalog/offers/{offerId}/stocks`

### Удаление одного оффера
`DELETE /catalog/admin/catalog/offers/{offerId}`

---

## Оптимизация фронта при 400+ офферах

### Обязательно
- не хранить 400+ офферов в одном огромном form state, если это не bulk editor
- использовать серверную пагинацию
- для таблицы использовать `compact=true`
- для быстрого редактирования использовать PATCH endpoints
- использовать debounce для поиска
- использовать виртуализацию таблицы, если рендерите большие списки
- не делать full PUT ради изменения цены у одного оффера

### Рекомендуемые размеры страниц
- default: `50`
- комфортно: `50–100`
- максимум с осторожностью: `200`

### Рекомендуемый UX
- верх страницы: форма группы
- низ страницы: таблица офферов
- таблица офферов грузится отдельным запросом
- изменение строки таблицы делает PATCH только этой строки
- изменение variationAxes переводит экран в режим полной пересборки

### Когда `compact=true`
Используйте `compact=true`, если нужно:
- показать список офферов в таблице
- отрисовать минимальный набор полей
- ускорить загрузку
- не тянуть тяжелые characteristics, если они не нужны в таблице

---

## Важные правила для фронта

### Правило 1
Если изменились `variationAxes`, старые офферы в прежнем виде больше невалидны, если у них нет значений для новых осей.

Пример:  

было:
- A1
- A2

стало:
- A1
- A2
- A3

Тогда каждый оффер должен иметь:

```json
{
  "optionMap": {
    "A1": "...",
    "A2": "...",
    "A3": "..."
  }
}
```

### Правило 2
При `PUT /groups/{groupId}` фронт должен отправлять **полное** состояние группы и офферов, а не только изменения.

### Правило 3
При `PATCH /groups/{groupId}` нельзя передавать `variationAxes` и `offers`.

### Правило 4
При `PATCH /offers/{offerId}` если меняется `optionMap`, backend:
- пересоберет `optionValues`
- пересоберет `optionKey`
- проверит уникальность новой комбинации

### Правило 5
SKU должен быть уникален глобально.

### Правило 6
Комбинация вариаций внутри группы должна быть уникальна.  
То есть два оффера не могут иметь одинаковый `optionMap`, дающий один и тот же `optionKey`.

---

# Frontend integration guide

## Главный принцип архитектуры фронта

Для этого API нельзя строить админку как:
- один гигантский form state
- одна кнопка Save
- при любом изменении пересылаем весь товар вместе с 400 офферами

Это начнет:
- тормозить
- давать тяжелые ререндеры
- ломать UX
- усложнять сохранения
- создавать лишнюю нагрузку на фронт и бэк

Правильная модель:

## Группа товара и офферы — это 2 независимых слоя UI

### Слой 1. Форма группы
Хранит:
- slug
- title
- subtitle
- description
- categoryIds
- imageURL
- status
- characteristics
- variationAxes

### Слой 2. Таблица офферов
Хранит отдельно:
- текущую страницу офферов
- пагинацию
- фильтры
- локальный editing state строки/модалки
- загрузки patch/create/delete

То есть с точки зрения интерфейса это может быть **одна страница**, но с точки зрения состояния это должны быть **две разные подсистемы**.

---

## Как должна выглядеть страница товара

### Блок A. Основные данные группы
Поля:
- slug
- title.ua / title.ru
- subtitle.ua / subtitle.ru
- description.ua / description.ru
- imageURL
- status
- categoryIds

### Блок B. Characteristics группы
Редактор group-level characteristics

### Блок C. Variation Axes
Редактор:
- список осей
- axisId
- title
- type
- unit
- valuesPreset

### Блок D. Offers table
Отдельный список:
- пагинация
- поиск
- фильтры
- редактирование строки
- добавление оффера
- удаление оффера

### Блок E. Full rebuild mode
Отдельный режим / действие, когда:
- меняются variationAxes
- нужно перестроить матрицу офферов
- возможно bulk-редактирование

---

## Какими запросами грузить страницу

### При открытии страницы редактирования товара

#### Шаг 1. Получить группу
Запрос:

```http
GET /catalog/admin/catalog/groups/{groupId}
```

Без `includeOffers=true`.

#### Почему без офферов
Потому что если у товара 400+ офферов, это лишняя нагрузка:
- тяжелый ответ
- лишний парсинг JSON
- лишние ререндеры
- лишний memory footprint

#### Шаг 2. Получить первую страницу офферов
Запрос:

```http
GET /catalog/admin/catalog/groups/{groupId}/offers?page=1&limit=50&compact=true
```

#### Почему `compact=true`
Для таблицы обычно нужны:
- sku
- price
- opt_price
- available
- optionMap
- optionKey
- stocks
- maybe updatedAt

Не всегда нужны:
- полные characteristics
- все тяжелые вложенные поля

---

## Какой state лучше держать на фронте

### Group state

```ts
type GroupFormState = {
  _id: string;
  slug: string;
  title: {
    ua: string;
    ru: string;
  };
  subtitle: {
    ua: string;
    ru: string;
  };
  description: {
    ua: string;
    ru: string;
  };
  imageURL: string;
  status: "active" | "draft" | "hidden";
  categoryIds: string[];
  characteristics: CharacteristicInput[];
  variationAxes: VariationAxisInput[];

  isDirty: boolean;
  isSaving: boolean;
  saveError: string | null;
};
```

### Offers table state

```ts
type OffersTableState = {
  items: OfferRow[];
  meta: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };

  filters: {
    q: string;
    sku: string;
    available: boolean | null;
    compact: boolean;
  };

  isLoading: boolean;
  loadError: string | null;

  rowUpdatingIds: string[];
  rowDeletingIds: string[];
  creating: boolean;
};
```

### Draft state для оффера в модалке/дроуэре

```ts
type OfferEditorState = {
  mode: "create" | "edit";
  offerId: string | null;
  values: {
    sku: string;
    price: number | null;
    opt_price: number | null;
    available: boolean;
    img: string;
    optionMap: Record<string, string | number>;
    stocks: StockRowInput[];
    characteristics: CharacteristicInput[];
  };

  isOpen: boolean;
  isSaving: boolean;
  error: string | null;
};
```

---

## Как организовать сохранение группы

### Для обычной формы группы
Использовать:

```http
PATCH /catalog/admin/catalog/groups/{groupId}
```

Когда меняются:
- slug
- title
- subtitle
- description
- imageURL
- status
- categoryIds
- characteristics

### Почему PATCH
Потому что это дешево:
- маленький payload
- быстрое сохранение
- меньше рисков
- не надо трогать офферы

### Когда использовать PUT
Использовать:

```http
PUT /catalog/admin/catalog/groups/{groupId}
```

только если:
- меняются variationAxes
- полностью пересобирается набор офферов
- нужен массовый импорт состояния товара

---

## Как организовать работу с офферами

### Базовая таблица
В таблице офферов обычно показывать:
- sku
- optionMap / отображение комбинации
- price
- opt_price
- available
- остатки
- updatedAt

И кнопки:
- edit
- delete
- toggle available
- quick price edit

### Изменение available
Использовать:

```http
PATCH /catalog/admin/catalog/offers/{offerId}/availability
```

Payload:

```json
{
  "available": true
}
```

### Изменение price / opt_price
Использовать:

```http
PATCH /catalog/admin/catalog/offers/{offerId}/price
```

Payload:

```json
{
  "price": 999,
  "opt_price": 899
}
```

Или:

```json
{
  "opt_price": null
}
```

### Изменение stocks
Использовать:

```http
PATCH /catalog/admin/catalog/offers/{offerId}/stocks
```

Payload полностью заменяет `stocks`.

### Изменение сложного набора полей оффера
Если нужно изменить:
- sku
- img
- optionMap
- characteristics
- stocks
- available
- price

использовать:

```http
PATCH /catalog/admin/catalog/offers/{offerId}
```

### Создание нового оффера
Использовать:

```http
POST /catalog/admin/catalog/groups/{groupId}/offers
```

#### После успешного создания
Есть 2 стратегии:

##### Стратегия A — reload страницы офферов
Повторно вызвать:
```http
GET /catalog/admin/catalog/groups/{groupId}/offers?page=current&limit=currentLimit&compact=true
```

##### Стратегия B — оптимистично вставить строку
Подходит, если UI и сортировка простые.

Для надежности в админке чаще лучше reload текущей страницы.

### Удаление оффера
Использовать:

```http
DELETE /catalog/admin/catalog/offers/{offerId}
```

После успешного удаления:
- либо reload текущей страницы
- либо локально удалить строку и при необходимости подгрузить следующую

Для простоты и надежности лучше reload текущей страницы.

---

## Как работать с variationAxes

Это самая чувствительная часть.

### Главный принцип
Если меняются variationAxes, текущие офферы могут стать невалидными.

Пример:

было:
- A1 = taste
- A2 = count

стало:
- A1 = taste
- A2 = count
- A3 = packaging

Тогда все офферы должны иметь:

```json
{
  "optionMap": {
    "A1": "orange",
    "A2": 30,
    "A3": "box"
  }
}
```

### Поэтому UI для variationAxes лучше делать отдельным режимом

#### Не как обычный PATCH
Потому что это не просто изменение группы. Это изменение всей модели вариаций.

#### Рекомендуемый UX
Когда пользователь меняет variationAxes:
- показываешь предупреждение
- переводишь экран в режим “пересборка вариаций”
- либо генерируешь новые офферы на фронте
- либо пользователь вручную доводит матрицу
- потом делаешь `PUT /groups/{groupId}` со всем новым состоянием

---

## Как фронту генерировать офферы при изменении осей

Сейчас на бэке нет отдельного генератора комбинаций, поэтому если хочешь хороший UX, генерацию можно сделать на фронте.

### Пример
Есть axes:
- A1 = [orange, berry]
- A2 = [30, 60]
- A3 = [box, pouch]

Нужно построить декартово произведение:

- orange / 30 / box
- orange / 30 / pouch
- orange / 60 / box
- orange / 60 / pouch
- berry / 30 / box
- berry / 30 / pouch
- berry / 60 / box
- berry / 60 / pouch

### Что фронт должен сделать
Сгенерировать `optionMap` для каждой комбинации.

Например:

```json
{
  "optionMap": {
    "A1": "orange",
    "A2": 30,
    "A3": "box"
  }
}
```

И далее пользователь/интерфейс заполняет:
- sku
- price
- opt_price
- available
- img
- characteristics
- stocks

---

## Что делать при 400+ офферах

### Обязательные рекомендации

#### 1. Серверная пагинация
Никогда не пытаться загружать все 400+ офферов по умолчанию.

#### 2. Compact режим
Для таблицы использовать `compact=true`.

#### 3. Не держать все офферы в одном большом form state
Это очень важно.

#### 4. Inline editing только patch-ами
Одна строка — один patch.

#### 5. Виртуализация
Если даже одна страница 100 строк, лучше использовать виртуализацию таблицы.

#### 6. Дебаунс поиска
При `q` и `sku` использовать debounce 300–500ms.

#### 7. Не делать full PUT без необходимости
Это должен быть осознанный action, а не дефолтный save.

---

## Как лучше строить UX на одной странице

Ты сказал, что страница будет одной. Это ок.

Правильная реализация одной страницы:

### Верх
Форма группы:
- slug
- titles
- subtitle
- description
- categoryIds
- imageURL
- status
- group characteristics
- variationAxes

### Низ
Офферы:
- табличный блок
- поиск
- фильтры
- пагинация
- add offer
- edit offer
- delete offer
- patch actions

Это **одна страница визуально**, но **не один общий form state**.

---

## Когда что сохранять

### Save group
Кнопка “Сохранить группу” → `PATCH /groups/{id}`

### Save variation axes / rebuild matrix
Кнопка “Пересобрать вариации / Сохранить всю матрицу” → `PUT /groups/{id}`

### Save offer row
Patch отдельного оффера → `PATCH /offers/{offerId}`

### Quick toggle
`PATCH /offers/{offerId}/availability`

### Quick price
`PATCH /offers/{offerId}/price`

### Quick stocks
`PATCH /offers/{offerId}/stocks`

---

## Как обновлять UI после запросов

### После PATCH group
Обновить локальный group state по ответу.

### После PATCH offer
Обновить конкретную строку в таблице по ответу.

### После POST offer
Лучше перезагрузить текущую страницу офферов.

### После DELETE offer
Лучше перезагрузить текущую страницу офферов.

### После PUT group
Нужно:
- обновить group state
- заново загрузить офферы, потому что матрица могла поменяться

---

## Как обрабатывать ошибки

### Ошибки, которые будут встречаться часто
- `Invalid groupId`
- `Invalid offerId`
- `Slug already exists`
- `SKU already exists`
- `Variant combination already exists`
- `offers[0].optionMap.A3 is required because this axis exists in variationAxes`

### Рекомендация по UX
Показывать такие ошибки:
- либо в верхнем alert
- либо рядом с формой
- либо возле конкретного offer editor

Особенно важно красиво показать:
- конфликт sku
- конфликт комбинации вариации
- ошибку неполного optionMap при смене осей

---

## Что бы я рекомендовал не делать

- не тащить все офферы внутри `GET group` по умолчанию
- не делать full PUT на каждое изменение
- не хранить гигантский nested form на весь товар
- не считать optionKey на фронте как источник истины
- не полагаться на client-side uniqueness без server validation
- не делать refetch всей страницы после каждого toggle, если можно обновить одну строку
- но и не усложнять optimistic UI раньше времени

---

## Рекомендуемый frontend API layer

Набор методов, который стоит сделать на фронте:

### Groups
- `fetchAdminCatalogGroups(params)`
- `fetchAdminCatalogGroupById(groupId, params)`
- `createAdminCatalogGroup(payload)`
- `updateAdminCatalogGroup(groupId, payload)` → full PUT
- `patchAdminCatalogGroup(groupId, payload)`
- `deleteAdminCatalogGroup(groupId)`

### Offers
- `fetchAdminCatalogGroupOffers(groupId, params)`
- `createAdminCatalogOffer(groupId, payload)`
- `patchAdminCatalogOffer(offerId, payload)`
- `patchAdminCatalogOfferAvailability(offerId, payload)`
- `patchAdminCatalogOfferPrice(offerId, payload)`
- `patchAdminCatalogOfferStocks(offerId, payload)`
- `deleteAdminCatalogOffer(offerId)`

---

# Примеры запросов и ответов

## 1. Получить список групп

### Request
```http
GET /catalog/admin/catalog/groups?page=1&limit=20&q=vitamin&status=active
```

### Response
```json
{
  "items": [
    {
      "_id": "69aaf53efcc1f31d1fda65ed",
      "slug": "vitamin-c-liposomal-t003",
      "title": {
        "ua": "Вітамін C Ліпосомальний (t003)",
        "ru": "Витамин C Липосомальный (t003)"
      },
      "subtitle": {
        "ua": "Ніжний догляд для щоденного використання",
        "ru": "Нежный уход для ежедневного использования"
      },
      "description": {
        "ua": "Якісний товар для щоденного використання.",
        "ru": "Качественный товар для ежедневного использования."
      },
      "categoryIds": [
        "696f9c4ab7919bf78623d905"
      ],
      "imageURL": "https://i.postimg.cc/8k2LRmzP/fallback.webp",
      "variationAxes": [
        {
          "axisId": "A1",
          "title": {
            "ua": "Смак",
            "ru": "Вкус"
          },
          "type": "select",
          "unit": null,
          "valuesPreset": ["orange", "berry"]
        },
        {
          "axisId": "A2",
          "title": {
            "ua": "Кількість",
            "ru": "Количество"
          },
          "type": "number",
          "unit": "caps",
          "valuesPreset": [30, 60]
        }
      ],
      "characteristics": [],
      "status": "active",
      "createdAt": "2026-03-06T15:39:42.311Z",
      "updatedAt": "2026-03-27T09:31:21.114Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "pages": 1
  }
}
```

---

## 2. Получить группу без офферов

### Request
```http
GET /catalog/admin/catalog/groups/69aaf53efcc1f31d1fda65ed
```

### Response
```json
{
  "item": {
    "_id": "69aaf53efcc1f31d1fda65ed",
    "slug": "vitamin-c-liposomal-t003",
    "title": {
      "ua": "Вітамін C Ліпосомальний (t003)",
      "ru": "Витамин C Липосомальный (t003)"
    },
    "subtitle": {
      "ua": "Ніжний догляд для щоденного використання",
      "ru": "Нежный уход для ежедневного использования"
    },
    "description": {
      "ua": "Якісний товар для щоденного використання.",
      "ru": "Качественный товар для ежедневного использования."
    },
    "categoryIds": [
      "696f9c4ab7919bf78623d905"
    ],
    "imageURL": "https://i.postimg.cc/8k2LRmzP/fallback.webp",
    "variationAxes": [
      {
        "axisId": "A1",
        "title": {
          "ua": "Смак",
          "ru": "Вкус"
        },
        "type": "select",
        "unit": null,
        "valuesPreset": ["orange", "berry"]
      },
      {
        "axisId": "A2",
        "title": {
          "ua": "Кількість",
          "ru": "Количество"
        },
        "type": "number",
        "unit": "caps",
        "valuesPreset": [30, 60]
      }
    ],
    "characteristics": [
      {
        "key": "brand",
        "type": "select",
        "unit": null,
        "value": {
          "value": "MST",
          "label": {
            "ua": "MST",
            "ru": "MST"
          }
        },
        "values": []
      }
    ],
    "status": "active",
    "createdAt": "2026-03-06T15:39:42.311Z",
    "updatedAt": "2026-03-27T09:31:21.114Z",
    "offers": [],
    "offersMeta": {
      "page": 1,
      "limit": 50,
      "total": 0,
      "pages": 0,
      "included": false
    }
  }
}
```

---

## 3. Получить группу с вложенной страницей офферов

### Request
```http
GET /catalog/admin/catalog/groups/69aaf53efcc1f31d1fda65ed?includeOffers=true&offersPage=1&offersLimit=2
```

### Response
```json
{
  "item": {
    "_id": "69aaf53efcc1f31d1fda65ed",
    "slug": "vitamin-c-liposomal-t003",
    "title": {
      "ua": "Вітамін C Ліпосомальний (t003)",
      "ru": "Витамин C Липосомальный (t003)"
    },
    "subtitle": {
      "ua": "Ніжний догляд для щоденного використання",
      "ru": "Нежный уход для ежедневного использования"
    },
    "description": {
      "ua": "Якісний товар для щоденного використання.",
      "ru": "Качественный товар для ежедневного использования."
    },
    "categoryIds": [
      "696f9c4ab7919bf78623d905"
    ],
    "imageURL": "https://i.postimg.cc/8k2LRmzP/fallback.webp",
    "variationAxes": [
      {
        "axisId": "A1",
        "title": {
          "ua": "Смак",
          "ru": "Вкус"
        },
        "type": "select",
        "unit": null,
        "valuesPreset": ["orange", "berry"]
      },
      {
        "axisId": "A2",
        "title": {
          "ua": "Кількість",
          "ru": "Количество"
        },
        "type": "number",
        "unit": "caps",
        "valuesPreset": [30, 60]
      }
    ],
    "characteristics": [],
    "status": "active",
    "createdAt": "2026-03-06T15:39:42.311Z",
    "updatedAt": "2026-03-27T09:31:21.114Z",
    "offers": [
      {
        "_id": "69aaf53efcc1f31d1fda65f4",
        "groupId": "69aaf53efcc1f31d1fda65ed",
        "sku": "VITC-ORANGE-30-t003",
        "price": 593,
        "opt_price": null,
        "available": true,
        "img": "https://i.postimg.cc/8k2LRmzP/fallback.webp",
        "optionMap": {
          "A1": "orange",
          "A2": 30
        },
        "optionValues": ["orange", 30],
        "optionKey": "orange|30",
        "stocks": [
          {
            "warehouseId": "69c470e7475b219c3e3255a0",
            "onHand": 10,
            "reserved": 0
          }
        ],
        "characteristics": [],
        "createdAt": "2026-03-06T15:39:42.311Z",
        "updatedAt": "2026-03-25T23:34:00.500Z"
      }
    ],
    "offersMeta": {
      "page": 1,
      "limit": 2,
      "total": 4,
      "pages": 2,
      "included": true
    }
  }
}
```

---

## 4. Создать группу с офферами

### Request
```http
POST /catalog/admin/catalog/groups
Content-Type: application/json
```

```json
{
  "slug": "vitamin-c-liposomal-t003",
  "categoryIds": ["696f9c4ab7919bf78623d905"],
  "status": "active",
  "imageURL": "https://i.postimg.cc/8k2LRmzP/fallback.webp",
  "title": {
    "ua": "Вітамін C Ліпосомальний (t003)",
    "ru": "Витамин C Липосомальный (t003)"
  },
  "subtitle": {
    "ua": "Ніжний догляд для щоденного використання",
    "ru": "Нежный уход для ежедневного использования"
  },
  "description": {
    "ua": "Якісний товар для щоденного використання. Підходить для регулярного догляду.",
    "ru": "Качественный товар для ежедневного использования. Подходит для регулярного ухода."
  },
  "variationAxes": [
    {
      "axisId": "A1",
      "title": {
        "ua": "Смак",
        "ru": "Вкус"
      },
      "type": "select",
      "unit": null,
      "valuesPreset": ["orange", "berry"]
    },
    {
      "axisId": "A2",
      "title": {
        "ua": "Кількість",
        "ru": "Количество"
      },
      "type": "number",
      "unit": "caps",
      "valuesPreset": [30, 60]
    }
  ],
  "characteristics": [
    {
      "key": "brand",
      "type": "select",
      "unit": null,
      "value": {
        "value": "MST",
        "label": {
          "ua": "MST",
          "ru": "MST"
        }
      },
      "values": []
    }
  ],
  "offers": [
    {
      "sku": "VITC-ORANGE-30-t003",
      "price": 593,
      "opt_price": null,
      "available": true,
      "img": "https://i.postimg.cc/8k2LRmzP/fallback.webp",
      "optionMap": {
        "A1": "orange",
        "A2": 30
      },
      "stocks": [
        {
          "warehouseId": "69c470e7475b219c3e3255a0",
          "onHand": 10,
          "reserved": 0
        }
      ],
      "characteristics": []
    }
  ]
}
```

### Response
```json
{
  "ok": true,
  "item": {
    "_id": "69aaf53efcc1f31d1fda65ed",
    "slug": "vitamin-c-liposomal-t003",
    "title": {
      "ua": "Вітамін C Ліпосомальний (t003)",
      "ru": "Витамин C Липосомальный (t003)"
    },
    "subtitle": {
      "ua": "Ніжний догляд для щоденного використання",
      "ru": "Нежный уход для ежедневного использования"
    },
    "description": {
      "ua": "Якісний товар для щоденного використання. Підходить для регулярного догляду.",
      "ru": "Качественный товар для ежедневного использования. Подходит для регулярного ухода."
    },
    "categoryIds": [
      "696f9c4ab7919bf78623d905"
    ],
    "imageURL": "https://i.postimg.cc/8k2LRmzP/fallback.webp",
    "variationAxes": [
      {
        "axisId": "A1",
        "title": {
          "ua": "Смак",
          "ru": "Вкус"
        },
        "type": "select",
        "unit": null,
        "valuesPreset": ["orange", "berry"]
      },
      {
        "axisId": "A2",
        "title": {
          "ua": "Кількість",
          "ru": "Количество"
        },
        "type": "number",
        "unit": "caps",
        "valuesPreset": [30, 60]
      }
    ],
    "characteristics": [
      {
        "key": "brand",
        "type": "select",
        "unit": null,
        "value": {
          "value": "MST",
          "label": {
            "ua": "MST",
            "ru": "MST"
          }
        },
        "values": []
      }
    ],
    "status": "active",
    "createdAt": "2026-03-06T15:39:42.311Z",
    "updatedAt": "2026-03-06T15:39:42.311Z",
    "offersMeta": {
      "page": 1,
      "limit": 50,
      "total": 1,
      "pages": 1,
      "included": false
    }
  }
}
```

---

## 5. PATCH группы

### Request
```http
PATCH /catalog/admin/catalog/groups/69aaf53efcc1f31d1fda65ed
Content-Type: application/json
```

```json
{
  "title": {
    "ua": "Оновлена назва",
    "ru": "Обновленное название"
  },
  "subtitle": {
    "ua": "Оновлений підзаголовок",
    "ru": "Обновленный подзаголовок"
  },
  "status": "active"
}
```

### Response
```json
{
  "ok": true,
  "item": {
    "_id": "69aaf53efcc1f31d1fda65ed",
    "slug": "vitamin-c-liposomal-t003",
    "title": {
      "ua": "Оновлена назва",
      "ru": "Обновленное название"
    },
    "subtitle": {
      "ua": "Оновлений підзаголовок",
      "ru": "Обновленный подзаголовок"
    },
    "description": {
      "ua": "Якісний товар для щоденного використання.",
      "ru": "Качественный товар для ежедневного использования."
    },
    "categoryIds": [
      "696f9c4ab7919bf78623d905"
    ],
    "imageURL": "https://i.postimg.cc/8k2LRmzP/fallback.webp",
    "variationAxes": [],
    "characteristics": [],
    "status": "active",
    "createdAt": "2026-03-06T15:39:42.311Z",
    "updatedAt": "2026-04-04T10:00:00.000Z"
  }
}
```

---

## 6. Полный PUT группы с пересборкой офферов

### Request
```http
PUT /catalog/admin/catalog/groups/69aaf53efcc1f31d1fda65ed
Content-Type: application/json
```

```json
{
  "slug": "vitamin-c-liposomal-t003",
  "categoryIds": ["696f9c4ab7919bf78623d905"],
  "status": "active",
  "imageURL": "https://i.postimg.cc/8k2LRmzP/fallback.webp",
  "title": {
    "ua": "Вітамін C Ліпосомальний (t003)",
    "ru": "Витамин C Липосомальный (t003)"
  },
  "subtitle": {
    "ua": "Ніжний догляд для щоденного використання",
    "ru": "Нежный уход для ежедневного использования"
  },
  "description": {
    "ua": "Оновлений опис товару.",
    "ru": "Обновленное описание товара."
  },
  "variationAxes": [
    {
      "axisId": "A1",
      "title": {
        "ua": "Смак",
        "ru": "Вкус"
      },
      "type": "select",
      "unit": null,
      "valuesPreset": ["orange", "berry"]
    },
    {
      "axisId": "A2",
      "title": {
        "ua": "Кількість",
        "ru": "Количество"
      },
      "type": "number",
      "unit": "caps",
      "valuesPreset": [30, 60]
    },
    {
      "axisId": "A3",
      "title": {
        "ua": "Формат",
        "ru": "Формат"
      },
      "type": "select",
      "unit": null,
      "valuesPreset": ["box", "pouch"]
    }
  ],
  "characteristics": [],
  "offers": [
    {
      "_id": "69aaf53efcc1f31d1fda65f4",
      "sku": "VITC-ORANGE-30-BOX-t003",
      "price": 593,
      "opt_price": null,
      "available": true,
      "img": "https://i.postimg.cc/8k2LRmzP/fallback.webp",
      "optionMap": {
        "A1": "orange",
        "A2": 30,
        "A3": "box"
      },
      "stocks": [
        {
          "warehouseId": "69c470e7475b219c3e3255a0",
          "onHand": 10,
          "reserved": 0
        }
      ],
      "characteristics": []
    },
    {
      "sku": "VITC-BERRY-60-POUCH-t003",
      "price": 1299,
      "opt_price": null,
      "available": true,
      "img": "https://i.postimg.cc/8k2LRmzP/fallback.webp",
      "optionMap": {
        "A1": "berry",
        "A2": 60,
        "A3": "pouch"
      },
      "stocks": [
        {
          "warehouseId": "69c470e7475b219c3e3255a0",
          "onHand": 8,
          "reserved": 0
        }
      ],
      "characteristics": []
    }
  ]
}
```

### Response
```json
{
  "ok": true,
  "item": {
    "_id": "69aaf53efcc1f31d1fda65ed",
    "slug": "vitamin-c-liposomal-t003",
    "title": {
      "ua": "Вітамін C Ліпосомальний (t003)",
      "ru": "Витамин C Липосомальный (t003)"
    },
    "subtitle": {
      "ua": "Ніжний догляд для щоденного використання",
      "ru": "Нежный уход для ежедневного использования"
    },
    "description": {
      "ua": "Оновлений опис товару.",
      "ru": "Обновленное описание товара."
    },
    "categoryIds": [
      "696f9c4ab7919bf78623d905"
    ],
    "imageURL": "https://i.postimg.cc/8k2LRmzP/fallback.webp",
    "variationAxes": [
      {
        "axisId": "A1",
        "title": {
          "ua": "Смак",
          "ru": "Вкус"
        },
        "type": "select",
        "unit": null,
        "valuesPreset": ["orange", "berry"]
      },
      {
        "axisId": "A2",
        "title": {
          "ua": "Кількість",
          "ru": "Количество"
        },
        "type": "number",
        "unit": "caps",
        "valuesPreset": [30, 60]
      },
      {
        "axisId": "A3",
        "title": {
          "ua": "Формат",
          "ru": "Формат"
        },
        "type": "select",
        "unit": null,
        "valuesPreset": ["box", "pouch"]
      }
    ],
    "characteristics": [],
    "status": "active",
    "createdAt": "2026-03-06T15:39:42.311Z",
    "updatedAt": "2026-04-04T10:20:00.000Z",
    "offersMeta": {
      "page": 1,
      "limit": 50,
      "total": 2,
      "pages": 1,
      "included": false
    }
  }
}
```

---

## 7. Получить офферы группы для таблицы

### Request
```http
GET /catalog/admin/catalog/groups/69aaf53efcc1f31d1fda65ed/offers?page=1&limit=50&compact=true
```

### Response
```json
{
  "items": [
    {
      "_id": "69aaf53efcc1f31d1fda65f4",
      "sku": "VITC-ORANGE-30-BOX-t003",
      "price": 593,
      "opt_price": null,
      "available": true,
      "img": "https://i.postimg.cc/8k2LRmzP/fallback.webp",
      "optionMap": {
        "A1": "orange",
        "A2": 30,
        "A3": "box"
      },
      "optionKey": "orange|30|box",
      "stocks": [
        {
          "warehouseId": "69c470e7475b219c3e3255a0",
          "onHand": 10,
          "reserved": 0
        }
      ],
      "updatedAt": "2026-04-04T10:20:00.000Z"
    },
    {
      "_id": "69aaf53efcc1f31d1fda65f8",
      "sku": "VITC-BERRY-60-POUCH-t003",
      "price": 1299,
      "opt_price": null,
      "available": true,
      "img": "https://i.postimg.cc/8k2LRmzP/fallback.webp",
      "optionMap": {
        "A1": "berry",
        "A2": 60,
        "A3": "pouch"
      },
      "optionKey": "berry|60|pouch",
      "stocks": [
        {
          "warehouseId": "69c470e7475b219c3e3255a0",
          "onHand": 8,
          "reserved": 0
        }
      ],
      "updatedAt": "2026-04-04T10:20:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 50,
    "total": 2,
    "pages": 1
  }
}
```

---

## 8. Поиск офферов по sku

### Request
```http
GET /catalog/admin/catalog/groups/69aaf53efcc1f31d1fda65ed/offers?sku=VITC-BERRY-60-POUCH-t003&compact=true
```

### Response
```json
{
  "items": [
    {
      "_id": "69aaf53efcc1f31d1fda65f8",
      "sku": "VITC-BERRY-60-POUCH-t003",
      "price": 1299,
      "opt_price": null,
      "available": true,
      "img": "https://i.postimg.cc/8k2LRmzP/fallback.webp",
      "optionMap": {
        "A1": "berry",
        "A2": 60,
        "A3": "pouch"
      },
      "optionKey": "berry|60|pouch",
      "stocks": [
        {
          "warehouseId": "69c470e7475b219c3e3255a0",
          "onHand": 8,
          "reserved": 0
        }
      ],
      "updatedAt": "2026-04-04T10:20:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 50,
    "total": 1,
    "pages": 1
  }
}
```

---

## 9. Создать один оффер

### Request
```http
POST /catalog/admin/catalog/groups/69aaf53efcc1f31d1fda65ed/offers
Content-Type: application/json
```

```json
{
  "sku": "VITC-BERRY-30-POUCH-t003",
  "price": 899,
  "opt_price": null,
  "available": true,
  "img": "https://i.postimg.cc/8k2LRmzP/fallback.webp",
  "optionMap": {
    "A1": "berry",
    "A2": 30,
    "A3": "pouch"
  },
  "stocks": [
    {
      "warehouseId": "69c470e7475b219c3e3255a0",
      "onHand": 7,
      "reserved": 0
    }
  ],
  "characteristics": []
}
```

### Response
```json
{
  "ok": true,
  "item": {
    "_id": "69aaf53efcc1f31d1fda6601",
    "groupId": "69aaf53efcc1f31d1fda65ed",
    "sku": "VITC-BERRY-30-POUCH-t003",
    "price": 899,
    "opt_price": null,
    "available": true,
    "img": "https://i.postimg.cc/8k2LRmzP/fallback.webp",
    "optionMap": {
      "A1": "berry",
      "A2": 30,
      "A3": "pouch"
    },
    "optionValues": ["berry", 30, "pouch"],
    "optionKey": "berry|30|pouch",
    "stocks": [
      {
        "warehouseId": "69c470e7475b219c3e3255a0",
        "onHand": 7,
        "reserved": 0
      }
    ],
    "characteristics": [],
    "createdAt": "2026-04-04T11:00:00.000Z",
    "updatedAt": "2026-04-04T11:00:00.000Z"
  }
}
```

---

## 10. PATCH оффера

### Request
```http
PATCH /catalog/admin/catalog/offers/69aaf53efcc1f31d1fda6601
Content-Type: application/json
```

```json
{
  "price": 950,
  "opt_price": 890,
  "available": false,
  "img": "https://cdn.site.com/new-image.webp",
  "characteristics": [
    {
      "key": "tags",
      "type": "multiselect",
      "unit": null,
      "value": null,
      "values": [
        {
          "value": "promo",
          "label": {
            "ua": "Акція",
            "ru": "Акция"
          }
        }
      ]
    }
  ]
}
```

### Response
```json
{
  "ok": true,
  "item": {
    "_id": "69aaf53efcc1f31d1fda6601",
    "groupId": "69aaf53efcc1f31d1fda65ed",
    "sku": "VITC-BERRY-30-POUCH-t003",
    "price": 950,
    "opt_price": 890,
    "available": false,
    "img": "https://cdn.site.com/new-image.webp",
    "optionMap": {
      "A1": "berry",
      "A2": 30,
      "A3": "pouch"
    },
    "optionValues": ["berry", 30, "pouch"],
    "optionKey": "berry|30|pouch",
    "stocks": [
      {
        "warehouseId": "69c470e7475b219c3e3255a0",
        "onHand": 7,
        "reserved": 0
      }
    ],
    "characteristics": [
      {
        "key": "tags",
        "type": "multiselect",
        "unit": null,
        "value": null,
        "values": [
          {
            "value": "promo",
            "label": {
              "ua": "Акція",
              "ru": "Акция"
            }
          }
        ]
      }
    ],
    "createdAt": "2026-04-04T11:00:00.000Z",
    "updatedAt": "2026-04-04T11:10:00.000Z"
  }
}
```

---

## 11. PATCH available у оффера

### Request
```http
PATCH /catalog/admin/catalog/offers/69aaf53efcc1f31d1fda6601/availability
Content-Type: application/json
```

```json
{
  "available": true
}
```

### Response
```json
{
  "ok": true,
  "item": {
    "_id": "69aaf53efcc1f31d1fda6601",
    "groupId": "69aaf53efcc1f31d1fda65ed",
    "sku": "VITC-BERRY-30-POUCH-t003",
    "price": 950,
    "opt_price": 890,
    "available": true,
    "img": "https://cdn.site.com/new-image.webp",
    "optionMap": {
      "A1": "berry",
      "A2": 30,
      "A3": "pouch"
    },
    "optionValues": ["berry", 30, "pouch"],
    "optionKey": "berry|30|pouch",
    "stocks": [
      {
        "warehouseId": "69c470e7475b219c3e3255a0",
        "onHand": 7,
        "reserved": 0
      }
    ],
    "characteristics": [],
    "createdAt": "2026-04-04T11:00:00.000Z",
    "updatedAt": "2026-04-04T11:15:00.000Z"
  }
}
```

---

## 12. PATCH цены оффера

### Request
```http
PATCH /catalog/admin/catalog/offers/69aaf53efcc1f31d1fda6601/price
Content-Type: application/json
```

```json
{
  "price": 999,
  "opt_price": 899
}
```

### Response
```json
{
  "ok": true,
  "item": {
    "_id": "69aaf53efcc1f31d1fda6601",
    "groupId": "69aaf53efcc1f31d1fda65ed",
    "sku": "VITC-BERRY-30-POUCH-t003",
    "price": 999,
    "opt_price": 899,
    "available": true,
    "img": "https://cdn.site.com/new-image.webp",
    "optionMap": {
      "A1": "berry",
      "A2": 30,
      "A3": "pouch"
    },
    "optionValues": ["berry", 30, "pouch"],
    "optionKey": "berry|30|pouch",
    "stocks": [
      {
        "warehouseId": "69c470e7475b219c3e3255a0",
        "onHand": 7,
        "reserved": 0
      }
    ],
    "characteristics": [],
    "createdAt": "2026-04-04T11:00:00.000Z",
    "updatedAt": "2026-04-04T11:20:00.000Z"
  }
}
```

---

## 13. PATCH остатков оффера

### Request
```http
PATCH /catalog/admin/catalog/offers/69aaf53efcc1f31d1fda6601/stocks
Content-Type: application/json
```

```json
{
  "stocks": [
    {
      "warehouseId": "69c470e7475b219c3e3255a0",
      "onHand": 25,
      "reserved": 3
    }
  ]
}
```

### Response
```json
{
  "ok": true,
  "item": {
    "_id": "69aaf53efcc1f31d1fda6601",
    "groupId": "69aaf53efcc1f31d1fda65ed",
    "sku": "VITC-BERRY-30-POUCH-t003",
    "price": 999,
    "opt_price": 899,
    "available": true,
    "img": "https://cdn.site.com/new-image.webp",
    "optionMap": {
      "A1": "berry",
      "A2": 30,
      "A3": "pouch"
    },
    "optionValues": ["berry", 30, "pouch"],
    "optionKey": "berry|30|pouch",
    "stocks": [
      {
        "warehouseId": "69c470e7475b219c3e3255a0",
        "onHand": 25,
        "reserved": 3
      }
    ],
    "characteristics": [],
    "createdAt": "2026-04-04T11:00:00.000Z",
    "updatedAt": "2026-04-04T11:25:00.000Z"
  }
}
```

---

## 14. Удалить оффер

### Request
```http
DELETE /catalog/admin/catalog/offers/69aaf53efcc1f31d1fda6601
```

### Response
```json
{
  "ok": true
}
```

---

## 15. Удалить группу

### Request
```http
DELETE /catalog/admin/catalog/groups/69aaf53efcc1f31d1fda65ed
```

### Response
```json
{
  "ok": true
}
```

---

## 16. Типовые ошибки

### Ошибка невалидного groupId
```json
{
  "message": "Invalid groupId",
  "code": "BAD_REQUEST"
}
```

### Ошибка невалидного offerId
```json
{
  "message": "Invalid offerId",
  "code": "BAD_REQUEST"
}
```

### Ошибка отсутствующей группы
```json
{
  "message": "ProductGroup not found",
  "code": "NOT_FOUND"
}
```

### Ошибка отсутствующего оффера
```json
{
  "message": "Offer not found",
  "code": "NOT_FOUND"
}
```

### Дубликат slug
```json
{
  "message": "Slug already exists",
  "code": "CONFLICT"
}
```

### Дубликат SKU
```json
{
  "message": "SKU already exists: VITC-BERRY-60-BOX-t003",
  "code": "CONFLICT"
}
```

### Дубликат комбинации вариации
```json
{
  "message": "Variant combination already exists: berry|60|box",
  "code": "CONFLICT"
}
```

### Неполный optionMap после добавления новой оси
Если новая ось пришла из `variationTemplate` категории, оффер можно сохранить и без неё: backend пропустит пустое значение и не запишет такую ось в `optionMap`.

Если ось является собственной осью группы, а не шаблонной, пустое значение по-прежнему приводит к `BAD_REQUEST`.

---

# Финальные рекомендации для фронта

## Обязательно делать так
- группа отдельно
- офферы отдельно
- офферы страницами
- patch для точечных изменений
- full put только для полной пересборки

## Не делать так
- не загружать все офферы по умолчанию
- не держать один giant form state
- не делать full put для цены одного оффера
- не считать optionKey как источник истины на клиенте

## Лучший рабочий UX
- одна страница визуально
- но разные state slices и разные запросы
- форма группы сверху
- таблица офферов снизу
- inline patch actions
- rebuild mode отдельно
