import { requireMe } from "@/lib/me";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  const me = await requireMe();
  return <SettingsClient me={me} />;
}
