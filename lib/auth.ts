import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { polar, checkout, portal } from "@polar-sh/better-auth";
import { organization } from "better-auth/plugins";
import { polarClient } from "./polar";
import prisma from "./prisma";

export const auth = betterAuth({
  plugins: [
    organization(),
    polar({
      client: polarClient,
      createCustomerOnSignUp: true,

      use: [
        checkout({
          products: [
            {
              productId: "d3e3ee15-3d02-418b-9310-1777bf2b413f",
              slug: "basic",
            },
            {
              productId: "e2f22c40-7f61-4a29-b0ea-94de398cf2fa",
              slug: "pro",
            },
          ],
          successUrl: process.env.POLAR_SUCCESS_URL,
          authenticatedUsersOnly: true,
        }),
        portal(),
      ],
    }),
  ],
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  user: {
    additionalFields: {
      plan: {
        type: "string",
        default: "FREE",
        input: false,
      },
  
    },
  },

  emailAndPassword: {
    enabled: true,
  },
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
