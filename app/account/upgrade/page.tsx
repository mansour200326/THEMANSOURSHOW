import { auth } from "@/auth";
import { UpgradeScreen } from "@/components/account/UpgradeScreen";
import type { Gate } from "@/lib/plan/limits";

export const dynamic = "force-dynamic";

const GATES = ["game", "ai", "players", "themes"];

export default async function UpgradePage({
  searchParams,
}: {
  searchParams: Promise<{ gate?: string }>;
}) {
  const { gate } = await searchParams;
  const session = await auth();
  return (
    <UpgradeScreen
      gate={(GATES.includes(gate ?? "") ? gate : "game") as Gate}
      signedIn={Boolean(session?.user)}
    />
  );
}
