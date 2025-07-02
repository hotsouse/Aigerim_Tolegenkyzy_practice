import json, os, aiofiles
from typing import List, Dict, Any

FILE = "polls.json"

async def load_polls() -> List[Dict[str, Any]]:
    if not os.path.exists(FILE):
        return []
    async with aiofiles.open(FILE, "r") as f:
        return json.loads(await f.read())

async def save_polls(polls: List[Dict[str, Any]]) -> None:
    async with aiofiles.open(FILE, "w") as f:
        await f.write(json.dumps(polls, ensure_ascii=False, indent=2))
