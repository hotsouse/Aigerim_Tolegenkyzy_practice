'use client';

import axios from 'axios';
const API = 'http://127.0.0.1:8000/api/todos';

export default function ClearCompletedButton({ onClear }: { onClear: () => Promise<void> }) {
  const handleClick = async () => {
    await axios.delete(`${API}/completed`);
    await onClear();
  };

  return (
    <button
      onClick={handleClick}
      className="mt-6 w-full bg-red-500 hover:bg-red-600 py-2 rounded text-white"
    >
      Очистить выполненные
    </button>
  );
}
