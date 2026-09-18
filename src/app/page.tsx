"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  Camera,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Heart,
  Search,
  Sparkles,
  X,
  ShoppingBag,
  SlidersHorizontal,
  RotateCcw,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  delivery: number;
  category: string | null;
  colors: string[];
  images: string[];
  is_published: boolean;
  is_featured: boolean;
};

const INSTAGRAM_URL =
  "https://www.instagram.com/zyvora.fashion_studio/";

const INSTAGRAM_DM_URL =
  "https://ig.me/m/zyvora.fashion_studio";

const WISHLIST_KEY = "zyvora_wishlist";
const RECENT_KEY = "zyvora_recently_viewed";

export default function Home() {
  const supabase = createClient();

  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productError, setProductError] = useState("");

  const [activeCategory, setActiveCategory] = useState("All");
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");

  const [selectedProduct, setSelectedProduct] =
    useState<Product | null>(null);

  const [selectedImage, setSelectedImage] = useState(0);

  const [wishlist, setWishlist] = useState<string[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);

  const [showWishlistOnly, setShowWishlistOnly] =
    useState(false);

  const [wishlistPulse, setWishlistPulse] = useState<
    string | null
  >(null);

  /* =========================
     LOAD LOCAL DATA
  ========================= */

  useEffect(() => {
    try {
      const savedWishlist = localStorage.getItem(WISHLIST_KEY);
      const savedRecent = localStorage.getItem(RECENT_KEY);

      if (savedWishlist) {
        setWishlist(JSON.parse(savedWishlist));
      }

      if (savedRecent) {
        setRecentlyViewed(JSON.parse(savedRecent));
      }
    } catch (error) {
      console.error("Local storage load error:", error);
    }
  }, []);

  /* =========================
     LOAD PRODUCTS
  ========================= */

  async function loadProducts() {
    setLoadingProducts(true);
    setProductError("");

    const { data, error } = await supabase
      .from("products")
      .select(
        "id,name,description,price,delivery_charge,category,colors,images,is_published,is_featured"
      )
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setProductError(error.message);
      setProducts([]);
      setLoadingProducts(false);
      return;
    }

    const formattedProducts: Product[] = (data || []).map(
      (product) => ({
        id: product.id,
        name: product.name,
        description: product.description || "",
        price: Number(product.price || 0),
        delivery: Number(product.delivery_charge || 0),
        category: product.category || "Collection",
        colors: Array.isArray(product.colors)
          ? product.colors
          : [],
        images: Array.isArray(product.images)
          ? product.images
          : [],
        is_published: product.is_published,
        is_featured: product.is_featured,
      })
    );

    setProducts(formattedProducts);
    setLoadingProducts(false);
  }

  useEffect(() => {
    loadProducts();
  }, []);

  /* =========================
     CATEGORIES
  ========================= */

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(
        products
          .map((product) => product.category)
          .filter(
            (category): category is string => Boolean(category)
          )
      )
    );

    return ["All", ...uniqueCategories];
  }, [products]);

  /* =========================
     WISHLIST
  ========================= */

  function toggleWishlist(productId: string) {
    setWishlist((current) => {
      const exists = current.includes(productId);

      const updated = exists
        ? current.filter((id) => id !== productId)
        : [productId, ...current];

      try {
        localStorage.setItem(
          WISHLIST_KEY,
          JSON.stringify(updated)
        );
      } catch (error) {
        console.error(
          "Wishlist storage error:",
          error
        );
      }

      setWishlistPulse(productId);

      window.setTimeout(() => {
        setWishlistPulse(null);
      }, 450);

      return updated;
    });
  }

  /* =========================
     RECENTLY VIEWED
  ========================= */

  function addToRecentlyViewed(productId: string) {
    setRecentlyViewed((current) => {
      const updated = [
        productId,
        ...current.filter((id) => id !== productId),
      ].slice(0, 6);

      try {
        localStorage.setItem(
          RECENT_KEY,
          JSON.stringify(updated)
        );
      } catch (error) {
        console.error(
          "Recent storage error:",
          error
        );
      }

      return updated;
    });
  }

  /* =========================
     OPEN PRODUCT
  ========================= */

  function openProduct(product: Product) {
    setSelectedProduct(product);
    setSelectedImage(0);
    addToRecentlyViewed(product.id);
  }

  function closeProduct() {
    setSelectedProduct(null);
    setSelectedImage(0);
  }

  /* =========================
     FILTERED PRODUCTS
  ========================= */

  const filteredProducts = useMemo(() => {
    let result = products;

    if (activeCategory !== "All") {
      result = result.filter(
        (product) =>
          product.category === activeCategory
      );
    }

    if (showWishlistOnly) {
      result = result.filter((product) =>
        wishlist.includes(product.id)
      );
    }

    return result;
  }, [
    products,
    activeCategory,
    showWishlistOnly,
    wishlist,
  ]);

  /* =========================
     SEARCH RESULTS
  ========================= */

  const searchResults = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return products;
    }

    return products.filter((product) => {
      const searchableColors =
        product.colors.join(" ");

      return (
        product.name
          .toLowerCase()
          .includes(query) ||
        product.category
          ?.toLowerCase()
          .includes(query) ||
        product.description
          ?.toLowerCase()
          .includes(query) ||
        searchableColors
          .toLowerCase()
          .includes(query)
      );
    });
  }, [products, search]);

  /* =========================
     FEATURED
  ========================= */

  const featuredProduct =
    products.find((product) => product.is_featured) ||
    products[0] ||
    null;

  const secondaryProducts = products
    .filter(
      (product) =>
        product.id !== featuredProduct?.id
    )
    .slice(0, 2);

  /* =========================
     RECENT PRODUCTS
  ========================= */

  const recentProducts = useMemo(() => {
    return recentlyViewed
      .map((id) =>
        products.find(
          (product) => product.id === id
        )
      )
      .filter(
        (product): product is Product =>
          Boolean(product)
      )
      .slice(0, 4);
  }, [recentlyViewed, products]);

  /* =========================
     NAVIGATION
  ========================= */

  function scrollToCollection() {
    document
      .getElementById("collection")
      ?.scrollIntoView({
        behavior: "smooth",
      });
  }

  function scrollToWishlist() {
    document
      .getElementById("collection")
      ?.scrollIntoView({
        behavior: "smooth",
      });

    setShowWishlistOnly(true);
    setActiveCategory("All");
  }

  /* =========================
     PRODUCT IMAGES
  ========================= */

  function nextImage() {
    if (
      !selectedProduct ||
      selectedProduct.images.length === 0
    ) {
      return;
    }

    setSelectedImage((current) =>
      current ===
      selectedProduct.images.length - 1
        ? 0
        : current + 1
    );
  }

  function previousImage() {
    if (
      !selectedProduct ||
      selectedProduct.images.length === 0
    ) {
      return;
    }

    setSelectedImage((current) =>
      current === 0
        ? selectedProduct.images.length - 1
        : current - 1
    );
  }

  /* =========================
     INSTAGRAM ORDER
  ========================= */

  function orderViaInstagram() {
    if (!selectedProduct) return;

    const total =
      selectedProduct.price +
      selectedProduct.delivery;

    const message = `Assalam-o-Alaikum Zyvora 🌸

I would like to place an order.

🛍️ ORDER DETAILS
━━━━━━━━━━━━━━━━━━

📦 Product:
${selectedProduct.name}

🏷️ Category:
${selectedProduct.category}

💰 Product Price:
PKR ${selectedProduct.price.toLocaleString()}

🚚 Delivery Charges:
PKR ${selectedProduct.delivery.toLocaleString()}

💵 Total Amount:
PKR ${total.toLocaleString()}

🎨 Available Colors:
${
      selectedProduct.colors.length > 0
        ? selectedProduct.colors.join(", ")
        : "Please confirm available colors"
    }

📝 Product Details:
${
      selectedProduct.description ||
      "Please confirm product details."
    }

━━━━━━━━━━━━━━━━━━

Please confirm availability and guide me regarding the order.

Thank you! 🌸

Zyvora Fashion Studio`;

    navigator.clipboard
      .writeText(message)
      .then(() => {
        window.open(
          INSTAGRAM_DM_URL,
          "_blank",
          "noopener,noreferrer"
        );
      })
      .catch(() => {
        const textarea =
          document.createElement("textarea");

        textarea.value = message;
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        textarea.style.top = "0";
        textarea.style.opacity = "0";

        document.body.appendChild(textarea);

        textarea.focus();
        textarea.select();
        textarea.setSelectionRange(
          0,
          textarea.value.length
        );

        try {
          document.execCommand("copy");
        } catch (error) {
          console.error(
            "Copy failed:",
            error
          );
        }

        document.body.removeChild(textarea);

        window.open(
          INSTAGRAM_DM_URL,
          "_blank",
          "noopener,noreferrer"
        );
      });
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#17110e] text-[#f5eee7]">
      {/* =========================
          GLOBAL STYLES
      ========================= */}

      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }

        ::selection {
          background: #b99a7a;
          color: #17110e;
        }

        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: #17110e;
        }

        ::-webkit-scrollbar-thumb {
          background: #4e342e;
          border-radius: 999px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #6a4a3e;
        }

        @keyframes zyvoraFadeUp {
          from {
            opacity: 0;
            transform: translateY(16px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes zyvoraScale {
          from {
            opacity: 0;
            transform: scale(0.96);
          }

          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes zyvoraHeart {
          0% {
            transform: scale(1);
          }

          40% {
            transform: scale(1.35);
          }

          70% {
            transform: scale(0.9);
          }

          100% {
            transform: scale(1);
          }
        }

        .zyvora-fade-up {
          animation: zyvoraFadeUp 0.7s ease-out both;
        }

        .zyvora-scale {
          animation: zyvoraScale 0.45s ease-out both;
        }

        .zyvora-heart {
          animation: zyvoraHeart 0.45s ease-out;
        }
      `}</style>

      {/* =========================
          TOP ANNOUNCEMENT
      ========================= */}

      <div className="border-b border-[#34251f] bg-[#1d1511] px-4 py-2.5 text-center">
        <p className="text-[9px] uppercase tracking-[0.25em] text-[#b99a7a] sm:text-xs">
          Zyvora Fashion Studio · Delivery Across Pakistan
        </p>
      </div>

      {/* =========================
          NAVBAR
      ========================= */}

      <header className="sticky top-0 z-40 border-b border-[#34251f]/80 bg-[#17110e]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:h-[76px] sm:px-8 lg:px-10">
          <button
            onClick={() =>
              window.scrollTo({
                top: 0,
                behavior: "smooth",
              })
            }
            className="group text-left"
          >
            <p className="text-[8px] uppercase tracking-[0.42em] text-[#a88969] sm:text-[10px]">
              Fashion Studio
            </p>

            <h1 className="mt-1 text-lg font-light tracking-[0.18em] sm:text-2xl">
              ZYVORA
            </h1>
          </button>

          <nav className="hidden items-center gap-8 text-xs uppercase tracking-[0.2em] text-[#b9aaa0] md:flex">
            <button
              onClick={scrollToCollection}
              className="transition hover:text-white"
            >
              Collection
            </button>

            <button
              onClick={() =>
                document
                  .getElementById("story")
                  ?.scrollIntoView({
                    behavior: "smooth",
                  })
              }
              className="transition hover:text-white"
            >
              Story
            </button>

            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noreferrer"
              className="transition hover:text-white"
            >
              Instagram
            </a>
          </nav>

          <div className="flex items-center gap-2">
            {/* Wishlist */}

            <button
              onClick={scrollToWishlist}
              aria-label="Wishlist"
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#3b2c25] text-[#c7b8ae] transition hover:border-[#806653] hover:text-white"
            >
              <Heart
                size={17}
                fill={
                  wishlist.length > 0
                    ? "#b99a7a"
                    : "none"
                }
                className={
                  wishlist.length > 0
                    ? "text-[#b99a7a]"
                    : ""
                }
              />

              {wishlist.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#f1e7dc] px-1 text-[8px] font-semibold text-[#241914]">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Search */}

            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#3b2c25] text-[#c7b8ae] transition hover:border-[#806653] hover:text-white"
            >
              <Search size={17} />
            </button>

            <button
              onClick={scrollToCollection}
              className="hidden items-center gap-2 rounded-full bg-[#f1e7dc] px-5 py-2.5 text-xs font-medium uppercase tracking-[0.15em] text-[#241914] transition hover:bg-white sm:flex"
            >
              Shop
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </header>

      {/* =========================
          HERO
      ========================= */}

      <section className="relative min-h-[calc(100vh-105px)] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_25%,rgba(128,94,70,0.18),transparent_35%),radial-gradient(circle_at_20%_80%,rgba(86,57,42,0.14),transparent_30%)]" />

        <div className="relative mx-auto grid min-h-[calc(100vh-105px)] max-w-7xl items-center gap-12 px-5 py-14 sm:px-8 lg:grid-cols-2 lg:px-10 lg:py-20">
          <div className="zyvora-fade-up">
            <div className="mb-7 flex items-center gap-3">
              <span className="h-px w-10 bg-[#a88969]" />

              <span className="text-[9px] uppercase tracking-[0.35em] text-[#b99a7a] sm:text-[10px]">
                The New Collection
              </span>
            </div>

            <h2 className="max-w-3xl text-5xl font-light leading-[0.95] tracking-[-0.04em] sm:text-6xl lg:text-8xl">
              Elegance
              <br />

              <span className="italic text-[#b99a7a]">
                without
              </span>

              <br />
              effort.
            </h2>

            <p className="mt-8 max-w-lg text-sm leading-7 text-[#a99b92] sm:text-base">
              Discover thoughtfully selected pieces designed
              to bring quiet luxury, modern femininity and
              effortless style into every moment.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <button
                onClick={scrollToCollection}
                className="group flex items-center gap-3 rounded-full bg-[#f1e7dc] px-6 py-3.5 text-xs font-medium uppercase tracking-[0.15em] text-[#241914] transition hover:bg-white"
              >
                Explore Collection

                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-1"
                />
              </button>

              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 rounded-full border border-[#4a382e] px-6 py-3.5 text-xs uppercase tracking-[0.15em] text-[#c9b9ae] transition hover:border-[#806653] hover:text-white"
              >
                Instagram
              </a>
            </div>

            <div className="mt-12 flex items-center gap-8">
              <div>
                <p className="text-2xl font-light">
                  {products.length}
                </p>

                <p className="mt-1 text-[9px] uppercase tracking-[0.25em] text-[#756860]">
                  Pieces
                </p>
              </div>

              <div className="h-9 w-px bg-[#3b2c25]" />

              <div>
                <p className="text-2xl font-light">
                  {categories.length > 1
                    ? categories.length - 1
                    : 0}
                </p>

                <p className="mt-1 text-[9px] uppercase tracking-[0.25em] text-[#756860]">
                  Categories
                </p>
              </div>

              <div className="h-9 w-px bg-[#3b2c25]" />

              <div>
                <p className="text-2xl font-light">
                  {wishlist.length}
                </p>

                <p className="mt-1 text-[9px] uppercase tracking-[0.25em] text-[#756860]">
                  Saved
                </p>
              </div>
            </div>
          </div>

          <div className="relative zyvora-fade-up">
            {featuredProduct &&
            featuredProduct.images.length > 0 ? (
              <div
                onClick={() =>
                  openProduct(featuredProduct)
                }
                className="group relative block aspect-[4/5] w-full cursor-pointer overflow-hidden rounded-[2rem] border border-[#3b2c25] bg-[#211813] text-left"
              >
                <img
                  src={featuredProduct.images[0]}
                  alt={featuredProduct.name}
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  className="h-full w-full object-cover transition duration-1000 ease-out group-hover:scale-[1.035]"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/5" />

                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    toggleWishlist(
                      featuredProduct.id
                    );
                  }}
                  aria-label="Add to wishlist"
                  className="absolute right-5 top-5 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/20 text-white backdrop-blur-md transition hover:bg-black/40"
                >
                  <Heart
                    size={17}
                    fill={
                      wishlist.includes(
                        featuredProduct.id
                      )
                        ? "#f1e7dc"
                        : "none"
                    }
                    className={
                      wishlistPulse ===
                      featuredProduct.id
                        ? "zyvora-heart"
                        : ""
                    }
                  />
                </button>

                <div className="absolute left-5 top-5 rounded-full border border-white/20 bg-black/20 px-4 py-2 backdrop-blur-md">
                  <span className="text-[9px] uppercase tracking-[0.3em] text-white">
                    {featuredProduct.is_featured
                      ? "Featured"
                      : "Zyvora Edit"}
                  </span>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                  <p className="text-[9px] uppercase tracking-[0.3em] text-[#d8c7b9]">
                    {featuredProduct.category}
                  </p>

                  <h3 className="mt-2 text-2xl font-light sm:text-3xl">
                    {featuredProduct.name}
                  </h3>

                  <div className="mt-3 flex items-center justify-between gap-4">
                    <p className="text-sm text-[#e1d6cf]">
                      PKR{" "}
                      {featuredProduct.price.toLocaleString()}
                    </p>

                    <span className="flex items-center gap-2 text-[9px] uppercase tracking-[0.2em] text-[#d8c7b9] opacity-0 transition duration-300 group-hover:opacity-100">
                      Quick View
                      <ArrowRight size={13} />
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex aspect-[4/5] items-center justify-center rounded-[2rem] border border-[#3b2c25] bg-[#211813]">
                <div className="px-8 text-center">
                  <Sparkles
                    size={30}
                    className="mx-auto mb-5 text-[#8e725c]"
                  />

                  <p className="text-xs uppercase tracking-[0.3em] text-[#8e725c]">
                    Coming Soon
                  </p>

                  <p className="mt-3 text-sm text-[#776961]">
                    Our collection is being prepared.
                  </p>
                </div>
              </div>
            )}

            <div className="absolute -bottom-5 -left-5 hidden h-24 w-24 rounded-full border border-[#4a382e] lg:block" />

            <div className="absolute -right-4 -top-4 hidden h-16 w-16 rounded-full border border-[#4a382e] lg:block" />
          </div>
        </div>

        <button
          onClick={scrollToCollection}
          className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 text-[#776961] md:flex"
        >
          <span className="text-[9px] uppercase tracking-[0.35em]">
            Scroll
          </span>

          <ArrowDown size={15} />
        </button>
      </section>

      {/* =========================
          STATEMENT
      ========================= */}

      <section className="border-y border-[#34251f] bg-[#1b1410]">
        <div className="mx-auto max-w-5xl px-5 py-20 text-center sm:px-8 sm:py-28">
          <Sparkles
            size={20}
            className="mx-auto mb-7 text-[#a88969]"
          />

          <p className="text-2xl font-light leading-relaxed tracking-tight text-[#ded2ca] sm:text-4xl lg:text-5xl">
            "Fashion is not about being seen.

            <span className="italic text-[#b99a7a]">
              {" "}
              It is about being remembered."
            </span>
          </p>
        </div>
      </section>

      {/* =========================
          FEATURED EDIT
      ========================= */}

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
        <div className="mb-12 flex items-end justify-between gap-5">
          <div>
            <p className="text-[10px] uppercase tracking-[0.35em] text-[#a88969]">
              Curated for you
            </p>

            <h2 className="mt-3 text-3xl font-light tracking-tight sm:text-5xl">
              The Featured Edit
            </h2>
          </div>

          <button
            onClick={scrollToCollection}
            className="hidden items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#a88969] transition hover:text-white sm:flex"
          >
            View all
            <ArrowRight size={15} />
          </button>
        </div>

        {featuredProduct ? (
          <div className="grid gap-5 lg:grid-cols-2">
            <div
              onClick={() =>
                openProduct(featuredProduct)
              }
              className="group relative aspect-[4/5] cursor-pointer overflow-hidden rounded-[1.75rem] bg-[#211813] text-left"
            >
              {featuredProduct.images[0] ? (
                <img
                  src={featuredProduct.images[0]}
                  alt={featuredProduct.name}
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  className="h-full w-full object-cover transition duration-1000 group-hover:scale-[1.035]"
                />
              ) : (
                <div className="h-full w-full bg-[#241914]" />
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent" />

              <button
                onClick={(event) => {
                  event.stopPropagation();
                  toggleWishlist(
                    featuredProduct.id
                  );
                }}
                className="absolute right-5 top-5 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/20 text-white backdrop-blur-md"
              >
                <Heart
                  size={17}
                  fill={
                    wishlist.includes(
                      featuredProduct.id
                    )
                      ? "#f1e7dc"
                      : "none"
                  }
                />
              </button>

              <div className="absolute bottom-0 left-0 right-0 p-7 sm:p-9">
                <p className="text-[9px] uppercase tracking-[0.3em] text-[#d3c0b0]">
                  {featuredProduct.category}
                </p>

                <h3 className="mt-2 text-3xl font-light">
                  {featuredProduct.name}
                </h3>

                <p className="mt-2 text-sm text-[#ddd0c7]">
                  PKR{" "}
                  {featuredProduct.price.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
              {secondaryProducts.length > 0 ? (
                secondaryProducts.map(
                  (product, index) => (
                    <div
                      key={product.id}
                      onClick={() =>
                        openProduct(product)
                      }
                      className="group relative min-h-[260px] cursor-pointer overflow-hidden rounded-[1.75rem] bg-[#211813] text-left"
                    >
                      {product.images[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          loading={
                            index === 0
                              ? "eager"
                              : "lazy"
                          }
                          decoding="async"
                          fetchPriority={
                            index === 0
                              ? "high"
                              : "auto"
                          }
                          className="absolute inset-0 h-full w-full object-cover transition duration-1000 group-hover:scale-[1.05]"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-[#241914]" />
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent" />

                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleWishlist(
                            product.id
                          );
                        }}
                        className="absolute right-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/20 text-white backdrop-blur-md"
                      >
                        <Heart
                          size={16}
                          fill={
                            wishlist.includes(
                              product.id
                            )
                              ? "#f1e7dc"
                              : "none"
                          }
                        />
                      </button>

                      <div className="absolute bottom-0 left-0 right-0 p-6">
                        <p className="text-[9px] uppercase tracking-[0.3em] text-[#d3c0b0]">
                          {product.category}
                        </p>

                        <h3 className="mt-1 text-xl font-light">
                          {product.name}
                        </h3>

                        <p className="mt-1 text-sm text-[#ddd0c7]">
                          PKR{" "}
                          {product.price.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )
                )
              ) : (
                <div className="flex min-h-[260px] items-center justify-center rounded-[1.75rem] border border-[#3b2c25] bg-[#211813]">
                  <p className="text-xs uppercase tracking-[0.25em] text-[#756860]">
                    More pieces coming soon
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex min-h-[400px] items-center justify-center rounded-[1.75rem] border border-[#3b2c25] bg-[#211813]">
            <div className="text-center">
              <Sparkles
                size={28}
                className="mx-auto mb-5 text-[#8e725c]"
              />

              <p className="text-xs uppercase tracking-[0.3em] text-[#8e725c]">
                Collection Coming Soon
              </p>
            </div>
          </div>
        )}
      </section>

      {/* =========================
          RECENTLY VIEWED
      ========================= */}

      {recentProducts.length > 0 && (
        <section className="border-y border-[#34251f] bg-[#15100d]">
          <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Clock3
                    size={14}
                    className="text-[#a88969]"
                  />

                  <p className="text-[10px] uppercase tracking-[0.35em] text-[#a88969]">
                    Your selection
                  </p>
                </div>

                <h2 className="mt-3 text-3xl font-light sm:text-4xl">
                  Recently Viewed
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {recentProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() =>
                    openProduct(product)
                  }
                  className="group cursor-pointer"
                >
                  <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-[#241914]">
                    {product.images[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.05]"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Camera
                          size={24}
                          className="text-[#604b3e]"
                        />
                      </div>
                    )}

                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleWishlist(
                          product.id
                        );
                      }}
                      className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/25 text-white backdrop-blur-md"
                    >
                      <Heart
                        size={15}
                        fill={
                          wishlist.includes(
                            product.id
                          )
                            ? "#f1e7dc"
                            : "none"
                        }
                      />
                    </button>
                  </div>

                  <div className="mt-4">
                    <p className="truncate text-sm text-[#eee4dc]">
                      {product.name}
                    </p>

                    <p className="mt-1 text-xs text-[#c0a88f]">
                      PKR{" "}
                      {product.price.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* =========================
          COLLECTION
      ========================= */}

      <section
        id="collection"
        className="border-y border-[#34251f] bg-[#1b1410]"
      >
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
          <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.35em] text-[#a88969]">
                Shop the collection
              </p>

              <h2 className="mt-3 text-3xl font-light tracking-tight sm:text-5xl">
                Find your piece.
              </h2>

              <div className="mt-4 flex items-center gap-3 text-xs text-[#756860]">
                <span>
                  {filteredProducts.length}{" "}
                  {filteredProducts.length === 1
                    ? "piece"
                    : "pieces"}
                </span>

                {showWishlistOnly && (
                  <>
                    <span className="h-1 w-1 rounded-full bg-[#806653]" />

                    <span className="text-[#b99a7a]">
                      Wishlist
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setShowWishlistOnly(
                    !showWishlistOnly
                  );
                  setActiveCategory("All");
                }}
                className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-[10px] uppercase tracking-[0.18em] transition ${
                  showWishlistOnly
                    ? "border-[#f1e7dc] bg-[#f1e7dc] text-[#241914]"
                    : "border-[#46352c] text-[#9e8f86] hover:border-[#806653] hover:text-white"
                }`}
              >
                <Heart
                  size={13}
                  fill={
                    showWishlistOnly
                      ? "#241914"
                      : "none"
                  }
                />

                Wishlist
              </button>

              <div className="hidden h-9 w-px bg-[#3b2c25] sm:block" />

              <div className="hidden items-center gap-2 text-[#756860] sm:flex">
                <SlidersHorizontal size={14} />

                <span className="text-[9px] uppercase tracking-[0.2em]">
                  Filter
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 flex max-w-full gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => {
                  setActiveCategory(category);
                  setShowWishlistOnly(false);
                }}
                className={`whitespace-nowrap rounded-full border px-4 py-2.5 text-[10px] uppercase tracking-[0.2em] transition ${
                  activeCategory === category &&
                  !showWishlistOnly
                    ? "border-[#f1e7dc] bg-[#f1e7dc] text-[#241914]"
                    : "border-[#46352c] text-[#9e8f86] hover:border-[#806653] hover:text-white"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="mt-12">
            {loadingProducts ? (
              <div className="grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map(
                  (item) => (
                    <div
                      key={item}
                      className="overflow-hidden rounded-[1.5rem]"
                    >
                      <div className="aspect-[4/5] animate-pulse bg-[#241914]" />

                      <div className="mt-5 space-y-3">
                        <div className="h-4 w-2/3 animate-pulse rounded bg-[#241914]" />

                        <div className="h-3 w-1/3 animate-pulse rounded bg-[#241914]" />
                      </div>
                    </div>
                  )
                )}
              </div>
            ) : productError ? (
              <div className="rounded-[1.5rem] border border-red-900/40 bg-red-950/20 p-8 text-center">
                <p className="text-sm text-red-300">
                  Products could not be loaded.
                </p>

                <button
                  onClick={loadProducts}
                  className="mt-5 inline-flex items-center gap-2 rounded-full border border-red-800/50 px-5 py-2.5 text-xs uppercase tracking-[0.15em] text-red-200"
                >
                  <RotateCcw size={13} />
                  Try Again
                </button>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="rounded-[1.5rem] border border-[#3b2c25] bg-[#211813] px-6 py-20 text-center">
                <Heart
                  size={28}
                  className="mx-auto mb-5 text-[#806653]"
                />

                <p className="text-xs uppercase tracking-[0.3em] text-[#8e725c]">
                  {showWishlistOnly
                    ? "Your Wishlist Is Empty"
                    : "No Products Found"}
                </p>

                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#756860]">
                  {showWishlistOnly
                    ? "Tap the heart on any product you love and it will appear here."
                    : "Try another category or explore the full collection."}
                </p>

                {showWishlistOnly && (
                  <button
                    onClick={() =>
                      setShowWishlistOnly(false)
                    }
                    className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#f1e7dc] px-5 py-3 text-xs uppercase tracking-[0.15em] text-[#241914]"
                  >
                    Explore Collection
                    <ArrowRight size={14} />
                  </button>
                )}
              </div>
            ) : (
              <div className="grid gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                {filteredProducts.map(
                  (product, index) => {
                    const isWishlisted =
                      wishlist.includes(
                        product.id
                      );

                    return (
                      <div
                        key={product.id}
                        className="group"
                      >
                        {/* PRODUCT IMAGE */}

                        <div
                          onClick={() =>
                            openProduct(product)
                          }
                          className="relative aspect-[4/5] cursor-pointer overflow-hidden rounded-[1.5rem] border border-transparent bg-[#241914] transition duration-500 hover:border-[#49362c] hover:shadow-[0_20px_60px_rgba(0,0,0,0.22)]"
                        >
                          {product.images[0] ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              loading={
                                index < 3
                                  ? "eager"
                                  : "lazy"
                              }
                              fetchPriority={
                                index < 3
                                  ? "high"
                                  : "auto"
                              }
                              decoding="async"
                              className="h-full w-full object-cover transition duration-1000 ease-out group-hover:scale-[1.055]"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <Camera
                                size={28}
                                className="text-[#604b3e]"
                              />
                            </div>
                          )}

                          {/* DARK HOVER */}

                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-70 transition duration-500 group-hover:opacity-90" />

                          {/* CATEGORY */}

                          <div className="absolute left-4 top-4">
                            <span className="rounded-full border border-white/20 bg-black/25 px-3 py-1.5 text-[8px] uppercase tracking-[0.25em] text-white backdrop-blur-md">
                              {product.category}
                            </span>
                          </div>

                          {/* FEATURED */}

                          {product.is_featured && (
                            <div className="absolute left-4 top-14">
                              <span className="flex items-center gap-1.5 rounded-full bg-[#f1e7dc] px-3 py-1.5 text-[8px] uppercase tracking-[0.2em] text-[#241914] shadow-lg">
                                <Sparkles size={9} />
                                Featured
                              </span>
                            </div>
                          )}

                          {/* WISHLIST */}

                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              toggleWishlist(
                                product.id
                              );
                            }}
                            aria-label={
                              isWishlisted
                                ? "Remove from wishlist"
                                : "Add to wishlist"
                            }
                            className={`absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/25 text-white shadow-lg backdrop-blur-md transition duration-300 hover:scale-105 hover:bg-black/45 ${
                              wishlistPulse ===
                              product.id
                                ? "zyvora-heart"
                                : ""
                            }`}
                          >
                            <Heart
                              size={17}
                              fill={
                                isWishlisted
                                  ? "#f1e7dc"
                                  : "none"
                              }
                              className={
                                isWishlisted
                                  ? "text-[#f1e7dc]"
                                  : ""
                              }
                            />
                          </button>

                          {/* QUICK VIEW */}

                          <div className="absolute bottom-5 left-4 right-4 translate-y-3 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                openProduct(
                                  product
                                );
                              }}
                              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#f1e7dc] px-4 py-3 text-[10px] font-medium uppercase tracking-[0.17em] text-[#241914] shadow-xl transition hover:bg-white"
                            >
                              Quick View
                              <ArrowRight
                                size={13}
                              />
                            </button>
                          </div>
                        </div>

                        {/* PRODUCT INFO */}

                        <div className="mt-5">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <p className="truncate text-[17px] font-light text-[#f0e6de] transition group-hover:text-white sm:text-lg">
                                {product.name}
                              </p>

                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <p className="text-[10px] uppercase tracking-[0.16em] text-[#756860]">
                                  {product.colors.length >
                                  0
                                    ? `${
                                        product.colors
                                          .length
                                      } color${
                                        product
                                          .colors
                                          .length >
                                        1
                                          ? "s"
                                          : ""
                                      }`
                                    : "Zyvora Collection"}
                                </p>

                                <span className="h-1 w-1 rounded-full bg-[#604b3e]" />

                                <p className="text-[10px] uppercase tracking-[0.16em] text-[#756860]">
                                  Delivery PKR{" "}
                                  {product.delivery.toLocaleString()}
                                </p>
                              </div>
                            </div>

                            <p className="shrink-0 text-sm text-[#c0a88f]">
                              PKR{" "}
                              {product.price.toLocaleString()}
                            </p>
                          </div>

                          {/* MOBILE QUICK ACTION */}

                          <div className="mt-4 flex items-center gap-2 sm:hidden">
                            <button
                              onClick={() =>
                                openProduct(product)
                              }
                              className="flex flex-1 items-center justify-center gap-2 rounded-full border border-[#4a382e] px-4 py-2.5 text-[9px] uppercase tracking-[0.16em] text-[#c9b9ae] transition active:bg-[#241914]"
                            >
                              View Details
                              <ArrowRight
                                size={12}
                              />
                            </button>

                            <button
                              onClick={() =>
                                toggleWishlist(
                                  product.id
                                )
                              }
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition ${
                                isWishlisted
                                  ? "border-[#806653] bg-[#f1e7dc] text-[#241914]"
                                  : "border-[#4a382e] text-[#c9b9ae]"
                              }`}
                            >
                              <Heart
                                size={15}
                                fill={
                                  isWishlisted
                                    ? "currentColor"
                                    : "none"
                                }
                              />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* =========================
          QUOTE
      ========================= */}

      <section className="mx-auto max-w-4xl px-5 py-24 text-center sm:px-8 lg:py-32">
        <p className="text-[10px] uppercase tracking-[0.35em] text-[#806653]">
          The Zyvora Philosophy
        </p>

        <h2 className="mt-7 text-3xl font-light leading-tight sm:text-5xl">
          Designed for women who

          <span className="italic text-[#b99a7a]">
            {" "}
            define their own style.
          </span>
        </h2>
      </section>

      {/* =========================
          STORY
      ========================= */}

      <section
        id="story"
        className="border-y border-[#34251f] bg-[#1b1410]"
      >
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 sm:px-8 lg:grid-cols-2 lg:px-10 lg:py-28">
          <div className="relative overflow-hidden rounded-[1.75rem] bg-[#241914]">
            {featuredProduct?.images[0] ? (
              <img
                src={featuredProduct.images[0]}
                alt="Zyvora"
                loading="lazy"
                decoding="async"
                className="aspect-[4/5] h-full w-full object-cover transition duration-700 hover:scale-[1.02]"
              />
            ) : (
              <div className="aspect-[4/5] w-full bg-[#241914]" />
            )}
          </div>

          <div className="lg:pl-10">
            <p className="text-[10px] uppercase tracking-[0.35em] text-[#a88969]">
              Our Story
            </p>

            <h2 className="mt-4 text-4xl font-light leading-tight sm:text-5xl">
              Quiet luxury.
              <br />

              <span className="italic text-[#b99a7a]">
                Everyday confidence.
              </span>
            </h2>

            <div className="mt-7 space-y-5 text-sm leading-7 text-[#9f9188]">
              <p>
                Zyvora was created around a simple idea:
                fashion should feel personal, effortless
                and beautifully yours.
              </p>

              <p>
                Every piece is selected with attention to
                detail, versatility and the modern woman who
                wants to express herself without following
                every trend.
              </p>

              <p>
                From everyday essentials to statement
                pieces, Zyvora brings together a collection
                made to fit naturally into your world.
              </p>
            </div>

            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-9 inline-flex items-center gap-3 border-b border-[#806653] pb-2 text-xs uppercase tracking-[0.2em] text-[#c5ad96] transition hover:text-white"
            >
              Follow Zyvora
              <ArrowRight size={14} />
            </a>
          </div>
        </div>
      </section>

      {/* =========================
          INSTAGRAM
      ========================= */}

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
        <div className="mb-10 flex items-end justify-between gap-5">
          <div>
            <p className="text-[10px] uppercase tracking-[0.35em] text-[#a88969]">
              Follow the world of Zyvora
            </p>

            <h2 className="mt-3 text-3xl font-light sm:text-5xl">
              @zyvora.fashion_studio
            </h2>
          </div>

          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noreferrer"
            className="hidden items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#a88969] transition hover:text-white sm:flex"
          >
            Instagram
            <ArrowRight size={15} />
          </a>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {products.slice(0, 4).map(
              (product, index) => (
                <div
                  key={product.id}
                  onClick={() =>
                    openProduct(product)
                  }
                  className="group relative aspect-square cursor-pointer overflow-hidden rounded-2xl bg-[#241914]"
                >
                  {product.images[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      loading={
                        index === 0
                          ? "eager"
                          : "lazy"
                      }
                      decoding="async"
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Camera
                        size={24}
                        className="text-[#604b3e]"
                      />
                    </div>
                  )}

                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition duration-500 group-hover:bg-black/30">
                    <Camera
                      size={20}
                      className="scale-75 text-white opacity-0 transition group-hover:scale-100 group-hover:opacity-100"
                    />
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 translate-y-2 opacity-0 transition duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                    <div className="rounded-full bg-black/35 px-3 py-2 text-center text-[8px] uppercase tracking-[0.2em] text-white backdrop-blur-md">
                      View Piece
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        ) : (
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noreferrer"
            className="flex min-h-[220px] items-center justify-center rounded-[1.5rem] border border-[#3b2c25] bg-[#211813] text-center transition hover:border-[#6c5546]"
          >
            <div>
              <Camera
                size={28}
                className="mx-auto mb-5 text-[#806653]"
              />

              <p className="text-xs uppercase tracking-[0.3em] text-[#8e725c]">
                Visit Instagram
              </p>

              <p className="mt-3 text-sm text-[#756860]">
                @zyvora.fashion_studio
              </p>
            </div>
          </a>
        )}
      </section>

      {/* =========================
          FOOTER
      ========================= */}

      <footer className="border-t border-[#34251f] bg-[#130e0b]">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10">
          <div className="grid gap-10 md:grid-cols-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.4em] text-[#a88969]">
                Fashion Studio
              </p>

              <h3 className="mt-2 text-2xl font-light tracking-[0.18em]">
                ZYVORA
              </h3>

              <p className="mt-4 max-w-sm text-sm leading-6 text-[#71635b]">
                Curated fashion for the modern woman.
                Effortless pieces, thoughtful details.
              </p>
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#806653]">
                Explore
              </p>

              <div className="mt-5 flex flex-col gap-3 text-sm text-[#95857b]">
                <button
                  onClick={scrollToCollection}
                  className="w-fit transition hover:text-white"
                >
                  Collection
                </button>

                <button
                  onClick={() =>
                    document
                      .getElementById("story")
                      ?.scrollIntoView({
                        behavior: "smooth",
                      })
                  }
                  className="w-fit transition hover:text-white"
                >
                  Our Story
                </button>

                <button
                  onClick={() => {
                    setShowWishlistOnly(true);
                    setActiveCategory("All");
                    scrollToCollection();
                  }}
                  className="flex w-fit items-center gap-2 transition hover:text-white"
                >
                  Wishlist
                  {wishlist.length > 0 && (
                    <span className="text-[10px] text-[#b99a7a]">
                      ({wishlist.length})
                    </span>
                  )}
                </button>

                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="w-fit transition hover:text-white"
                >
                  Instagram
                </a>
              </div>
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#806653]">
                Connect
              </p>

              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex items-center gap-2 text-sm text-[#95857b] transition hover:text-white"
              >
                @zyvora.fashion_studio
                <ArrowRight size={14} />
              </a>

              <p className="mt-3 text-xs text-[#5f514a]">
                Delivery available across Pakistan
              </p>
            </div>
          </div>

          <div className="mt-12 border-t border-[#2c211c] pt-6">
            <p className="text-center text-[10px] uppercase tracking-[0.25em] text-[#544740]">
              © {new Date().getFullYear()} Zyvora Fashion
              Studio. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* =========================
          SEARCH OVERLAY
      ========================= */}

      {searchOpen && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-[#120d0a]/95 backdrop-blur-xl">
          <div className="mx-auto min-h-full max-w-3xl px-5 py-8 sm:px-8 sm:py-12">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.35em] text-[#a88969]">
                  Zyvora Search
                </p>

                <h2 className="mt-2 text-3xl font-light">
                  Find your piece.
                </h2>
              </div>

              <button
                onClick={() => {
                  setSearchOpen(false);
                  setSearch("");
                }}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-[#46352c] text-[#b9aaa0] transition hover:border-[#806653] hover:text-white"
              >
                <X size={19} />
              </button>
            </div>

            <div className="mt-10 flex items-center gap-3 border-b border-[#49362c] pb-4">
              <Search
                size={19}
                className="text-[#806653]"
              />

              <input
                autoFocus
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search products, categories, colors..."
                className="w-full bg-transparent text-lg text-white outline-none placeholder:text-[#5f514a]"
              />
            </div>

            <div className="mt-8">
              <div className="mb-5 flex items-center justify-between">
                <p className="text-[9px] uppercase tracking-[0.25em] text-[#806653]">
                  {searchResults.length} Results
                </p>

                {search && (
                  <button
                    onClick={() =>
                      setSearch("")
                    }
                    className="text-[9px] uppercase tracking-[0.2em] text-[#8e725c] hover:text-white"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="max-h-[65vh] overflow-y-auto">
                {searchResults.length === 0 ? (
                  <div className="py-16 text-center">
                    <Search
                      size={26}
                      className="mx-auto mb-5 text-[#604b3e]"
                    />

                    <p className="text-sm text-[#756860]">
                      No products found.
                    </p>

                    <p className="mt-2 text-xs text-[#51443d]">
                      Try another name, category or
                      color.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {searchResults.map(
                      (product) => (
                        <div
                          key={product.id}
                          onClick={() => {
                            setSearchOpen(
                              false
                            );
                            setSearch("");
                            openProduct(
                              product
                            );
                          }}
                          className="group flex cursor-pointer items-center gap-4 rounded-2xl border border-[#30231e] bg-[#1c1410] p-3 text-left transition hover:border-[#624b3d] hover:bg-[#211813]"
                        >
                          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#241914]">
                            {product.images[0] && (
                              <img
                                src={
                                  product.images[0]
                                }
                                alt={
                                  product.name
                                }
                                loading="lazy"
                                decoding="async"
                                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                              />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm text-[#eee4dc]">
                              {product.name}
                            </p>

                            <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-[#806653]">
                              {product.category}
                            </p>

                            {product.colors
                              .length >
                              0 && (
                              <p className="mt-1 truncate text-[9px] text-[#665850]">
                                {
                                  product
                                    .colors
                                    .length
                                }{" "}
                                colors
                              </p>
                            )}
                          </div>

                          <div className="text-right">
                            <p className="text-sm text-[#c0a88f]">
                              PKR{" "}
                              {product.price.toLocaleString()}
                            </p>

                            <ArrowRight
                              size={13}
                              className="ml-auto mt-2 text-[#604b3e] transition group-hover:translate-x-1 group-hover:text-[#b99a7a]"
                            />
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================
          PRODUCT MODAL
      ========================= */}

      {selectedProduct && (
        <div className="fixed inset-0 z-[90] overflow-y-auto bg-[#120d0a]/95 p-3 backdrop-blur-xl sm:p-8">
          <div className="mx-auto flex min-h-full max-w-6xl items-center justify-center">
            <div className="zyvora-scale relative grid w-full overflow-hidden rounded-[1.75rem] border border-[#3d2d25] bg-[#1b1410] lg:grid-cols-2 lg:rounded-[2rem]">
              {/* CLOSE */}

              <button
                onClick={closeProduct}
                aria-label="Close product"
                className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/35 text-white backdrop-blur-md transition hover:bg-black/55 sm:right-4 sm:top-4 sm:h-11 sm:w-11"
              >
                <X size={18} />
              </button>

              {/* WISHLIST MODAL */}

              <button
                onClick={() =>
                  toggleWishlist(
                    selectedProduct.id
                  )
                }
                aria-label="Wishlist"
                className="absolute right-16 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/35 text-white backdrop-blur-md transition hover:bg-black/55 sm:right-20 sm:top-4 sm:h-11 sm:w-11"
              >
                <Heart
                  size={17}
                  fill={
                    wishlist.includes(
                      selectedProduct.id
                    )
                      ? "#f1e7dc"
                      : "none"
                  }
                  className={
                    wishlistPulse ===
                    selectedProduct.id
                      ? "zyvora-heart"
                      : ""
                  }
                />
              </button>

              {/* IMAGE */}

              <div className="relative bg-[#241914]">
                {selectedProduct.images.length >
                0 ? (
                  <>
                    <img
                      src={
                        selectedProduct.images[
                          selectedImage
                        ] ||
                        selectedProduct.images[0]
                      }
                      alt={
                        selectedProduct.name
                      }
                      loading="eager"
                      fetchPriority="high"
                      decoding="async"
                      className="aspect-[4/5] w-full object-cover lg:aspect-auto lg:h-full lg:min-h-[650px]"
                    />

                    {selectedProduct.images
                      .length > 1 && (
                      <>
                        <button
                          onClick={
                            previousImage
                          }
                          aria-label="Previous image"
                          className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white backdrop-blur-md transition hover:bg-black/50 sm:left-4"
                        >
                          <ChevronLeft
                            size={18}
                          />
                        </button>

                        <button
                          onClick={nextImage}
                          aria-label="Next image"
                          className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white backdrop-blur-md transition hover:bg-black/50 sm:right-4"
                        >
                          <ChevronRight
                            size={18}
                          />
                        </button>
                      </>
                    )}

                    {selectedProduct.images
                      .length > 1 && (
                      <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-2 backdrop-blur-md">
                        {selectedProduct.images.map(
                          (_, index) => (
                            <button
                              key={index}
                              onClick={() =>
                                setSelectedImage(
                                  index
                                )
                              }
                              className={`h-1.5 rounded-full transition-all ${
                                selectedImage ===
                                index
                                  ? "w-7 bg-white"
                                  : "w-2 bg-white/40"
                              }`}
                            />
                          )
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex aspect-[4/5] items-center justify-center lg:min-h-[650px]">
                    <Camera
                      size={35}
                      className="text-[#604b3e]"
                    />
                  </div>
                )}
              </div>

              {/* PRODUCT DETAILS */}

              <div className="flex flex-col justify-center p-6 sm:p-10 lg:p-14">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-[9px] uppercase tracking-[0.35em] text-[#a88969]">
                      {selectedProduct.category}
                    </p>

                    {selectedProduct.is_featured && (
                      <>
                        <span className="h-1 w-1 rounded-full bg-[#806653]" />

                        <span className="flex items-center gap-1 text-[9px] uppercase tracking-[0.2em] text-[#b99a7a]">
                          <Sparkles size={10} />
                          Featured
                        </span>
                      </>
                    )}
                  </div>

                  <h2 className="mt-3 text-3xl font-light leading-tight sm:text-4xl">
                    {selectedProduct.name}
                  </h2>

                  <p className="mt-5 text-xl text-[#c3aa91]">
                    PKR{" "}
                    {selectedProduct.price.toLocaleString()}
                  </p>

                  <p className="mt-1 text-xs text-[#756860]">
                    Delivery: PKR{" "}
                    {selectedProduct.delivery.toLocaleString()}
                  </p>
                </div>

                <div className="my-8 h-px bg-[#34251f]" />

                <p className="text-sm leading-7 text-[#9f9188]">
                  {selectedProduct.description ||
                    "A thoughtfully selected Zyvora piece designed for effortless style and everyday elegance."}
                </p>

                {selectedProduct.colors.length >
                  0 && (
                  <div className="mt-8">
                    <div className="flex items-center justify-between">
                      <p className="text-[9px] uppercase tracking-[0.3em] text-[#806653]">
                        Available Colors
                      </p>

                      <span className="text-[9px] text-[#665850]">
                        {
                          selectedProduct
                            .colors.length
                        }{" "}
                        options
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedProduct.colors.map(
                        (color, index) => (
                          <span
                            key={`${color}-${index}`}
                            className="rounded-full border border-[#4b392f] px-3 py-1.5 text-xs text-[#c2b3a9] transition hover:border-[#806653] hover:text-white"
                          >
                            {color}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-9 rounded-2xl border border-[#33261f] bg-[#17110e] p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#241914]">
                      <ShoppingBag
                        size={15}
                        className="text-[#b99a7a]"
                      />
                    </div>

                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-[#c9b9ae]">
                        Delivery Across Pakistan
                      </p>

                      <p className="mt-1 text-[10px] text-[#665850]">
                        Order confirmation and
                        availability will be confirmed
                        in DM.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-7">
                  <button
                    type="button"
                    onClick={
                      orderViaInstagram
                    }
                    className="group flex w-full items-center justify-center gap-3 rounded-full bg-[#f1e7dc] px-6 py-4 text-xs font-medium uppercase tracking-[0.17em] text-[#241914] transition hover:bg-white"
                  >
                    Order via Instagram

                    <ArrowRight
                      size={16}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </button>

                  <p className="mt-4 text-center text-[10px] leading-5 text-[#665850]">
                    Order details are copied
                    automatically. Open Instagram and
                    paste the message in our DM.
                  </p>
                </div>

                <button
                  onClick={() => {
                    toggleWishlist(
                      selectedProduct.id
                    );
                  }}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-[#4a382e] px-6 py-3.5 text-[10px] uppercase tracking-[0.17em] text-[#b9aaa0] transition hover:border-[#806653] hover:text-white"
                >
                  <Heart
                    size={14}
                    fill={
                      wishlist.includes(
                        selectedProduct.id
                      )
                        ? "currentColor"
                        : "none"
                    }
                  />

                  {wishlist.includes(
                    selectedProduct.id
                  )
                    ? "Saved to Wishlist"
                    : "Save to Wishlist"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}