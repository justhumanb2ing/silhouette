import { createClient } from "@supabase/supabase-js";
import type { Route } from "../../+types/root";
import { getAuth } from "@clerk/react-router/server";

export async function useSupabaseServer(
  args: Route.LoaderArgs | Route.ActionArgs
) {
  const { getToken } = await getAuth(args);

  return createClient(
    import.meta.env.VITE_SUPABASE_URL!,
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      async accessToken() {
        return getToken();
      },
    }
  );
}
