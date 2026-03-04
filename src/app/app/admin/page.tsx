import { requireAdmin } from "@/lib/admin";
import { AdminDashboard } from "./admin-dashboard";

export default async function AdminPage() {
  // Server-side admin check — redirects non-admins
  await requireAdmin();
  return <AdminDashboard />;
}
