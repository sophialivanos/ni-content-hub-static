// pages/index.tsx
function Emphasis({ children }: { children: React.ReactNode }) {
  // Bold, gradient text only — no background, no outline
  return (
    <span
      className="inline-block align-baseline text-xl md:text-2xl font-extrabold tracking-tight
                 bg-clip-text text-transparent
                 bg-gradient-to-r from-indigo-700 via-violet-700 to-fuchsia-700"
    >
      {children}
    </span>
  );
}

export default function Home() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <section className="w-full max-w-4xl">
        <div className="rounded-3xl bg-white/90 backdrop-blur border border-slate-200 shadow-md p-12">
          <h1 className="text-center text-4xl md:text-5xl font-extrabold tracking-tight">
            <span className="bg-gradient-to-r from-indigo-700 via-violet-700 to-fuchsia-700 bg-clip-text text-transparent">
              Welcome to YOUR Content Hub!
            </span>
          </h1>

          <p className="mt-8 text-center text-slate-600 text-lg md:text-xl leading-8">
            Your one-stop destination to{" "}
            <Emphasis>create</Emphasis>,{" "}
            <Emphasis>optimise</Emphasis>, and{" "}
            <Emphasis>brainstorm</Emphasis>{" "}
            all things content. Explore the options on the left to supercharge your content strategy.
          </p>
        </div>
      </section>
    </div>
  );
}