export type Category = "Kuruyemiş" | "Leblebi" | "Çekirdek" | "Kuru Meyve" | "Karışık";
export type Product = {
  id: string; name: string; slug: string; category: Category; description: string;
  image: string; images: string[]; unit: string; prices: Record<string, number | null>;
  stock: number; active: boolean; featured: boolean; ingredients: string; allergens: string;
};
export type OrderStatus = "whatsapp_bekleniyor" | "yeni" | "onaylandi" | "hazirlaniyor" | "kargoda" | "tamamlandi" | "iptal";
export type OrderItem = { productId: string; name: string; weight: string; qty: number; unitPrice: number | null; subtotal: number | null; };
export type Order = {
 id: string; createdAt: string; name: string; phone: string; email: string;
 address: string; note: string; status: OrderStatus; items: OrderItem[];
 total: number | null; carrier: string; trackingNo: string; payment: string; source: string;
};
