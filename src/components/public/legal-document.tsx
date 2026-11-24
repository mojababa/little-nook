type LegalDocumentProps = {
  title: string;
  lastUpdated: string;
  intro: string;
  sections: { id: string; title: string; body: string }[];
};

export function LegalDocument({
  title,
  lastUpdated,
  intro,
  sections,
}: LegalDocumentProps) {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <article className="flex flex-col gap-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">{lastUpdated}</p>
          <p className="text-muted-foreground">{intro}</p>
        </header>
        {sections.map((section) => (
          <section key={section.id} className="flex flex-col gap-2">
            <h2 className="text-xl font-semibold tracking-tight">
              {section.title}
            </h2>
            <p className="leading-relaxed">{section.body}</p>
          </section>
        ))}
      </article>
    </main>
  );
}
