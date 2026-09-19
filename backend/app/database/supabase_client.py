import os
from pathlib import Path
from supabase import create_client, Client
from dotenv import load_dotenv

# Search for .env in current dir, backend folder, or project root
current_dir = Path(__file__).resolve().parent
backend_env = current_dir.parent.parent / ".env"
root_env = current_dir.parent.parent.parent / ".env"

if backend_env.exists():
    load_dotenv(backend_env)
if root_env.exists():
    load_dotenv(root_env)
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Supabase environment variables (SUPABASE_URL, SUPABASE_KEY) are missing.")

supabase: Client = create_client(
    SUPABASE_URL,
    SUPABASE_KEY
)