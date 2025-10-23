import { polarClient } from "@polar-sh/better-auth";

import { nextCookies } from "better-auth/next-js";
import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { auth } from "./auth";

export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>(), polarClient(), nextCookies()],
});
