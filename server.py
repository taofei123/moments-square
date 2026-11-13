#!/usr/bin/env python3
# -*- coding: utf-8 -*-
r"""
动态广场 · 极简本地后端（零依赖，仅用 Python 标准库）

职责：
  - GET  /              提供 index.html 页面
  - GET  /api/posts     读取动态列表
  - POST /api/posts     新增一条动态（请求体 {"text": "..."}）
  - DELETE /api/posts/<id>  删除指定动态

数据持久化到 D:\Codebuddy\posts.json，每次变更采用"临时文件 + os.replace"原子写，
避免写入中途进程中断导致文件半写损坏。
"""

import json
import os
import re
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(BASE_DIR, "posts.json")
INDEX_FILE = os.path.join(BASE_DIR, "index.html")
HOST = "127.0.0.1"
PORT = 8000
MAX_LEN = 500

# 合法的 id 字符（防止路径注入）
_ID_RE = re.compile(r"^[A-Za-z0-9_\-]+$")


def load_posts():
    """从磁盘读取动态列表；文件缺失/损坏时回退为空列表。"""
    if not os.path.exists(DATA_FILE):
        return []
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data if isinstance(data, list) else []
    except (json.JSONDecodeError, OSError):
        return []


def save_posts(posts):
    """原子写盘：先写临时文件，再 os.replace 重命名覆盖，保证完整性。"""
    tmp = DATA_FILE + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(posts, f, ensure_ascii=False, indent=2)
        f.flush()
        os.fsync(f.fileno())
    os.replace(tmp, DATA_FILE)


def new_post(text):
    import time
    ts = int(time.time() * 1000)
    return {
        "id": "%d%s" % (ts, os.urandom(2).hex()),
        "text": text,
        "time": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()),
        "ts": ts,
    }


class Handler(BaseHTTPRequestHandler):
    # 抑制默认请求日志，保持终端干净
    def log_message(self, fmt, *args):
        pass

    def _send_json(self, obj, status=200):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _send_file(self, path, content_type):
        try:
            with open(path, "rb") as f:
                body = f.read()
        except OSError:
            self.send_error(404, "Not Found")
            return
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _read_body(self):
        length = int(self.headers.get("Content-Length", 0) or 0)
        if length <= 0:
            return b""
        return self.rfile.read(length)

    def do_GET(self):
        route = urlparse(self.path).path
        if route in ("/", "/index.html"):
            self._send_file(INDEX_FILE, "text/html; charset=utf-8")
        elif route == "/api/posts":
            self._send_json(load_posts())
        else:
            self.send_error(404, "Not Found")

    def do_POST(self):
        route = urlparse(self.path).path
        if route != "/api/posts":
            self.send_error(404, "Not Found")
            return
        raw = self._read_body()
        try:
            payload = json.loads(raw.decode("utf-8")) if raw else {}
        except json.JSONDecodeError:
            self._send_json({"error": "请求体不是合法 JSON"}, status=400)
            return
        text = (payload.get("text") or "").strip() if isinstance(payload, dict) else ""
        if not text:
            self._send_json({"error": "内容不能为空"}, status=400)
            return
        if len(text) > MAX_LEN:
            self._send_json({"error": "内容不能超过 %d 字" % MAX_LEN}, status=400)
            return
        posts = load_posts()
        post = new_post(text)
        posts.insert(0, post)
        save_posts(posts)
        self._send_json(post, status=201)

    def do_DELETE(self):
        route = urlparse(self.path).path
        m = re.match(r"^/api/posts/(.+)$", route)
        if not m:
            self.send_error(404, "Not Found")
            return
        pid = m.group(1)
        if not _ID_RE.match(pid):
            self._send_json({"error": "非法 id"}, status=400)
            return
        posts = load_posts()
        filtered = [p for p in posts if p.get("id") != pid]
        if len(filtered) == len(posts):
            self._send_json({"ok": False, "error": "未找到该动态"}, status=404)
            return
        save_posts(filtered)
        self._send_json({"ok": True})


def main():
    # 确保数据文件存在（首次运行创建空数组）
    if not os.path.exists(DATA_FILE):
        save_posts([])
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print("动态广场已启动 → http://localhost:%d" % PORT)
    print("数据存储于：%s" % DATA_FILE)
    print("按 Ctrl+C 停止服务")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n服务已停止")
        server.shutdown()


if __name__ == "__main__":
    main()
