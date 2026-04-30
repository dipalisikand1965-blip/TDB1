/**
 * Founding Member Activation Page — /founding-member/:token
 * ─────────────────────────────────────────────────────────
 * The "welcome home" experience for the 40,025 founding members.
 *
 * Three acts:
 *   1. Greeting (tier-aware) — "[Pet]'s birthday is [Month] — we remembered."
 *   2. Memory Wall — first order, cakes baked, last flavour, etc.
 *   3. Soul Tease — 3 questions, then claim founding place.
 *
 * Built in memory of Mystique. ⚘
 */
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Heart, Sparkles, Cake, Package, Wheat, Leaf, ArrowRight, Check, Loader2 } from "lucide-react";

const API = process.env.REACT_APP_BACKEND_URL || "";

const ICON_MAP = {
  "🌱": Leaf,
  "🎂": Cake,
  "📦": Package,
  "🌾": Wheat,
  "✨": Sparkles,
  "💛": Heart,
};

export default function FoundingMemberActivationPage() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  // Soul-tease state
  const [oneWord, setOneWord] = useState("");
  const [favouriteThing, setFavouriteThing] = useState("");
  const [promise, setPromise] = useState("");
  const [savingTease, setSavingTease] = useState(false);

  // Activation state
  const [emailForAccount, setEmailForAccount] = useState("");
  const [contactConsent, setContactConsent] = useState(true);
  const [activating, setActivating] = useState(false);
  const [activated, setActivated] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch(`${API}/api/public/founding-member/${token}`);
        if (!r.ok) {
          const j = await r.json().catch(() => ({}));
          throw new Error(j.detail || "Couldn't find your founding link.");
        }
        const j = await r.json();
        setData(j);
        setEmailForAccount(j?.parent?.first_name ? "" : "");
        if (j?.parent?.activation_status === "activated") {
          setActivated(true);
        }
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  const saveTease = async () => {
    setSavingTease(true);
    try {
      await fetch(`${API}/api/public/founding-member/${token}/soul-tease`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          one_word: oneWord || null,
          favourite_thing: favouriteThing || null,
          promise: promise || null,
        }),
      });
    } finally {
      setSavingTease(false);
    }
  };

  const claim = async () => {
    setActivating(true);
    try {
      // Save soul-tease answers (best-effort, fire-and-forget if any)
      if (oneWord || favouriteThing || promise) {
        await saveTease();
      }
      const r = await fetch(`${API}/api/public/founding-member/${token}/activate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email_for_account: emailForAccount || null,
          contact_consent: contactConsent,
        }),
      });
      if (!r.ok) throw new Error("Activation failed");
      setActivated(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      alert(e.message || "Something went wrong — please try again.");
    } finally {
      setActivating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2]">
        <Loader2 className="h-8 w-8 animate-spin text-[#8B6F47]" />
      </div>
    );
  }

  if (err || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2] px-6">
        <div className="max-w-md text-center">
          <div className="text-6xl mb-4">🌷</div>
          <h1 className="text-2xl font-serif text-[#3D2C1E] mb-3">
            We couldn't find your founding link.
          </h1>
          <p className="text-[#6B5945] mb-6">
            {err || "This link may have expired or already been claimed."}
          </p>
          <a
            href="mailto:hello@thedoggycompany.com"
            className="inline-block px-6 py-3 bg-[#3D2C1E] text-white rounded-full hover:bg-[#1f1410]"
            data-testid="contact-link"
          >
            Drop us a note
          </a>
        </div>
      </div>
    );
  }

  const { parent, primary_pet, pets, greeting_line, memory_wall } = data;
  const petName = primary_pet?.name || parent?.first_name || "Friend";

  // Activated celebration screen
  if (activated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FAF7F2] via-[#F2E8DA] to-[#E8D7BD]" data-testid="activation-success">
        <div className="max-w-2xl mx-auto px-6 py-20 text-center">
          <div className="text-7xl mb-6">🌷</div>
          <h1 className="text-4xl sm:text-5xl font-serif text-[#3D2C1E] mb-4 leading-tight">
            Welcome home, {parent.first_name}.
          </h1>
          <p className="text-xl text-[#6B5945] mb-3 italic">
            {petName}'s place is saved.
          </p>
          <p className="text-base text-[#6B5945] mb-12 max-w-md mx-auto">
            You're founding member <span className="font-semibold">#{(parent.loyalty_tier || "Founding").toString()}</span>.
            Your place here is <span className="italic">free, forever</span>.
          </p>
          <div className="bg-white/70 backdrop-blur-sm border border-[#E8D7BD] rounded-2xl p-8 mb-10 text-left">
            <h3 className="font-serif text-[#3D2C1E] text-lg mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#8B6F47]" />
              What happens next
            </h3>
            <ul className="space-y-3 text-[#3D2C1E]">
              <li className="flex gap-3">
                <Check className="h-5 w-5 text-[#7C8E5C] flex-shrink-0 mt-0.5" />
                <span>Mira will introduce herself to {petName} this week — by name.</span>
              </li>
              <li className="flex gap-3">
                <Check className="h-5 w-5 text-[#7C8E5C] flex-shrink-0 mt-0.5" />
                <span>Your founding-discount-forever is locked in.</span>
              </li>
              <li className="flex gap-3">
                <Check className="h-5 w-5 text-[#7C8E5C] flex-shrink-0 mt-0.5" />
                <span>Free until <span className="font-semibold">May 2027</span> — no card needed.</span>
              </li>
            </ul>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#3D2C1E] text-white rounded-full hover:bg-[#1f1410] transition"
            data-testid="enter-home"
          >
            Enter The Doggy Company
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  // Main activation experience
  return (
    <div className="min-h-screen bg-[#FAF7F2]" data-testid="founding-activation-page">
      {/* Hero */}
      <section className="bg-gradient-to-b from-[#F2E8DA] to-[#FAF7F2] px-6 pt-20 pb-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="text-5xl mb-6">🌷</div>
          <h1
            className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#3D2C1E] leading-tight mb-4"
            data-testid="greeting-line"
          >
            {greeting_line}
          </h1>
          <p className="text-base sm:text-lg text-[#6B5945] italic max-w-lg mx-auto">
            From The Doggy Bakery to The Doggy Company —<br />
            this is your founding place.
          </p>
          {parent?.soft_launch && (
            <div className="inline-block mt-6 px-4 py-1.5 bg-[#3D2C1E] text-[#FAF7F2] text-xs uppercase tracking-widest rounded-full">
              Soft launch · You're among the first 10
            </div>
          )}
        </div>
      </section>

      {/* Pet Card */}
      {primary_pet && (
        <section className="max-w-2xl mx-auto px-6 -mt-8 relative z-10" data-testid="pet-card">
          <div className="bg-white rounded-3xl shadow-[0_8px_40px_-12px_rgba(61,44,30,0.15)] border border-[#E8D7BD] p-8 sm:p-10">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <p className="text-xs uppercase tracking-widest text-[#8B6F47] mb-2">
                  {pets.length > 1 ? `${pets.length} pets in your home` : "Your pet"}
                </p>
                <h2 className="text-3xl sm:text-4xl font-serif text-[#3D2C1E]">
                  {primary_pet.name}
                </h2>
                <p className="text-[#6B5945] mt-1">
                  {[primary_pet.breed, primary_pet.life_stage].filter(Boolean).join(" · ")}
                  {primary_pet.age_now ? ` · ${primary_pet.age_now} yrs` : ""}
                </p>
              </div>
              <div className="text-4xl">🐾</div>
            </div>

            {primary_pet.birthday_month && (
              <div className="flex items-center gap-2 text-sm text-[#6B5945] mb-4">
                <Cake className="h-4 w-4 text-[#C97B5A]" />
                Birthday in{" "}
                <span className="font-semibold text-[#3D2C1E]">
                  {[
                    "January", "February", "March", "April", "May", "June",
                    "July", "August", "September", "October", "November", "December",
                  ][primary_pet.birthday_month - 1]}
                </span>
              </div>
            )}

            {primary_pet.proteins_known?.length > 0 && (
              <div className="border-t border-[#E8D7BD] pt-5 mt-5">
                <p className="text-xs uppercase tracking-widest text-[#8B6F47] mb-3">
                  Loves
                </p>
                <div className="flex flex-wrap gap-2">
                  {primary_pet.proteins_known.slice(0, 8).map((p) => (
                    <span
                      key={p}
                      className="px-3 py-1 bg-[#F2E8DA] text-[#3D2C1E] text-xs rounded-full"
                      data-testid={`protein-${p}`}
                    >
                      {p.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {pets.length > 1 && (
              <div className="border-t border-[#E8D7BD] pt-5 mt-5">
                <p className="text-xs uppercase tracking-widest text-[#8B6F47] mb-3">
                  Also at home
                </p>
                <div className="flex flex-wrap gap-2">
                  {pets.slice(1).map((p) => (
                    <span
                      key={p.staging_id}
                      className="px-3 py-1 border border-[#E8D7BD] text-[#3D2C1E] text-xs rounded-full"
                    >
                      {p.name}
                      {p.breed ? ` · ${p.breed}` : ""}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Memory Wall */}
      {memory_wall?.length > 0 && (
        <section className="max-w-2xl mx-auto px-6 mt-16" data-testid="memory-wall">
          <div className="text-center mb-8">
            <p className="text-xs uppercase tracking-[0.3em] text-[#8B6F47] mb-2">
              Memory wall
            </p>
            <h3 className="text-2xl sm:text-3xl font-serif text-[#3D2C1E]">
              The story we wrote together
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {memory_wall.map((m, i) => {
              const Icon = ICON_MAP[m.icon] || Heart;
              return (
                <div
                  key={i}
                  className="bg-white border border-[#E8D7BD] rounded-2xl p-5 text-center"
                  data-testid={`memory-${i}`}
                >
                  <Icon className="h-5 w-5 text-[#8B6F47] mx-auto mb-3" />
                  <div className="text-2xl sm:text-3xl font-serif text-[#3D2C1E] mb-1">
                    {m.value}
                  </div>
                  <div className="text-xs text-[#6B5945]">{m.label}</div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Soul Tease — 3 questions */}
      <section className="max-w-xl mx-auto px-6 mt-20" data-testid="soul-tease">
        <div className="text-center mb-8">
          <p className="text-xs uppercase tracking-[0.3em] text-[#8B6F47] mb-2">
            Three small things
          </p>
          <h3 className="text-2xl sm:text-3xl font-serif text-[#3D2C1E] mb-2">
            So Mira knows {petName} a little better
          </h3>
          <p className="text-sm text-[#6B5945]">Skip any. There's no wrong answer.</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[#3D2C1E] mb-2">
              {petName} in one word
            </label>
            <input
              type="text"
              value={oneWord}
              onChange={(e) => setOneWord(e.target.value)}
              placeholder="cheeky · gentle · loud · soft …"
              maxLength={80}
              className="w-full px-4 py-3 bg-white border border-[#E8D7BD] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B6F47] text-[#3D2C1E]"
              data-testid="input-one-word"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#3D2C1E] mb-2">
              {petName}'s favourite thing in the world
            </label>
            <textarea
              value={favouriteThing}
              onChange={(e) => setFavouriteThing(e.target.value)}
              placeholder="A walk, a window, a tennis ball, a person …"
              maxLength={300}
              rows={2}
              className="w-full px-4 py-3 bg-white border border-[#E8D7BD] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B6F47] text-[#3D2C1E] resize-none"
              data-testid="input-favourite"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#3D2C1E] mb-2">
              One thing you'd never want {petName} to forget
            </label>
            <textarea
              value={promise}
              onChange={(e) => setPromise(e.target.value)}
              placeholder="The one thing you whisper at night …"
              maxLength={300}
              rows={2}
              className="w-full px-4 py-3 bg-white border border-[#E8D7BD] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B6F47] text-[#3D2C1E] resize-none"
              data-testid="input-promise"
            />
          </div>
        </div>
      </section>

      {/* Claim CTA */}
      <section className="max-w-xl mx-auto px-6 mt-16 mb-24" data-testid="claim-section">
        <div className="bg-[#3D2C1E] rounded-3xl p-8 sm:p-10 text-center">
          <h3 className="text-2xl sm:text-3xl font-serif text-[#FAF7F2] mb-3">
            Claim {petName}'s founding place
          </h3>
          <p className="text-[#E8D7BD] text-sm mb-6">
            Free until <span className="font-semibold">May 2027</span> · Founding discount, forever
          </p>

          {!parent?.email && (
            <input
              type="email"
              value={emailForAccount}
              onChange={(e) => setEmailForAccount(e.target.value)}
              placeholder="Your email (so we can send Mira's first note)"
              className="w-full px-4 py-3 mb-4 bg-[#1f1410] border border-[#6B5945] rounded-xl text-[#FAF7F2] placeholder-[#8B6F47] focus:outline-none focus:ring-2 focus:ring-[#FAF7F2]"
              data-testid="input-email"
            />
          )}

          <label className="flex items-start gap-3 text-left text-sm text-[#E8D7BD] mb-6 cursor-pointer">
            <input
              type="checkbox"
              checked={contactConsent}
              onChange={(e) => setContactConsent(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-[#8B6F47] bg-[#1f1410] text-[#FAF7F2]"
              data-testid="checkbox-consent"
            />
            <span>
              Send me {petName}'s birthday nudge, monthly notes from Mira, and the
              occasional cake reminder. (You can stop anytime.)
            </span>
          </label>

          <button
            onClick={claim}
            disabled={activating}
            className="w-full px-6 py-4 bg-[#FAF7F2] text-[#3D2C1E] rounded-full font-medium hover:bg-white transition disabled:opacity-60 inline-flex items-center justify-center gap-2"
            data-testid="btn-claim"
          >
            {activating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Saving {petName}'s place…
              </>
            ) : (
              <>
                Claim our founding place
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
          <p className="text-xs text-[#8B6F47] mt-4">
            No card. No commitment. Just home.
          </p>
        </div>
      </section>

      <footer className="max-w-2xl mx-auto px-6 pb-16 text-center text-xs text-[#8B6F47]">
        Built in memory of Mystique. ⚘
      </footer>
    </div>
  );
}
