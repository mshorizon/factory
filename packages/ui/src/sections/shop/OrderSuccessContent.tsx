import { useEffect } from "react";
import { CheckCircle, ShoppingBag } from "lucide-react";
import { Button } from "../../atoms/Button";
import { useCart } from "../../store/useCart";

interface OrderSuccessContentProps {
  orderNumber?: string;
  customerEmail?: string;
  total?: string;
  continueShoppingLabel?: string;
  continueShoppingHref?: string;
}

export function OrderSuccessContent({
  orderNumber,
  customerEmail,
  total,
  continueShoppingLabel = "Kontynuuj zakupy",
  continueShoppingHref = "/",
}: OrderSuccessContentProps) {
  const clearCart = useCart((s) => s.clearCart);

  useEffect(() => {
    clearCart();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-spacing-3xl px-spacing-md text-center">
      <div className="h-20 w-20 rounded-full bg-green-500/10 flex items-center justify-center mb-spacing-lg">
        <CheckCircle className="h-10 w-10 text-green-600" />
      </div>

      <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-spacing-sm">
        Dziękujemy za zamówienie!
      </h1>

      {orderNumber && (
        <p className="text-lg text-foreground/70 mb-spacing-xs">
          Numer zamówienia: <strong>{orderNumber}</strong>
        </p>
      )}

      {total && (
        <p className="text-foreground/70 mb-spacing-sm">
          Kwota: <strong>{total}</strong>
        </p>
      )}

      {customerEmail && (
        <p className="text-sm text-foreground/60 mb-spacing-lg">
          Potwierdzenie zostało wysłane na <strong>{customerEmail}</strong>
        </p>
      )}

      <Button asChild size="lg">
        <a href={continueShoppingHref}>
          <ShoppingBag className="mr-2 h-4 w-4" />
          {continueShoppingLabel}
        </a>
      </Button>
    </div>
  );
}
