import { PageHeader } from "../../../components/page-header";
import { CreateGameForm } from "../../../components/create-game-form";
import { getScenarios } from "../../../lib/api";

export const dynamic = "force-dynamic";

export default async function NewGamePage() {
  const scenarios = await getScenarios();

  return (
    <main className="page">
      <div className="section-stack">
        <PageHeader
          eyebrow="New Game"
          title="Create a new crisis session"
          description="This screen creates a real in-memory game through the backend API and redirects straight into the created session."
        />
        <CreateGameForm scenarios={scenarios} />
      </div>
    </main>
  );
}
