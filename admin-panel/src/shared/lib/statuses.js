const STATUS_LABELS_UK = {
  active: 'Активний',
  hidden: 'Прихований',
  draft: 'Чернетка',
  blocked: 'Заблокований',
  pending: 'Очікує',
  new: 'Нове',
  processing: 'Обробляється',
  shipped: 'Відправлено',
  delivered: 'Доставлено',
  canceled: 'Скасовано',
  cancelled: 'Скасовано',
  unpaid: 'Не оплачено',
  paid: 'Оплачено',
  partially_paid: 'Частково оплачено',
  failed: 'Оплату відхилено',
  refunded: 'Повернено',
  waiting_for_client: 'Очікує клієнта',
  waiting_for_store_confirm: 'Очікує підтвердження магазину',
  published: 'Опубліковано',
  archived: 'Архівовано',
  applied: 'Застосовано',
  inactive: 'Неактивний',
  visible: 'Видимий',
};

const FILTER_STATUS_LABELS_UK = {
  active: 'Активні',
  hidden: 'Приховані',
  draft: 'Чернетки',
  blocked: 'Заблоковані',
  pending: 'В очікуванні',
  new: 'Нові',
  processing: 'В обробці',
  shipped: 'Відправлені',
  delivered: 'Доставлені',
  canceled: 'Скасовані',
  cancelled: 'Скасовані',
  unpaid: 'Не оплачені',
  paid: 'Оплачені',
  partially_paid: 'Частково оплачені',
  failed: 'Неуспішні',
  refunded: 'Повернені',
  waiting_for_client: 'Очікують клієнта',
  waiting_for_store_confirm: 'Очікують підтвердження магазину',
  published: 'Опубліковані',
  archived: 'Архівні',
  applied: 'Застосовані',
  inactive: 'Неактивні',
  visible: 'Видимі',
};

const normalizeStatus = (status) => String(status || '').trim().toLowerCase();

export const getStatusLabel = (status, fallback = 'Невідомо') => {
  if (typeof status === 'boolean') {
    return status ? 'Опубліковано' : 'Приховано';
  }

  const normalizedStatus = normalizeStatus(status);
  return STATUS_LABELS_UK[normalizedStatus] || status || fallback;
};

export const getStatusOptions = (
  values = [],
  { includeAll = false, allLabel = 'Всі', labelType = 'filter' } = {}
) => {
  const dictionary = labelType === 'filter' ? FILTER_STATUS_LABELS_UK : STATUS_LABELS_UK;
  const options = values.map((value) => ({
    value,
    label: dictionary[normalizeStatus(value)] || getStatusLabel(value),
  }));

  return includeAll ? [{ label: allLabel, value: '' }, ...options] : options;
};

export const BOOLEAN_VISIBILITY_OPTIONS = [
  { label: 'Всі', value: '' },
  { label: 'Опубліковані', value: true },
  { label: 'Приховані', value: false },
];
