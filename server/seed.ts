import "dotenv/config";
import { connectDB, CategoryModel, ProductModel, CartItemModel, WishlistModel } from "./db";

const img = (name: string) => `/images/${name}.png`;

const categories = [
  {
    name: "Vases",
    slug: "vases",
    description: "Sculptural crystal and fluted silhouettes for refined floral styling.",
    image: img("cat-vases")
  },
  {
    name: "Candle Holders",
    slug: "candle-holders",
    description: "Faceted crystal and warm amber forms casting luminous ambient light.",
    image: img("cat-candle")
  },
  {
    name: "Bowls",
    slug: "bowls",
    description: "Iridescent blown-glass and ripple-textured decorative statement bowls.",
    image: img("cat-bowls")
  },
  {
    name: "Centerpieces",
    slug: "centerpieces",
    description: "Monumental cut-crystal urns and sculptural tabletop centerpieces.",
    image: img("cat-centerpiece")
  },
  {
    name: "Lighting",
    slug: "lighting",
    description: "Artisanal glass pendant lights and chandeliers for radiant spaces.",
    image: img("cat-lighting")
  },
  {
    name: "Mirrors",
    slug: "mirrors",
    description: "Gilded baroque and beveled glass wall accents of timeless grandeur.",
    image: img("cat-mirrors")
  }
];

const products = [
  {
    name: "Aria Fluted Crystal Column Vase",
    slug: "aria-fluted-crystal-vase",
    description: "Hand-finished tall crystal vase featuring architectural vertical fluting and a heavy crystal pedestal base.",
    price: 3899,
    compareAtPrice: 4699,
    category: "vases",
    style: "Modern",
    size: "Tall",
    image: img("prod-1"),
    images: [img("prod-1"), img("cat-vases"), img("hero-banner")],
    tags: ["fluted", "crystal", "vase", "column"],
    inventory: 22,
    featured: true,
    trending: true,
    isNew: false
  },
  {
    name: "Solara Amber Geometric Crystal Vessel",
    slug: "solara-amber-geometric-vessel",
    description: "Faceted amber glass vessel with geometric polished facets that catch and refract warm candlelight.",
    price: 2999,
    compareAtPrice: 3499,
    category: "candle-holders",
    style: "Art Deco",
    size: "Medium",
    image: img("prod-2"),
    images: [img("prod-2"), img("cat-candle")],
    tags: ["amber", "geometric", "faceted", "vessel"],
    inventory: 28,
    featured: true,
    trending: true,
    isNew: true
  },
  {
    name: "Celeste Wave Swirl Glass Bowl",
    slug: "celeste-wave-glass-bowl",
    description: "Artisanal blown glass bowl with iridescent teal ripples, evoking ocean depths for modern tabletop accents.",
    price: 3499,
    compareAtPrice: 4199,
    category: "bowls",
    style: "Contemporary",
    size: "Large",
    image: img("prod-3"),
    images: [img("prod-3"), img("cat-bowls")],
    tags: ["bowl", "swirl", "teal", "iridescent"],
    inventory: 16,
    featured: false,
    trending: true,
    isNew: false
  },
  {
    name: "Palais Baroque Gilded Wall Mirror",
    slug: "palais-baroque-gilded-mirror",
    description: "Regal oval beveled mirror encased in an intricately sculpted antique gold filigree crest frame.",
    price: 7999,
    compareAtPrice: 9499,
    category: "mirrors",
    style: "Baroque",
    size: "Large",
    image: img("prod-4"),
    images: [img("prod-4"), img("cat-mirrors"), img("inspiration-2")],
    tags: ["mirror", "baroque", "gilded", "wall-decor"],
    inventory: 9,
    featured: true,
    trending: false,
    isNew: true
  },
  {
    name: "Verona Diamond Cut Candlestick Set",
    slug: "verona-diamond-cut-candlestick-set",
    description: "Set of three staggered crystal candlestick holders cut in heritage diamond facets for unforgettable dining tables.",
    price: 4299,
    compareAtPrice: 5199,
    category: "candle-holders",
    style: "Classic",
    size: "Set of 3",
    image: img("prod-5"),
    images: [img("prod-5"), img("cat-candle")],
    tags: ["candlestick", "crystal", "taper", "dining"],
    inventory: 18,
    featured: true,
    trending: true,
    isNew: false
  },
  {
    name: "Aurelia Brass Teardrop Glass Pendant",
    slug: "aurelia-brass-teardrop-pendant",
    description: "Mouth-blown clear glass teardrop pendant light with warm brushed brass hardware and filament glow.",
    price: 4899,
    compareAtPrice: 5999,
    category: "lighting",
    style: "Modern",
    size: "Medium",
    image: img("prod-6"),
    images: [img("prod-6"), img("cat-lighting")],
    tags: ["lighting", "pendant", "brass", "lamp"],
    inventory: 14,
    featured: true,
    trending: false,
    isNew: true
  },
  {
    name: "Grand Versailles Crystal Banquet Urn",
    slug: "grand-versailles-crystal-urn",
    description: "Opulent pedestal urn crafted in thick diamond-cut crystal, designed as a monumental dining or foyer centerpiece.",
    price: 8499,
    compareAtPrice: 9999,
    category: "centerpieces",
    style: "Heritage",
    size: "Extra Large",
    image: img("prod-7"),
    images: [img("prod-7"), img("cat-centerpiece")],
    tags: ["centerpiece", "urn", "crystal", "banquet"],
    inventory: 7,
    featured: true,
    trending: true,
    isNew: true
  },
  {
    name: "Cosmos Planetary Ring Glass Spheres",
    slug: "cosmos-planetary-glass-spheres",
    description: "Set of three solid optical glass orbs with suspended internal rings and micro-bubbles for sculptural console styling.",
    price: 3299,
    compareAtPrice: 3899,
    category: "centerpieces",
    style: "Minimal",
    size: "Trio",
    image: img("prod-8"),
    images: [img("prod-8"), img("inspiration-1")],
    tags: ["spheres", "orbs", "optical-glass", "sculpture"],
    inventory: 15,
    featured: false,
    trending: true,
    isNew: true
  }
];

await connectDB();
await CategoryModel.deleteMany({});
await ProductModel.deleteMany({});
await CartItemModel.deleteMany({});
await WishlistModel.deleteMany({});
await CategoryModel.insertMany(categories);
await ProductModel.insertMany(products);
console.log(`Seeded ${categories.length} categories and ${products.length} products.`);
process.exit(0);
