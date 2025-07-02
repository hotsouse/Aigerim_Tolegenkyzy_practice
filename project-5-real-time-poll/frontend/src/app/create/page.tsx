"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function CreatePage() {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const router = useRouter();

  const addOption = () => setOptions([...options, ""]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data } = await api.post("/poll/create", { question, options });
    router.push(`/poll/${data.id}`);
  };

  return (
    <form onSubmit={submit} className="max-w-xl mx-auto p-6 space-y-3">
      <h1 className="text-2xl font-bold mb-2">Новый опрос</h1>

      <input
        required
        value={question}
        onChange={e => setQuestion(e.target.value)}
        placeholder="Вопрос"
        className="w-full border p-2 rounded"
      />

      {options.map((opt, i) => (
        <input
          key={i}
          required
          value={opt}
          onChange={e => {
            const copy = [...options];
            copy[i] = e.target.value;
            setOptions(copy);
          }}
          placeholder={`Вариант ${i + 1}`}
          className="w-full border p-2 rounded mt-1"
        />
      ))}

      <button type="button" onClick={addOption} className="underline">
        + ещё вариант
      </button>

      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
        Создать
      </button>
    </form>
  );
}
