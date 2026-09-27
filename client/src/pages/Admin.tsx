import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Boxes, CreditCard, FolderTree, ImagePlus, LayoutDashboard, MapPin, PackageOpen, Phone, Plus, Search, ShoppingBag, Trash2, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { api, jsonBody, API_URL } from "@/lib/api";
import { money, resolveImageUrl } from "@/lib/utils";
import type { Category, Order, OrderStatus, PaymentStatus, Product } from "@shared/schema";

const blankProduct = {
  name: "",
  slug: "",
  description: "",
  price: 0,
  category: "vases",
  style: "Modern",
  size: "Medium",
  image: "/images/modi-glass-collection.png",
  images: [] as string[],
  tags: [] as string[],
  inventory: 0,
  featured: false,
  trending: false,
  isNew: false
};

const tabs = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "orders", label: "Orders", icon: ShoppingBag },
  { id: "products", label: "Products", icon: Boxes },
  { id: "categories", label: "Categories", icon: FolderTree }
] as const;

type Tab = (typeof tabs)[number]["id"];

export function Admin() {
  const queryClient = useQueryClient();
  const [adminPassword, setAdminPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [productSearch, setProductSearch] = useState("");
  const [product, setProduct] = useState(blankProduct);
  const [category, setCategory] = useState({ name: "", slug: "", description: "", image: "/images/modi-glass-collection.png" });

  const { data: products = [] } = useQuery<Array<Product & { _id: string }>>({ queryKey: ["products"], queryFn: () => api("/api/products") });
  const { data: categories = [] } = useQuery<Array<Category & { _id: string }>>({ queryKey: ["categories"], queryFn: () => api("/api/categories") });
  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["admin-orders", unlocked],
    enabled: unlocked,
    queryFn: () => api("/api/admin/orders/list", { method: "POST", ...jsonBody({ adminPassword }) })
  });

  const metrics = useMemo(() => {
    const revenue = orders.filter((o) => o.paymentStatus === "paid").reduce((sum, o) => sum + o.total, 0);
    const pending = orders.filter((o) => ["pending", "paid", "processing"].includes(o.status)).length;
    const lowStock = products.filter((p) => p.inventory <= 10).length;
    return { revenue, pending, lowStock, orders: orders.length, products: products.length, categories: categories.length };
  }, [orders, products, categories]);

  const filteredOrders = useMemo(() => {
    const q = orderSearch.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesStatus = orderStatusFilter === "all" || order.status === orderStatusFilter;
      const matchesSearch = !q || [
        order.orderNumber,
        order.shippingAddress.fullName,
        order.shippingAddress.phone,
        order.shippingAddress.city,
        ...order.items.map((item) => item.name)
      ].join(" ").toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [orders, orderSearch, orderStatusFilter]);

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    return products.filter((p) => !q || `${p.name} ${p.category} ${p.style} ${p.size}`.toLowerCase().includes(q));
  }, [products, productSearch]);

  const [productFeedback, setProductFeedback] = useState<{ error?: string; success?: string }>({});

  const createProduct = useMutation({
    mutationFn: () =>
      api("/api/admin/products", {
        method: "POST",
        ...jsonBody({
          ...product,
          price: Number(product.price),
          inventory: Number(product.inventory),
          adminPassword
        })
      }),
    onSuccess: () => {
      setProduct(blankProduct);
      setProductFeedback({ success: "Product added successfully!" });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setTimeout(() => setProductFeedback({}), 5000);
    },
    onError: (err: Error) => {
      setProductFeedback({ error: err.message || "Failed to create product" });
    }
  });
  const deleteProduct = useMutation({ mutationFn: (id: string) => api(`/api/admin/products/${id}`, { method: "DELETE", ...jsonBody({ adminPassword }) }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }) });
  const createCategory = useMutation({ mutationFn: () => api("/api/admin/categories", { method: "POST", ...jsonBody({ ...category, adminPassword }) }), onSuccess: () => { setCategory({ name: "", slug: "", description: "", image: "/images/modi-glass-collection.png" }); queryClient.invalidateQueries({ queryKey: ["categories"] }); } });
  const deleteCategory = useMutation({ mutationFn: (id: string) => api(`/api/admin/categories/${id}`, { method: "DELETE", ...jsonBody({ adminPassword }) }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }) });
  const updateOrder = useMutation({
    mutationFn: ({ id, status, paymentStatus }: { id: string; status?: OrderStatus; paymentStatus?: PaymentStatus }) =>
      api(`/api/admin/orders/${id}`, { method: "PATCH", ...jsonBody({ adminPassword, status, paymentStatus }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-orders"] })
  });
  const createShiprocketShipment = useMutation({
    mutationFn: (id: string) => api(`/api/admin/orders/${id}/shiprocket`, { method: "POST", ...jsonBody({ adminPassword }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-orders"] })
  });

  if (!unlocked) {
    return (
      <section className="mx-auto max-w-md px-4 py-20">
        <Card className="p-6">
          <h1 className="font-display text-4xl">Admin</h1>
          <p className="mt-2 text-sm text-ink/60">Enter the admin password to manage the SangraH store.</p>
          <div className="mt-6 grid gap-3">
            <Input type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} placeholder="Admin password" />
            <Button variant="dark" onClick={() => setUnlocked(adminPassword === "Sangrah@2026")}>Unlock dashboard</Button>
          </div>
        </Card>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-champagne">Store management</p>
          <h1 className="mt-2 font-display text-5xl">Admin Dashboard</h1>
        </div>
        <Button variant="outline" onClick={() => queryClient.invalidateQueries()}>Refresh data</Button>
      </div>

      <div className="mt-8 grid gap-3 md:grid-cols-4">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-semibold transition ${activeTab === id ? "border-champagne bg-white shadow" : "border-ink/10 bg-white/50 hover:border-champagne/60"}`}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && <Overview metrics={metrics} orders={orders} products={products} setActiveTab={setActiveTab} />}
      {activeTab === "orders" && (
        <OrdersPanel
          orders={filteredOrders}
          orderSearch={orderSearch}
          setOrderSearch={setOrderSearch}
          orderStatusFilter={orderStatusFilter}
          setOrderStatusFilter={setOrderStatusFilter}
          updateOrder={(id, status) => updateOrder.mutate({ id, status })}
          createShiprocketShipment={(id) => createShiprocketShipment.mutate(id)}
          shippingOrderId={createShiprocketShipment.variables}
          shippingPending={createShiprocketShipment.isPending}
        />
      )}
      {activeTab === "products" && (
        <ProductsPanel
          products={filteredProducts}
          categories={categories}
          product={product}
          setProduct={setProduct}
          productSearch={productSearch}
          setProductSearch={setProductSearch}
          adminPassword={adminPassword}
          createProduct={() => createProduct.mutate()}
          deleteProduct={(id) => deleteProduct.mutate(id)}
          pending={createProduct.isPending}
          feedback={productFeedback}
          setFeedback={setProductFeedback}
        />
      )}
      {activeTab === "categories" && (
        <CategoriesPanel
          categories={categories}
          category={category}
          setCategory={setCategory}
          adminPassword={adminPassword}
          createCategory={() => createCategory.mutate()}
          deleteCategory={(id) => deleteCategory.mutate(id)}
          pending={createCategory.isPending}
        />
      )}
    </section>
  );
}

function Overview({ metrics, orders, products, setActiveTab }: { metrics: Record<string, number>; orders: Order[]; products: Array<Product & { _id: string }>; setActiveTab: (tab: Tab) => void }) {
  const latestOrders = orders.slice(0, 4);
  const lowStockProducts = products.filter((p) => p.inventory <= 10).slice(0, 5);

  return (
    <div className="mt-8 grid gap-8">
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Metric label="Paid revenue" value={money(metrics.revenue)} />
        <Metric label="Total orders" value={String(metrics.orders)} />
        <Metric label="Open orders" value={String(metrics.pending)} />
        <Metric label="Products" value={String(metrics.products)} />
        <Metric label="Categories" value={String(metrics.categories)} />
        <Metric label="Low stock" value={String(metrics.lowStock)} />
      </div>
      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-3xl">Recent Orders</h2>
            <Button variant="outline" onClick={() => setActiveTab("orders")}>View all</Button>
          </div>
          <div className="mt-4 grid gap-3">
            {latestOrders.map((order) => <CompactOrder key={order._id} order={order} />)}
            {!latestOrders.length && <p className="text-sm text-ink/55">No orders yet.</p>}
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-3xl">Stock Watch</h2>
            <Button variant="outline" onClick={() => setActiveTab("products")}>Catalog</Button>
          </div>
          <div className="mt-4 grid gap-3">
            {lowStockProducts.map((p) => (
              <div key={p._id} className="flex items-center justify-between rounded-md bg-porcelain p-3">
                <span className="font-medium">{p.name}</span>
                <span className="text-sm text-ink/55">{p.inventory} left</span>
              </div>
            ))}
            {!lowStockProducts.length && <p className="text-sm text-ink/55">Inventory looks healthy.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}

function OrdersPanel({ orders, orderSearch, setOrderSearch, orderStatusFilter, setOrderStatusFilter, updateOrder, createShiprocketShipment, shippingOrderId, shippingPending }: {
  orders: Order[];
  orderSearch: string;
  setOrderSearch: (value: string) => void;
  orderStatusFilter: string;
  setOrderStatusFilter: (value: string) => void;
  updateOrder: (id: string, status?: OrderStatus, paymentStatus?: PaymentStatus) => void;
  createShiprocketShipment: (id: string) => void;
  shippingOrderId?: string;
  shippingPending: boolean;
}) {
  return (
    <Card className="mt-8 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="font-display text-3xl">Orders</h2>
          <p className="mt-1 text-sm text-ink/55">Review products, customer delivery details, payment status, and fulfillment progress.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-[260px_180px]">
          <label className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-ink/40" />
            <Input className="pl-9" placeholder="Search orders" value={orderSearch} onChange={(e) => setOrderSearch(e.target.value)} />
          </label>
          <select value={orderStatusFilter} onChange={(e) => setOrderStatusFilter(e.target.value)} className="h-11 rounded-md border border-ink/10 bg-white px-3 text-sm">
            {["all", "pending", "paid", "processing", "shipped", "delivered", "cancelled"].map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </div>
      </div>
      <div className="mt-5 grid gap-4">
        {orders.map((order) => (
          <OrderCard
            key={order._id}
            order={order}
            updateOrder={updateOrder}
            createShiprocketShipment={createShiprocketShipment}
            shippingPending={shippingPending && shippingOrderId === order._id}
          />
        ))}
        {!orders.length && <p className="rounded-md bg-porcelain p-5 text-sm text-ink/55">No orders match this view.</p>}
      </div>
    </Card>
  );
}

function ProductsPanel({
  products,
  categories,
  product,
  setProduct,
  productSearch,
  setProductSearch,
  adminPassword,
  createProduct,
  deleteProduct,
  pending,
  feedback,
  setFeedback
}: {
  products: Array<Product & { _id: string }>;
  categories: Array<Category & { _id: string }>;
  product: typeof blankProduct;
  setProduct: (value: typeof blankProduct) => void;
  productSearch: string;
  setProductSearch: (value: string) => void;
  adminPassword: string;
  createProduct: () => void;
  deleteProduct: (id: string) => void;
  pending: boolean;
  feedback: { error?: string; success?: string };
  setFeedback: React.Dispatch<React.SetStateAction<{ error?: string; success?: string }>>;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    setProduct({
      ...product,
      name,
      slug: !product.slug || product.slug === product.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") ? slug : product.slug
    });
  };

  async function uploadProductImage(file: File) {
    setUploading(true);
    setUploadError("");
    const formData = new FormData();
    formData.append("adminPassword", adminPassword);
    formData.append("image", file);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const res = await fetch(`${API_URL}/api/admin/upload/product-image`, {
        method: "POST",
        credentials: "include",
        body: formData,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Image upload failed");
      setProduct({ ...product, image: data.imageUrl, images: [data.imageUrl] });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setUploadError("Image upload timed out. Please check backend connection.");
      } else {
        setUploadError(error instanceof Error ? error.message : "Image upload failed");
      }
    } finally {
      clearTimeout(timeoutId);
      setUploading(false);
    }
  }

  const handleAddProduct = () => {
    setFeedback({});
    setUploadError("");
    if (!product.name || product.name.trim().length < 2) {
      setFeedback({ error: "Product name must be at least 2 characters." });
      return;
    }
    const finalSlug = product.slug.trim() || product.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    if (!finalSlug || finalSlug.length < 2) {
      setFeedback({ error: "Product slug must be at least 2 characters." });
      return;
    }
    if (!product.description || product.description.trim().length < 12) {
      setFeedback({ error: "Description must be at least 12 characters (e.g. detailed material & styling)." });
      return;
    }
    if (!product.price || Number(product.price) <= 0) {
      setFeedback({ error: "Selling price must be greater than ₹0." });
      return;
    }
    if (!product.category || product.category.trim().length < 2) {
      setFeedback({ error: "Please select or enter a category." });
      return;
    }
    if (!product.image || product.image.trim().length < 1) {
      setFeedback({ error: "Image path or uploaded image is required." });
      return;
    }

    if (product.slug !== finalSlug) {
      setProduct({ ...product, slug: finalSlug });
    }
    createProduct();
  };

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
      <Card className="p-5">
        <h2 className="font-display text-3xl">Add Product</h2>
        <div className="mt-5 grid gap-3">
          <Field label="Product name">
            <Input placeholder="e.g. Crystal Lotus Vase" value={product.name} onChange={(e) => handleNameChange(e.target.value)} />
          </Field>
          <Field label="Product slug" hint="Auto-generated from name or custom.">
            <Input placeholder="e.g. crystal-lotus-vase" value={product.slug} onChange={(e) => setProduct({ ...product, slug: e.target.value })} />
          </Field>
          <Field label="Description" hint="Must be at least 12 characters.">
            <Textarea placeholder="Short product description for the shop page (min 12 characters)" value={product.description} onChange={(e) => setProduct({ ...product, description: e.target.value })} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Selling price (INR)" hint="Enter customer price, e.g. 2499 (must be > 0).">
              <Input type="number" min="1" placeholder="Price in rupees" value={product.price || ""} onChange={(e) => setProduct({ ...product, price: Number(e.target.value) })} />
            </Field>
            <Field label="Stock quantity" hint="Enter how many pieces are available to sell.">
              <Input type="number" min="0" placeholder="Available pieces" value={product.inventory} onChange={(e) => setProduct({ ...product, inventory: Number(e.target.value) })} />
            </Field>
            <Field label="Category" hint="Select from catalog or type slug.">
              {categories.length > 0 ? (
                <select
                  value={product.category}
                  onChange={(e) => setProduct({ ...product, category: e.target.value })}
                  className="h-11 w-full rounded-md border border-ink/10 bg-white px-3 text-sm outline-none focus:border-champagne"
                >
                  {categories.map((c) => (
                    <option key={c.slug} value={c.slug}>{c.name} ({c.slug})</option>
                  ))}
                </select>
              ) : (
                <Input placeholder="e.g. vases" value={product.category} onChange={(e) => setProduct({ ...product, category: e.target.value })} />
              )}
            </Field>
            <Field label="Style">
              <Input placeholder="e.g. Modern" value={product.style} onChange={(e) => setProduct({ ...product, style: e.target.value })} />
            </Field>
            <Field label="Size">
              <Input placeholder="e.g. Medium" value={product.size} onChange={(e) => setProduct({ ...product, size: e.target.value })} />
            </Field>
            <Field label="Image path">
              <Input placeholder="/images/product.png" value={product.image} onChange={(e) => setProduct({ ...product, image: e.target.value })} />
            </Field>
          </div>
          <div className="rounded-lg border border-ink/10 bg-white p-4">
            <div className="grid gap-4 sm:grid-cols-[120px_1fr] sm:items-center">
              <img src={resolveImageUrl(product.image)} alt="Product preview" className="h-28 w-28 rounded-md object-cover" />
              <div>
                <label className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-md bg-ink px-5 text-sm font-semibold text-white transition hover:bg-emerald">
                  <ImagePlus className="h-4 w-4" />
                  {uploading ? "Uploading..." : "Upload product image"}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadProductImage(file);
                      e.currentTarget.value = "";
                    }}
                  />
                </label>
                <p className="mt-2 text-xs leading-5 text-ink/55">JPG, PNG, WEBP, or GIF up to 5MB. The uploaded URL is saved into the image path automatically.</p>
                {uploadError && <p className="mt-2 text-sm font-medium text-red-600">{uploadError}</p>}
              </div>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <Toggle label="Featured" checked={product.featured} onChange={(checked) => setProduct({ ...product, featured: checked })} />
            <Toggle label="Trending" checked={product.trending} onChange={(checked) => setProduct({ ...product, trending: checked })} />
            <Toggle label="New" checked={product.isNew} onChange={(checked) => setProduct({ ...product, isNew: checked })} />
          </div>

          {feedback.error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
              {feedback.error}
            </div>
          )}
          {feedback.success && (
            <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-700">
              {feedback.success}
            </div>
          )}

          <Button onClick={handleAddProduct} disabled={pending || uploading}>
            <Plus className="h-4 w-4" /> {pending ? "Adding product..." : "Add product"}
          </Button>
        </div>
      </Card>
      <Card className="p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display text-3xl">Products</h2>
          <label className="relative sm:w-72">
            <Search className="absolute left-3 top-3 h-4 w-4 text-ink/40" />
            <Input className="pl-9" placeholder="Search catalog" value={productSearch} onChange={(e) => setProductSearch(e.target.value)} />
          </label>
        </div>
        <div className="mt-4 grid gap-3">
          {products.map((p) => (
            <div key={p._id} className="grid gap-3 rounded-md border border-ink/10 p-3 sm:grid-cols-[64px_1fr_auto] sm:items-center">
              <img src={resolveImageUrl(p.image)} alt={p.name} className="h-16 w-16 rounded-md object-cover" />
              <div>
                <p className="font-semibold">{p.name}</p>
                <p className="text-sm text-ink/55">{money(p.price)} / {p.category} / {p.inventory} in stock</p>
              </div>
              <button onClick={() => deleteProduct(p._id)} aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function CategoriesPanel({ categories, category, setCategory, adminPassword, createCategory, deleteCategory, pending }: {
  categories: Array<Category & { _id: string }>;
  category: { name: string; slug: string; description: string; image: string };
  setCategory: (value: { name: string; slug: string; description: string; image: string }) => void;
  adminPassword: string;
  createCategory: () => void;
  deleteCategory: (id: string) => void;
  pending: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  async function uploadCategoryImage(file: File) {
    setUploading(true);
    setUploadError("");
    const formData = new FormData();
    formData.append("adminPassword", adminPassword);
    formData.append("image", file);

    try {
      const res = await fetch(`${API_URL}/api/admin/upload/product-image`, {
        method: "POST",
        credentials: "include",
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Image upload failed");
      setCategory({ ...category, image: data.imageUrl });
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Image upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
      <Card className="p-5">
        <h2 className="font-display text-3xl">Add Category</h2>
        <div className="mt-5 grid gap-3">
          <Input placeholder="Name" value={category.name} onChange={(e) => setCategory({ ...category, name: e.target.value })} />
          <Input placeholder="Slug" value={category.slug} onChange={(e) => setCategory({ ...category, slug: e.target.value })} />
          <Textarea placeholder="Description" value={category.description} onChange={(e) => setCategory({ ...category, description: e.target.value })} />
          <Input placeholder="Image path" value={category.image} onChange={(e) => setCategory({ ...category, image: e.target.value })} />
          <div className="rounded-lg border border-ink/10 bg-white p-4">
            <div className="grid gap-4 sm:grid-cols-[120px_1fr] sm:items-center">
              <img src={resolveImageUrl(category.image)} alt="Category preview" className="h-28 w-28 rounded-md object-cover" />
              <div>
                <label className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-md bg-ink px-5 text-sm font-semibold text-white transition hover:bg-emerald">
                  <ImagePlus className="h-4 w-4" />
                  {uploading ? "Uploading..." : "Upload category image"}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadCategoryImage(file);
                      e.currentTarget.value = "";
                    }}
                  />
                </label>
                <p className="mt-2 text-xs leading-5 text-ink/55">JPG, PNG, WEBP, or GIF up to 5MB. The uploaded URL is saved into the image path automatically.</p>
                {uploadError && <p className="mt-2 text-sm text-red-600">{uploadError}</p>}
              </div>
            </div>
          </div>
          <Button onClick={createCategory} disabled={pending}><Plus className="h-4 w-4" /> Add category</Button>
        </div>
      </Card>
      <Card className="p-5">
        <h2 className="font-display text-3xl">Categories</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {categories.map((c) => (
            <div key={c._id} className="overflow-hidden rounded-lg border border-ink/10 bg-white">
              <img src={resolveImageUrl(c.image)} alt={c.name} className="h-36 w-full object-cover" />
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{c.name}</p>
                    <p className="text-sm text-ink/55">{c.slug}</p>
                  </div>
                  <button onClick={() => deleteCategory(c._id)} aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                </div>
                <p className="mt-3 text-sm leading-6 text-ink/60">{c.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function OrderCard({ order, updateOrder, createShiprocketShipment, shippingPending }: {
  order: Order;
  updateOrder: (id: string, status?: OrderStatus, paymentStatus?: PaymentStatus) => void;
  createShiprocketShipment: (id: string) => void;
  shippingPending: boolean;
}) {
  return (
    <div className="rounded-md border border-ink/10 p-4">
      <div className="grid gap-4 md:grid-cols-[1fr_auto_auto] md:items-start">
        <div>
          <p className="font-semibold">{order.orderNumber}</p>
          <p className="mt-1 text-sm text-ink/55">{formatDate(order.createdAt)} / {order.items.length} item{order.items.length === 1 ? "" : "s"} / {order.paymentMethod.replace("_", " ")} / {order.paymentStatus.replace(/_/g, " ")}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <AdminBadge status={order.status}>{order.status.replace(/_/g, " ")}</AdminBadge>
            <AdminBadge status={order.paymentStatus}>{order.paymentStatus.replace(/_/g, " ")}</AdminBadge>
          </div>
        </div>
        <p className="font-semibold md:text-right">{money(order.total)}</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink/50">Order status</span>
            <select
              value={order.status}
              onChange={(e) => updateOrder(order._id, e.target.value as OrderStatus)}
              className="h-10 rounded-md border border-ink/10 bg-white px-3 text-sm"
            >
              {["pending", "paid", "processing", "shipped", "delivered", "cancelled"].map((status) => (
                <option key={status} value={status}>{status.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink/50">Payment status</span>
            <select
              value={order.paymentStatus}
              onChange={(e) => updateOrder(order._id, undefined, e.target.value as PaymentStatus)}
              className="h-10 rounded-md border border-ink/10 bg-white px-3 text-sm"
            >
              {["pending", "paid", "failed", "refund_initiated", "refunded"].map((pStatus) => (
                <option key={pStatus} value={pStatus}>{pStatus.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-5 border-t border-ink/10 pt-5 lg:grid-cols-[1.2fr_1fr_0.8fr_0.8fr]">
        <div>
          <SectionTitle icon={PackageOpen} label="Ordered products" />
          <div className="grid gap-3">
            {order.items.map((item) => (
              <div key={item.productId} className="grid grid-cols-[58px_1fr_auto] items-center gap-3 rounded-md bg-porcelain p-3">
                <img src={resolveImageUrl(item.image)} alt={item.name} className="h-14 w-14 rounded-md object-cover" />
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs text-ink/55">Qty {item.quantity} x {money(item.price)}</p>
                </div>
                <p className="text-sm font-semibold">{money(item.price * item.quantity)}</p>
              </div>
            ))}
          </div>
        </div>
        <div>
          <SectionTitle icon={MapPin} label="Buyer & delivery" />
          <div className="rounded-md bg-porcelain p-4 text-sm leading-7 text-ink/70">
            <p className="font-semibold text-ink">{order.shippingAddress.fullName}</p>
            <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> {order.shippingAddress.phone}</p>
            <p>{order.shippingAddress.line1}</p>
            {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
            <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
            <p>{order.shippingAddress.country}</p>
          </div>
        </div>
        <div>
          <SectionTitle icon={CreditCard} label="Payment" />
          <div className="rounded-md bg-porcelain p-4 text-sm leading-7 text-ink/70">
            <PaymentLine label="Subtotal" value={money(order.subtotal)} />
            <PaymentLine label="Shipping" value={order.shipping === 0 ? "Free" : money(order.shipping)} />
            <PaymentLine label="GST" value={money(order.tax)} />
            <PaymentLine label="Total" value={money(order.total)} strong />
            {order.razorpayOrderId && <p className="mt-3 break-all text-xs">Razorpay order: {order.razorpayOrderId}</p>}
            {order.razorpayPaymentId && <p className="break-all text-xs">Razorpay payment: {order.razorpayPaymentId}</p>}
          </div>
        </div>
        <div>
          <SectionTitle icon={Truck} label="Shiprocket" />
          <div className="rounded-md bg-porcelain p-4 text-sm leading-7 text-ink/70">
            {order.shiprocketShipmentId || order.shiprocketOrderId ? (
              <>
                <p className="font-semibold text-ink">{order.shiprocketStatus || "Created"}</p>
                {order.shiprocketOrderId && <p className="break-all text-xs">Order: {order.shiprocketOrderId}</p>}
                {order.shiprocketShipmentId && <p className="break-all text-xs">Shipment: {order.shiprocketShipmentId}</p>}
                {order.shiprocketAwbCode && <p className="break-all text-xs">AWB: {order.shiprocketAwbCode}</p>}
                {order.shiprocketCourierName && <p className="break-all text-xs">Courier: {order.shiprocketCourierName}</p>}
              </>
            ) : (
              <>
                <p className="text-ink/60">No shipment created yet.</p>
                <Button className="mt-3 w-full" variant="dark" onClick={() => createShiprocketShipment(order._id)} disabled={shippingPending || order.status === "cancelled"}>
                  <Truck className="h-4 w-4" /> {shippingPending ? "Creating..." : "Create shipment"}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CompactOrder({ order }: { order: Order }) {
  return (
    <div className="grid gap-2 rounded-md bg-porcelain p-3 sm:grid-cols-[1fr_auto]">
      <div>
        <p className="font-semibold">{order.orderNumber}</p>
        <p className="text-sm text-ink/55">{order.shippingAddress.fullName} / {order.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")}</p>
      </div>
      <div className="text-sm font-semibold sm:text-right">{money(order.total)}<br /><span className="font-normal text-ink/50">{order.status}</span></div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <Card className="p-4"><p className="text-xs uppercase tracking-[0.16em] text-ink/45">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></Card>;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/55">{label}</span>
      {children}
      {hint && <span className="text-xs leading-5 text-ink/50">{hint}</span>}
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label className="flex items-center gap-2 rounded-md border border-ink/10 bg-white px-3 py-2 text-sm"><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} /> {label}</label>;
}

function SectionTitle({ icon: Icon, label }: { icon: typeof Truck; label: string }) {
  return <div className="mb-3 flex items-center gap-2 font-semibold"><Icon className="h-4 w-4 text-champagne" /> {label}</div>;
}

function AdminBadge({ children, status }: { children: React.ReactNode; status?: string }) {
  const isCancelled = status === "cancelled" || status === "failed";
  const isRefund = status === "refund_initiated" || status === "refunded";
  const bgClass = isCancelled
    ? "bg-red-100 text-red-700"
    : isRefund
    ? "bg-amber-100 text-amber-900"
    : "bg-champagne/15 text-emerald";
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${bgClass}`}>{children}</span>;
}

function PaymentLine({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return <div className={`flex justify-between gap-4 ${strong ? "mt-2 border-t border-ink/10 pt-2 font-semibold text-ink" : ""}`}><span>{label}</span><span>{value}</span></div>;
}

function formatDate(value?: string) {
  if (!value) return "recently";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
