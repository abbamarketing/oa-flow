import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  buildMetrics,
  listAllUsers,
  makeAdminClient,
  requireAdmin,
  setRole,
  type AdminMetrics,
  type AdminUser,
} from "@/lib/admin.server";

export type { AdminUser, AdminMetrics };

export const getAdminDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context.userId);
    const client = makeAdminClient();
    const users = await listAllUsers(client);
    const metrics = await buildMetrics(client, users);
    return { users, metrics };
  });

const roleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["admin", "user"]),
});

export const updateUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => roleSchema.parse(data))
  .handler(async ({ data, context }) => {
    await requireAdmin(context.userId);
    const client = makeAdminClient();
    await setRole(client, data.userId, data.role);
    const users = await listAllUsers(client);
    const metrics = await buildMetrics(client, users);
    return { users, metrics };
  });
