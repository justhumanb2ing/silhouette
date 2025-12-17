import { createClient } from "@supabase/supabase-js";
import { useSession } from "@clerk/react-router";

export function useSupabaseClient() {
  const { session } = useSession();
  const supabaseClient = createClient(
    import.meta.env.VITE_SUPABASE_URL!,
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      // Session accessed from Clerk SDK, either as Clerk.session (vanilla
      // JavaScript) or useSession (React)
      accessToken: async () => session?.getToken() ?? null,
    }
  );
  return supabaseClient;
}
