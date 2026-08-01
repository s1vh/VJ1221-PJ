from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import os
import webbrowser


HOST = "localhost"
PORT = 8000
ENTRY_POINT = "astrolabio.html"


class Handler(SimpleHTTPRequestHandler):
    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        ".js": "text/javascript; charset=utf-8",
        ".mjs": "text/javascript; charset=utf-8",
    }


def main():
    # localServer.py está en ./scripts; la raíz del proyecto es su carpeta padre.
    project_root = Path(__file__).resolve().parent.parent
    os.chdir(project_root)

    url = f"http://{HOST}:{PORT}/{ENTRY_POINT}"

    server = ThreadingHTTPServer((HOST, PORT), Handler)

    print()
    print("=" * 62)
    print("Servidor local del Astrolabio iniciado")
    print(f"Directorio servido: {project_root}")
    print()
    print("Abre la demo en:")
    print(f"  {url}")
    print()
    print("Pulsa Ctrl+C para detener el servidor.")
    print("=" * 62)
    print()

    # Abre directamente la página correcta en el navegador predeterminado.
    webbrowser.open(url)

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor detenido.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()