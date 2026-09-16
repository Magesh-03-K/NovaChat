"""Shared rate-limiter instance (slowapi, in-memory, free) so both
main.py and individual routers can reference the same limiter without
a circular import."""
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
