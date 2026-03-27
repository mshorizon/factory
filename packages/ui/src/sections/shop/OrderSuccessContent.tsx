import { useEffect } from "react";
import { CheckCircle, ShoppingBag, Package } from "lucide-react";
import { Button } from "../../atoms/Button";
import { useCart } from "../../store/useCart";

interface OrderItem {
  title: string;
  quantity: number;
  unitPrice: string;
  image?: string;
}

interface OrderSuccessContentProps {
  orderNumber?: string;
  customerEmail?: string;
  customerName?: string;
  total?: string;
  items?: OrderItem[];
  continueShoppingLabel?: string;
  continueShoppingHref?: string;
}

export function OrderSuccessContent({
  orderNumber,
  customerEmail,
  customerName,
  total,
  items = [],
  continueShoppingLabel = "Kontynuuj zakupy",
  continueShoppingHref = "/",
}: OrderSuccessContentProps) {
  const clearCart = useCart((s) => s.clearCart);

  useEffect(() => {
    clearCart();
  }, []);

  return (
    <div className="max-w-2xl mx-auto py-spacing-3xl px-spacing-md">
      {/* Header */}
      <div className="flex flex-col items-center text-center mb-spacing-2xl">
        <div className="h-20 w-20 rounded-full bg-green-500/10 flex items-center justify-center mb-spacing-lg">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-spacing-sm">
          Dziękujemy za zamówienie!
        </h1>
        {customerName && (
          <p className="text-foreground/60">{customerName}</p>
        )}
      </div>

      {/* Order info card */}
      <div className="border border-border rounded-xl p-spacing-lg mb-spacing-lg bg-card">
        <div className="flex items-center gap-2 mb-spacing-md">
          <Package className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-foreground">Szczegóły zamówienia</h2>
        </div>

        {orderNumber && (
          <div className="flex justify-between py-spacing-xs border-b border-border/50">
            <span className="text-foreground/60 text-sm">Numer zamówienia</span>
            <span className="font-mono font-semibold text-foreground">{orderNumber}</span>
          </div>
        )}

        {customerEmail && (
          <div className="flex justify-between py-spacing-xs border-b border-border/50">
            <span className="text-foreground/60 text-sm">Email</span>
            <span className="text-foreground text-sm">{customerEmail}</span>
          </div>
        )}

        {/* Items */}
        {items.length > 0 && (
          <div className="mt-spacing-md space-y-spacing-sm">
            {items.map((item, i) => (
              <div key={i} className="flex items-center gap-spacing-sm">
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-12 w-12 rounded-lg object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                  <p className="text-xs text-foreground/60">Ilość: {item.quantity}</p>
                </div>
                <span className="text-sm font-semibold text-foreground flex-shrink-0">{item.unitPrice}</span>
              </div>
            ))}
          </div>
        )}

        {total && (
          <div className="flex justify-between pt-spacing-md mt-spacing-sm border-t border-border font-bold text-foreground">
            <span>Razem</span>
            <span className="text-primary">{total}</span>
          </div>
        )}
      </div>

      {customerEmail && (
        <p className="text-sm text-foreground/50 text-center mb-spacing-lg">
          Potwierdzenie zostało wysłane na <strong>{customerEmail}</strong>
        </p>
      )}

      <div className="flex justify-center">
        <Button asChild size="lg">
          <a href={continueShoppingHref}>
            <ShoppingBag className="mr-2 h-4 w-4" />
            {continueShoppingLabel}
          </a>
        </Button>
      </div>
    </div>
  );
}
