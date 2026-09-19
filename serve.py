"""Local preview that serves 404.html for missing paths, like GitHub Pages does.
Run:  python serve.py   then open http://127.0.0.1:8765/"""
import http.server, os, socketserver
ROOT = os.path.dirname(os.path.abspath(__file__))
class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=ROOT, **k)
    def send_error(self, code, message=None, explain=None):
        if code == 404 and os.path.exists(os.path.join(ROOT, '404.html')):
            body = open(os.path.join(ROOT, '404.html'), 'rb').read()
            self.send_response(404); self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Content-Length', str(len(body))); self.end_headers(); self.wfile.write(body); return
        super().send_error(code, message, explain)
    def log_message(self, *a): pass
socketserver.TCPServer.allow_reuse_address = True
with socketserver.ThreadingTCPServer(('127.0.0.1', 8765), Handler) as s:
    print('serving on http://127.0.0.1:8765/'); s.serve_forever()
