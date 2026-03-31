type PageHeroProps = {
  title: string;
};

export function PageHero({ title }: PageHeroProps) {
  return (
    <header className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2">
      <div className="bg-slate-700">
        <div className="mx-auto w-full max-w-xl px-4 py-4 sm:px-5 sm:py-5">
          <h1 className="text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl">
            {title}
          </h1>
        </div>
      </div>
    </header>
  );
}
