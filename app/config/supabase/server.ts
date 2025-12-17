// import {
//   createServerClient,
//   parseCookieHeader,
//   serializeCookieHeader,
// } from "@supabase/ssr";

// export function createClient(request: Request) {
//   const headers = new Headers();

//   const supabase = createServerClient(
//     process.env.VITE_SUPABASE_URL!,
//     process.env.VITE_SUPABASE_PUBLISHABLE_OR_ANON_KEY!,
//     {
//       cookies: {
//         getAll() {
//           return parseCookieHeader(request.headers.get("Cookie") ?? "") as {
//             name: string;
//             value: string;
//           }[];
//         },
//         setAll(cookiesToSet) {
//           cookiesToSet.forEach(({ name, value, options }) =>
//             headers.append(
//               "Set-Cookie",
//               serializeCookieHeader(name, value, options)
//             )
//           );
//         },
//       },
//     }
//   );

//   return { supabase, headers };
// }

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
