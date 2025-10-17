import { getServerSession } from "@/lib/get-session";
import Unauthorized from "./unauthorized";

export default async function Home() {
  const session = await getServerSession();
  const user = session?.user;
  if (!user) Unauthorized();

  return (
    <main>
      <h1>Home</h1>
      <p>{session?.user?.email}</p>
      <p>{session?.user?.name}</p>
    </main>
  );
}
