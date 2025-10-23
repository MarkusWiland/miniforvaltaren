import { inngest } from "@/app/inngest/client";


export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },
  async ({ event, step }) => {
    await step.sleep("wait-a-moment", "1d");
    return { message: `Hello ${event.data.email}!` };
  },
);