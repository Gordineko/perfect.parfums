import { IOrderAdminService } from "../../../Common/DI/tokens.js";
import { triggerKeycrmOrderSync } from "../Services/keycrmOrderSync.service.js";

export function orderAdminController(router, { container }) {
    router.get("/admin/orders", async (req, res, next) => {
        try {
            const service = container.get(IOrderAdminService);

            const data = await service.listOrders({
                q: req.query.q,
                status: req.query.status,
                deliveryMethod: req.query.deliveryMethod,
                payment: req.query.payment,
                dateFrom: req.query.dateFrom,
                dateTo: req.query.dateTo,
                page: req.query.page,
                limit: req.query.limit,
                sort: req.query.sort,
            });

            res.json(data);
        } catch (e) {
            next(e);
        }
    });

    router.post("/admin/orders", async (req, res, next) => {
        try {
            const service = container.get(IOrderAdminService);

            const data = await service.createOrder(
                req.body || {},
                req.user || null
            );

            try {
                const syncResult = await triggerKeycrmOrderSync(data?.item?._id, {
                    source: "admin-order-create",
                });

                if (syncResult.skipped) {
                    console.info("[ORDER_ADMIN] keycrm sync skipped", {
                        orderId: String(data?.item?._id || ""),
                        orderNumber: data?.item?.orderNumber,
                        reason: syncResult.reason,
                    });
                }
            } catch (syncErr) {
                console.error("[ORDER_ADMIN] keycrm sync error", {
                    orderId: String(data?.item?._id || ""),
                    orderNumber: data?.item?.orderNumber,
                    error: syncErr?.message || String(syncErr),
                });
            }

            res.status(201).json(data);
        } catch (e) {
            next(e);
        }
    });

    router.get("/admin/orders/export.csv", async (req, res, next) => {
        try {
            const service = container.get(IOrderAdminService);

            const csv = await service.exportOrdersCsv({
                q: req.query.q,
                status: req.query.status,
                deliveryMethod: req.query.deliveryMethod,
                payment: req.query.payment,
                dateFrom: req.query.dateFrom,
                dateTo: req.query.dateTo,
                sort: req.query.sort,
            });

            res.setHeader("Content-Type", "text/csv; charset=utf-8");
            res.setHeader("Content-Disposition", 'attachment; filename="orders.csv"');
            res.send(csv);
        } catch (e) {
            next(e);
        }
    });

    router.get("/admin/orders/export.xlsx", async (req, res, next) => {
        try {
            const service = container.get(IOrderAdminService);

            const xlsx = await service.exportOrdersXlsx({
                q: req.query.q,
                status: req.query.status,
                paymentStatus: req.query.paymentStatus,
                deliveryMethod: req.query.deliveryMethod,
                payment: req.query.payment,
                dateFrom: req.query.dateFrom,
                dateTo: req.query.dateTo,
                sort: req.query.sort,
            });

            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            res.setHeader("Content-Disposition", 'attachment; filename="orders.xlsx"');
            res.send(xlsx);
        } catch (e) {
            next(e);
        }
    });

    router.get("/admin/orders/:id", async (req, res, next) => {
        try {
            const service = container.get(IOrderAdminService);
            const data = await service.getOrderById(req.params.id);

            if (!data) {
                return res.status(404).json({
                    message: "Order not found",
                    code: "NOT_FOUND",
                });
            }

            res.json(data);
        } catch (e) {
            next(e);
        }
    });

    router.get("/admin/orders/by-number/:orderNumber", async (req, res, next) => {
        try {
            const service = container.get(IOrderAdminService);
            const data = await service.getOrderByNumber(req.params.orderNumber);

            if (!data) {
                return res.status(404).json({
                    message: "Order not found",
                    code: "NOT_FOUND",
                });
            }

            res.json(data);
        } catch (e) {
            next(e);
        }
    });

    router.patch("/admin/orders/:id/status", async (req, res, next) => {
        try {
            const service = container.get(IOrderAdminService);
            const data = await service.updateOrderStatus(
                req.params.id,
                req.body?.status,
                req.user || null
            );

            if (!data) {
                return res.status(404).json({
                    message: "Order not found",
                    code: "NOT_FOUND",
                });
            }

            res.json(data);
        } catch (e) {
            next(e);
        }
    });

    router.patch("/admin/orders/:id/customer", async (req, res, next) => {
        try {
            const service = container.get(IOrderAdminService);
            const data = await service.updateCustomer(
                req.params.id,
                req.body || {},
                req.user || null
            );

            if (!data) {
                return res.status(404).json({
                    message: "Order not found",
                    code: "NOT_FOUND",
                });
            }

            res.json(data);
        } catch (e) {
            next(e);
        }
    });

    router.patch("/admin/orders/:id/delivery", async (req, res, next) => {
        try {
            const service = container.get(IOrderAdminService);
            const data = await service.updateDelivery(
                req.params.id,
                req.body || {},
                req.user || null
            );

            if (!data) {
                return res.status(404).json({
                    message: "Order not found",
                    code: "NOT_FOUND",
                });
            }

            res.json(data);
        } catch (e) {
            next(e);
        }
    });

    router.patch("/admin/orders/:id/payment", async (req, res, next) => {
        try {
            const service = container.get(IOrderAdminService);
            const data = await service.updatePayment(
                req.params.id,
                req.body || {},
                req.user || null
            );

            if (!data) {
                return res.status(404).json({
                    message: "Order not found",
                    code: "NOT_FOUND",
                });
            }

            res.json(data);
        } catch (e) {
            next(e);
        }
    });

    router.post("/admin/orders/:id/items", async (req, res, next) => {
        try {
            const service = container.get(IOrderAdminService);
            const data = await service.addOrderItem(
                req.params.id,
                req.body || {},
                req.user || null
            );

            if (!data) {
                return res.status(404).json({
                    message: "Order not found",
                    code: "NOT_FOUND",
                });
            }

            res.json(data);
        } catch (e) {
            next(e);
        }
    });

    router.patch("/admin/orders/:id/items/:itemIndex", async (req, res, next) => {
        try {
            const service = container.get(IOrderAdminService);
            const data = await service.updateOrderItem(
                req.params.id,
                req.params.itemIndex,
                req.body || {},
                req.user || null
            );

            if (!data) {
                return res.status(404).json({
                    message: "Order not found",
                    code: "NOT_FOUND",
                });
            }

            res.json(data);
        } catch (e) {
            next(e);
        }
    });

    router.delete("/admin/orders/:id/items/:itemIndex", async (req, res, next) => {
        try {
            const service = container.get(IOrderAdminService);
            const data = await service.removeOrderItem(
                req.params.id,
                req.params.itemIndex,
                req.user || null
            );

            if (!data) {
                return res.status(404).json({
                    message: "Order not found",
                    code: "NOT_FOUND",
                });
            }

            res.json(data);
        } catch (e) {
            next(e);
        }
    });

    router.patch("/admin/orders/:id", async (req, res, next) => {
        try {
            const service = container.get(IOrderAdminService);
            const data = await service.updateOrder(
                req.params.id,
                req.body || {},
                req.user || null
            );

            if (!data) {
                return res.status(404).json({
                    message: "Order not found",
                    code: "NOT_FOUND",
                });
            }

            res.json(data);
        } catch (e) {
            next(e);
        }
    });
}