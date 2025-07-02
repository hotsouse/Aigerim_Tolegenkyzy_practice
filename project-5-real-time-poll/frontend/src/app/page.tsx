import Link from "next/link";
import { api } from "@/lib/api";

type Poll = { id: number; question: string };

export default async function Home() {
  // Server Component — безопасно: никакого axios в браузере
  const polls: Poll[] = await api.get("/poll").then(r => r.data);

  return (
    <main className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Опросы</h1>

      <Link href="/create" className="text-blue-600 underline">
        + Создать опрос
      </Link>

      <ul className="list-disc pl-5 space-y-1">
        {polls.map((p) => (
          <li key={p.id}>
            <Link href={`/poll/${p.id}`} className="underline">
              {p.question}
            </Link>
          </li>
        ))}
        {polls.length === 0 && <li>Пока ничего нет.</li>}
      </ul>
    </main>
  );
}
