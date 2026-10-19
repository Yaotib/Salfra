// web/src/app/page.tsx
import Link from "next/link";
import { StoryCard } from "@/components/StoryCard";
import { featuredStories, listStories, updatedStories } from "@/lib/queries";

export const revalidate = 300;

export default async function Home() {
  const [featured, latest, updated] = await Promise.all([featuredStories(3), listStories({}), updatedStories(4)]);
  return (
    <>
      <h1>AI and technology news, summarised</h1>
      <p className="meta">Automated curation with links to the original reporting. Summaries are AI-generated.</p>
      {featured.length > 0 && (<section aria-labelledby="featured"><h2 id="featured">Featured</h2>{featured.map((s) => <StoryCard key={s.id} s={s} />)}</section>)}
      <section aria-labelledby="latest">
        <h2 id="latest">Latest stories</h2>
        {latest.stories.length === 0 && <p role="status">No stories published yet. Check back soon.</p>}
        {latest.stories.slice(0, 12).map((s) => <StoryCard key={s.id} s={s} />)}
        <p><Link href="/stories">All stories →</Link></p>
      </section>
      {updated.length > 0 && (<section aria-labelledby="updated"><h2 id="updated">Recently updated</h2>{updated.map((s) => <StoryCard key={s.id} s={s} />)}</section>)}
    </>
  );
}