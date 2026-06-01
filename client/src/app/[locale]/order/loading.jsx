import OrderPageSkeleton from "@pages/order-page/ui/OrderPageSkeleton";

export default function OrderLoading() {
  return (
    <div className="order-page-shell">
      <div className="order-page">
        <div className="container">
          <OrderPageSkeleton showBreadcrumbs />
        </div>
      </div>
    </div>
  );
}
