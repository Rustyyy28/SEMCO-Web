"""Serve the frontend and educational evaluation API using Python's stdlib."""

import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
from urllib.parse import urlsplit

from engine import evaluate


DIST = Path(__file__).resolve().parent / "dist"
MAX_BODY_BYTES = 65536


class PortalHandler(SimpleHTTPRequestHandler):
    def _json(self, status, payload):
        body = json.dumps(payload, allow_nan=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        path = urlsplit(self.path).path
        if path == "/api/health":
            self._json(200, {"status": "ok", "service": "SEMCO prototype", "engine": "simple-scea-brb"})
        elif path.startswith("/api/"):
            self._json(404, {"error": "API route not found."})
        else:
            super().do_GET()

    def do_POST(self):
        if urlsplit(self.path).path != "/api/evaluate":
            self._json(404, {"error": "API route not found."})
            return
        content_type = self.headers.get("Content-Type", "").split(";", 1)[0].strip().lower()
        if content_type != "application/json":
            self._json(415, {"error": "Send the request as application/json."})
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            self._json(400, {"error": "Invalid Content-Length."})
            return
        if length <= 0:
            self._json(400, {"error": "A JSON request body is required."})
            return
        if length > MAX_BODY_BYTES:
            self._json(413, {"error": "The request body is too large."})
            return
        try:
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
            if not isinstance(payload, dict):
                raise ValueError("The request must be a JSON object.")
            result = evaluate(payload)
        except (UnicodeDecodeError, json.JSONDecodeError):
            self._json(400, {"error": "The request body must contain valid JSON."})
            return
        except ValueError as error:
            self._json(400, {"error": str(error)})
            return
        self._json(200, result)

    def do_PUT(self):
        self._json(405, {"error": "This prototype accepts GET and POST requests only."})

    do_DELETE = do_PUT
    do_PATCH = do_PUT


def main():
    parser = argparse.ArgumentParser(description="Run the SEMCO loan portal prototype locally.")
    parser.add_argument("--port", type=int, default=8000, help="Local port (default: 8000)")
    args = parser.parse_args()
    if not 1 <= args.port <= 65535:
        parser.error("--port must be between 1 and 65535")
    handler = partial(PortalHandler, directory=str(DIST))
    server = ThreadingHTTPServer(("127.0.0.1", args.port), handler)
    print(f"SEMCO prototype: http://127.0.0.1:{args.port}", flush=True)
    print("Press Ctrl+C to stop.", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
