import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";

export function Contact() {
  return (
    <section className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:px-8">
      <div>
        <p className="text-sm uppercase tracking-[0.24em] text-champagne">Contact</p>
        <h1 className="mt-2 font-display text-5xl">Styling help, bulk gifting, and decor sourcing.</h1>
        <p className="mt-5 leading-8 text-ink/65">Tell us what you are styling and our team will suggest pieces that suit your space, palette, and budget.</p>
        <div className="mt-8 rounded-lg bg-white p-6 text-sm leading-8 text-ink/70">
          WhatsApp: +91 99999 99999<br />
          Email: support@sangrah.com<br />
          Hours: Monday to Saturday, 10 AM - 7 PM
        </div>
      </div>
      <form className="rounded-lg border border-ink/10 bg-white p-6" onSubmit={(e) => e.preventDefault()}>
        <div className="grid gap-4">
          <Input placeholder="Name" required />
          <Input type="email" placeholder="Email" required />
          <Input placeholder="Subject" required />
          <Textarea placeholder="Tell us about your project" required />
          <Button type="submit" variant="dark"><Send className="h-4 w-4" /> Send enquiry</Button>
        </div>
      </form>
    </section>
  );
}
