# Perfect Parfums monitoring

Docker поднимает только мониторинг: Prometheus, Loki, Promtail и Grafana.
Сам API запускается отдельно, например через PM2, и должен быть доступен на хосте:

```text
http://localhost:5007
```

## Перед запуском

После изменений в observability-коде перезапусти PM2-сервер, чтобы API начал отдавать `/metrics` и писать JSON-логи:

```bash
pm2 restart perfect-parfums-api --update-env
```

Проверь с хоста:

```bash
curl http://localhost:5007/health
curl http://localhost:5007/metrics
```

## Запуск мониторинга

Из корня репозитория:

```bash
npm run monitoring:up
```

Если раньше уже запускался стек с контейнерным API, сначала очисти старые контейнеры:

```bash
npm run monitoring:down
npm run monitoring:up
```

Открыть:

- Grafana: `http://localhost:3011`
- Prometheus: `http://localhost:9090`
- Loki: `http://localhost:3100`
- API metrics: `http://localhost:5007/metrics`

Grafana credentials:

- Login: `admin`
- Password: `admin`

Если порт `3011` тоже занят, можно выбрать другой без правки compose:

```bash
GRAFANA_PORT=3012 npm run monitoring:up
```

## Если Grafana пустая или белая

Проверь, видит ли Prometheus PM2-сервер:

```bash
curl "http://localhost:9090/api/v1/query?query=up%7Bjob%3D%22perfect-parfums-api%22%7D"
```

Если значение `0` или результата нет, значит Prometheus не достучался до `http://127.0.0.1:5007/metrics`.
Сначала проверь на хосте:

```bash
curl http://localhost:5007/metrics
```

Если `/metrics` не найден, перезапусти PM2 после обновления кода:

```bash
pm2 restart perfect-parfums-api --update-env
```

Нормальный ответ `/metrics` начинается примерно так:

```text
# HELP perfect_parfums_api_up Perfect Parfums API availability gauge.
# TYPE perfect_parfums_api_up gauge
perfect_parfums_api_up 1
```

Если Grafana осталась в светлой теме из старого volume, можно сбросить только её volume:

```bash
npm run monitoring:down
docker volume rm perfectparfums_grafana-data
npm run monitoring:up
```

## Как Docker видит PM2 API

Prometheus запущен в `host` network и обращается к PM2 API так же, как успешный curl с сервера:

```text
127.0.0.1:5007
```

Grafana остаётся в обычной Docker-сети и подключается к Prometheus через:

```text
host.docker.internal:9090
```

## Что собирается

- HTTP-нагрузка по `module`, `area`, `route`, `method`, `status_class`, `auth_state`, `client_source`.
- p50/p95/p99 latency, активные запросы, медленные запросы, входящий и исходящий трафик.
- Приблизительные уникальные клиенты за `5m` и `1h` без вывода IP в метрики.
- Бизнес-действия: auth, cart, wishlist, checkout, Mono payments/webhooks, customer requests, reviews, uploads, admin order updates.
- Runtime: memory, CPU, event loop lag, active handles, unhandled errors.
- Dependency health: MongoDB и Redis из самого API.
- JSON-логи приложения с `request_id`, `module`, `area`, `route`, `status_class`.

## Логи приложения

API пишет JSON lines сюда:

```text
server/logs/api.log
```

Promtail читает этот файл и отправляет записи в Loki.

Useful Loki queries:

```logql
{service="perfect-parfums-api"} | json
```

```logql
{service="perfect-parfums-api", level="error"}
```

```logql
{service="perfect-parfums-api", area="storefront"} | json
```

```logql
{service="perfect-parfums-api", status_class=~"4xx|5xx"}
```

## Useful PromQL

Requests by module:

```promql
sum(rate(perfect_parfums_http_requests_total[5m])) by (module, area)
```

p95 latency by route:

```promql
histogram_quantile(
  0.95,
  sum(rate(perfect_parfums_http_request_duration_seconds_bucket[5m])) by (le, route)
)
```

Error ratio:

```promql
sum(rate(perfect_parfums_http_requests_total{status_class="5xx"}[5m]))
/
clamp_min(sum(rate(perfect_parfums_http_requests_total[5m])), 0.001)
```

Business actions:

```promql
sum(rate(perfect_parfums_business_events_total[5m])) by (action, status_class)
```

## Dashboards

Grafana automatically loads dashboards from `monitoring/grafana/dashboards`.

- Overview: `monitoring/grafana/dashboards/perfect-parfums-api.json`
- Detailed report: `monitoring/grafana/dashboards/perfect-parfums-api-full.json`

В Grafana ищи папку `Perfect Parfums`.

## PM2 environment

Для PM2-сервера важны эти env-переменные:

```text
PORT=5007
SERVICE_NAME=perfect-parfums-api
LOG_LEVEL=info
LOG_DIR=./logs
LOG_FILE=./logs/api.log
LOG_TO_STDOUT=false
SLOW_REQUEST_THRESHOLD_MS=1000
```
