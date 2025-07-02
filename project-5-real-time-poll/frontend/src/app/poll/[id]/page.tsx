"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type Option = { id: number; text: string; votes: number };
type Poll   = { id: number; question: string; options: Option[] };

export default function PollPage() {
  const { id } = useParams<{ id: string }>();
  const pollId = Number(id);

  const [poll, setPoll] = useState<Poll | null>(null);
  const [voted, setVoted] = useState<string | null>(null);

  // берем из localStorage, когда компонент уже на клиенте
  useEffect(() => {
    setVoted(localStorage.getItem(`poll-${pollId}`));
  }, [pollId]);

  const fetchData = async () => {
    const { data } = await api.get<Poll>(`/poll/${pollId}`);
    setPoll(data);
  };

  useEffect(() => {
    fetchData();
    const t = setInterval(fetchData, 3000);
    return () => clearInterval(t);
  }, [pollId]);

  const vote = async (optionId: number) => {
    if (voted) return;
    await api.post(`/poll/${pollId}/vote`, { option_id: optionId });
    localStorage.setItem(`poll-${pollId}`, String(optionId));
    setVoted(String(optionId));
    fetchData();
  };

  if (!poll) return <p className="p-6">Загрузка…</p>;

  const total = poll.options.reduce((s, o) => s + o.votes, 0);

  return (
    <div className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">{poll.question}</h1>

      {!voted ? (
        poll.options.map(o => (
          <button
            key={o.id}
            onClick={() => vote(o.id)}
            className="block w-full border p-2 my-1 rounded hover:bg-gray-100"
          >
            {o.text}
          </button>
        ))
      ) : (
        <p className="italic">Вы уже проголосовали.</p>
      )}

      <h2 className="font-semibold mt-6">Результаты</h2>
      {poll.options.map(o => {
        const pct = total ? (o.votes / total) * 100 : 0;
        return (
          <div key={o.id} className="mb-2">
            <div className="flex justify-between">
              <span>{o.text}</span>
              <span>{o.votes}</span>
            </div>
            <div className="w-full bg-gray-200 h-3 rounded">
              <div
                className="bg-blue-600 h-3 rounded"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}

      <p className="text-center text-gray-600 font-bold">
        Всего голосов: {total}
      </p>
    </div>
  );
}
