
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { listSources } from "@/lib/queries";
import { INFO_SLUGS, PAGES } from "@/lib/pages";

export const dynamicParams = false;
export const revalidate = 3600;

type P = { params: Promise<{ page: string }> };

export function generateStaticParams() {
  return INFO_SLUGS.map((page) => ({ page }));
}

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const slug = (await params).page;

  return {
    title: slug === "sources" ? "Sources" : PAGES[slug]?.title,
  };
}

function PageEyebrow() {
  return (
    <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
      SALFRA <span className="px-1.5 text-gray-300">/</span> Information
    </p>
  );
}

function PageHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <header className="border-b border-gray-200 px-5 py-5 sm:px-6">
      <PageEyebrow />

      <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-gray-950 sm:text-3xl">
        {title}
      </h1>

      {description && (
        <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-600 sm:text-base">
          {description}
        </p>
      )}
    </header>
  );
}

export default async function Info({ params }: P) {
  const slug = (await params).page;

  if (slug === "sources") {
    const sources = await listSources();

    return (
      <div className="mx-auto w-full max-w-4xl">
        <PageHeader
          title="Our sources"
          description="Reliable news starts with knowing where it comes from. SALFRA curates AI and technology news from approved sources and collects material only through feeds or APIs they permit. Being listed here does not imply that a publisher endorses SALFRA."
        />

        <section
          aria-label="Approved news sources"
          className="px-5 py-5 sm:px-6"
        >
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-gray-950">
                Source directory
              </h2>
              <p className="mt-1 text-sm leading-6 text-gray-500">
                Publishers included in our news curation process.
              </p>
            </div>

            <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600">
              {sources.length}{" "}
              {sources.length === 1 ? "source" : "sources"}
            </span>
          </div>

          {sources.length === 0 ? (
            <div
              role="status"
              className="rounded-xl border border-dashed border-gray-300 px-5 py-12 text-center"
            >
              <h2 className="text-base font-bold text-gray-950">
                No sources available yet
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
                Our approved source directory will appear here when sources
                are available for publication.
              </p>
            </div>
          ) : (
            <ul className="list-none divide-y divide-gray-200 overflow-hidden rounded-xl border border-gray-200 p-0">
              {sources.map((source, index) => (
                <li
                  key={source.domain}
                  className="list-none px-4 py-4 transition-colors hover:bg-gray-50 sm:px-5"
                >
                  <div className="flex items-start gap-3">
                    <span
                      aria-hidden="true"
                      className="mt-0.5 w-6 shrink-0 font-mono text-xs text-gray-400"
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="break-words text-sm font-bold text-gray-950">
                          {source.name}
                        </h3>

                        {source.is_primary && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700">
                            <span
                              aria-hidden="true"
                              className="h-1.5 w-1.5 rounded-full bg-blue-600"
                            />
                            Official source
                          </span>
                        )}
                      </div>

                      <p className="mt-1 break-all text-sm leading-6 text-gray-500">
                        {source.domain}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="mx-5 mb-6 rounded-xl bg-gray-50 p-4 sm:mx-6 sm:p-5">
          <h2 className="text-sm font-bold text-gray-950">
            Our sourcing policy
          </h2>

          <p className="mt-2 text-sm leading-6 text-gray-600">
            Inclusion in this directory is not an endorsement of every
            statement a publisher makes. We aim to make our sourcing
            transparent and link readers to original reporting wherever
            possible.
          </p>
        </aside>
      </div>
    );
  }

  const page = PAGES[slug];

  if (!page) notFound();

  return (
    <article className="mx-auto w-full max-w-4xl">
      <PageHeader title={page.title} />

      <div className="max-w-3xl px-5 py-6 sm:px-6 sm:py-8">
        <div className="space-y-5 text-sm leading-7 text-gray-700 sm:text-base sm:leading-8">
          {page.paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </div>
    </article>
  );
}
