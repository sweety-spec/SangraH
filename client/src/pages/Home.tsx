import { Link } from "wouter";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import { api } from "@/lib/api";
import { resolveImageUrl } from "@/lib/utils";
import type { Category, Product } from "@shared/schema";

export function Home() {
  const { data: products = [] } = useQuery<
    Array<Product & { _id: string }>
  >({
    queryKey: ["products"],
    queryFn: () => api("/api/products"),
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => api("/api/categories"),
  });

  return (
    <>
      {/* HERO */}
      <section className="relative min-h-[78vh] overflow-hidden">
        <img
          src="/images/hero-banner.png"
          alt="SangraH curated collection"
          className="absolute inset-0 h-full w-full object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-ink/80 via-ink/35 to-transparent" />

        <div className="relative mx-auto flex min-h-[78vh] max-w-7xl items-center px-4 py-20 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-2xl text-white"
          >
            <p className="mb-5 inline-flex items-center gap-2 text-sm uppercase tracking-[0.28em] text-champagne">
              <Sparkles className="h-4 w-4" />
              Curated for you
            </p>

            <h1 className="font-display text-5xl font-bold leading-tight sm:text-7xl">
              SangraH
            </h1>

            <h2 className="mt-4 font-display text-3xl leading-tight text-white/95 sm:text-4xl">
              Discover things worth keeping.
            </h2>

            <p className="mt-6 max-w-xl text-lg leading-8 text-white/82">
              A thoughtfully curated collection of timeless treasures, modern
              essentials, unique finds, and meaningful gifts, all brought
              together in one place.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/shop">
                <Button>
                  Explore Collection
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>

              <Link href="/about">
                <Button
                  variant="outline"
                  className="border-white/40 text-white hover:bg-white/10"
                >
                  Our Story
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* INTRO */}
      <section className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <p className="text-sm uppercase tracking-[0.24em] text-champagne">
          The SangraH edit
        </p>

        <h2 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">
          A collection made for every kind of taste.
        </h2>

        <p className="mx-auto mt-5 max-w-2xl leading-8 text-ink/65">
          From traditional treasures to contemporary essentials, SangraH brings
          together products that add character, usefulness, and meaning to
          everyday life.
        </p>
      </section>

      {/* CATEGORIES */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-champagne">
              Explore
            </p>

            <h2 className="mt-2 font-display text-4xl">
              Shop By Category
            </h2>
          </div>

          <Link
            href="/shop"
            className="hidden text-sm font-semibold md:inline-flex items-center gap-2"
          >
            View all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {categories.slice(0, 6).map((cat) => (
            <Link
              key={cat.slug}
              href={`/shop?category=${cat.slug}`}
              className="group relative overflow-hidden rounded-lg bg-ink"
            >
              <img
                src={resolveImageUrl(cat.image)}
                alt={cat.name}
                className="h-72 w-full object-cover opacity-75 transition duration-500 group-hover:scale-105 group-hover:opacity-85"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/10 to-transparent" />

              <div className="absolute bottom-0 p-6 text-white">
                <h3 className="font-display text-3xl">{cat.name}</h3>

                <p className="mt-2 text-sm text-white/75">
                  {cat.description}
                </p>

                <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold">
                  Explore
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* TRENDING */}
      <ProductBand
        title="Trending Now"
        subtitle="What people are discovering"
        products={products.filter((p) => p.trending).slice(0, 4)}
      />

      {/* FEATURED */}
      <ProductBand
        title="Featured Collection"
        subtitle="Handpicked pieces from SangraH"
        products={products.filter((p) => p.featured).slice(0, 4)}
      />

      {/* NEW ARRIVALS */}
      <ProductBand
        title="New Arrivals"
        subtitle="Fresh finds, just added"
        products={products.filter((p) => p.isNew).slice(0, 4)}
      />

      {/* BRAND STATEMENT */}
      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-champagne">
              Why SangraH
            </p>

            <h2 className="mt-2 font-display text-4xl leading-tight">
              More than a store.
              <br />
              A collection of discoveries.
            </h2>

            <p className="mt-5 max-w-lg leading-8 text-ink/65">
              We bring together products with character, from everyday
              essentials to pieces that tell a story. Every collection is
              chosen to make discovering something special feel simple.
            </p>

            <Link href="/about">
              <Button variant="outline" className="mt-7">
                Discover SangraH
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                title: "Curated Collection",
                text: "Thoughtfully selected products across different categories and styles.",
              },
              {
                title: "Quality & Value",
                text: "Products chosen with attention to quality, usefulness, and lasting appeal.",
              },
              {
                title: "Something Different",
                text: "Discover unique finds alongside modern everyday essentials.",
              },
              {
                title: "Made for Gifting",
                text: "Find thoughtful pieces for celebrations, occasions, and everyday moments.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-lg border border-ink/10 p-6"
              >
                <h3 className="font-display text-2xl">{item.title}</h3>

                <p className="mt-3 text-sm leading-7 text-ink/65">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CUSTOMER VOICES */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.24em] text-champagne">
            From our customers
          </p>

          <h2 className="mt-2 font-display text-4xl">
            Loved for the little details.
          </h2>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            "Every piece feels thoughtfully selected and different from the usual.",
            "I found something unique that I couldn't find anywhere else.",
            "The product quality and presentation were both impressive.",
            "SangraH makes discovering new products genuinely enjoyable.",
          ].map((quote) => (
            <blockquote
              key={quote}
              className="rounded-lg border border-ink/10 bg-white p-6 text-sm leading-7 text-ink/70"
            >
              “{quote}”

              <span className="mt-4 block font-semibold text-ink">
                SangraH customer
              </span>
            </blockquote>
          ))}
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="bg-ink text-white">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <p className="text-sm uppercase tracking-[0.24em] text-champagne">
            Stay in the collection
          </p>

          <h2 className="mt-3 font-display text-4xl">
            Discover what's new at SangraH.
          </h2>

          <p className="mt-3 text-white/65">
            Get updates on new arrivals, curated collections, special finds,
            and gifting edits.
          </p>

          <form className="mx-auto mt-7 flex max-w-xl flex-col gap-3 sm:flex-row">
            <input
              className="h-12 flex-1 rounded-md border border-white/15 bg-white px-4 text-ink outline-none focus:border-champagne"
              placeholder="Email address"
              type="email"
            />

            <Button type="submit">Subscribe</Button>
          </form>
        </div>
      </section>
    </>
  );
}

function ProductBand({
  title,
  subtitle,
  products,
}: {
  title: string;
  subtitle: string;
  products: Array<Product & { _id: string }>;
}) {
  if (!products.length) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="flex items-end justify-between gap-6">
        <div>
          <h2 className="font-display text-4xl">{title}</h2>

          <p className="mt-2 text-sm text-ink/55">{subtitle}</p>
        </div>

        <Link
          href="/shop"
          className="hidden items-center gap-2 text-sm font-semibold md:inline-flex"
        >
          View all
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </section>
  );
}