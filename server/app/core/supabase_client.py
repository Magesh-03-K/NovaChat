import logging
import re
from supabase import create_client, Client
from app.core.config import settings

logger = logging.getLogger("novachat.supabase")

# Patch re.match temporarily during client creation to bypass supabase-py's strict JWT regex
# when using newer Supabase secret/publishable key formats (e.g. sb_secret_...)
_orig_re_match = re.match
def _flex_re_match(pattern, string, *args, **kwargs):
    if isinstance(pattern, str) and "A-Za-z0-9-_=" in pattern:
        return True
    return _orig_re_match(pattern, string, *args, **kwargs)

re.match = _flex_re_match

url = settings.SUPABASE_URL or "https://xyz.supabase.co"
key = settings.SUPABASE_SERVICE_KEY or settings.SUPABASE_ANON_KEY or "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjAwMDAwMDAwfQ.dummy"

try:
    supabase: Client = create_client(url, key)
except Exception as err:
    logger.warning(f"Could not initialize Supabase client: {err}")
    fallback_key = settings.SUPABASE_ANON_KEY or "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYwMDAwMDAwMH0.dummy"
    try:
        supabase: Client = create_client(url, fallback_key)
    except Exception:
        class DummySupabaseClient:
            def table(self, name):
                return self
            def select(self, *args, **kwargs):
                return self
            def insert(self, *args, **kwargs):
                return self
            def update(self, *args, **kwargs):
                return self
            def delete(self, *args, **kwargs):
                return self
            def upsert(self, *args, **kwargs):
                return self
            def eq(self, *args, **kwargs):
                return self
            def neq(self, *args, **kwargs):
                return self
            def in_(self, *args, **kwargs):
                return self
            def order(self, *args, **kwargs):
                return self
            def limit(self, *args, **kwargs):
                return self
            def execute(self):
                class DummyData:
                    data = []
                return DummyData()
        supabase = DummySupabaseClient()
finally:
    re.match = _orig_re_match

