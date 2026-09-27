export function About() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-champagne">
            Our story
          </p>

          <h1 className="mt-2 font-display text-4xl text-ink">
            Welcome to Sangrah.
          </h1>

          <p className="mt-6 leading-8 text-ink/68">
            Sangrah is a curated e-commerce destination where timeless
            treasures, modern essentials, and unique finds come together.
            We believe shopping should be more than simply buying a product —
            it should be about discovering something that feels special.
          </p>

          <p className="mt-4 leading-8 text-ink/68">
            From traditional pieces to contemporary products, Sangrah brings
            together a diverse collection designed for different tastes,
            occasions, and lifestyles.
          </p>

          <p className="mt-4 leading-8 text-ink/68">
            Our goal is simple: make discovering beautiful, useful, and
            meaningful products easy, enjoyable, and accessible.
          </p>
        </div>

        <div>
          <img
            src="/images/modi-glass-collection.png"
            alt="Sangrah collection"
            className="rounded-lg object-cover shadow-xl"
          />
        </div>
      </div>

      <div className="mt-16 grid gap-5 md:grid-cols-3">
        {[
          "Curated Collection",
          "Quality & Value",
          "Something for Everyone",
        ].map((item) => (
          <div
            key={item}
            className="rounded-lg border border-ink/10 bg-white p-6"
          >
            <h2 className="font-display text-2xl">{item}</h2>

            <p className="mt-3 text-sm leading-7 text-ink/68">
              Thoughtfully selected products that bring together quality,
              character, and everyday usefulness.
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}