from argparse import ArgumentParser, RawTextHelpFormatter
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import os
import webbrowser
import sys


HOST = "localhost"
PORT = 8000

CURRENT_ENTRY_POINT = ""
LEGACY_ENTRY_POINT = "astrolabio.html"


class Handler(SimpleHTTPRequestHandler):
    verbose = False

    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        ".js": "text/javascript; charset=utf-8",
        ".mjs": "text/javascript; charset=utf-8",
    }

    # SimpleHTTPRequestHandler sends request/access logs through log_message().
    # Keeping this disabled by default leaves the terminal clean unless /verbose is used.
    def log_message(self, format, *args):
        if self.verbose:
            super().log_message(format, *args)

class HelpArgumentParser(ArgumentParser):

    def error(self, message):
        self.print_usage(sys.stderr)
        self.exit(
            2,
            f"{self.prog}: error: {message}\n"
            "Use /? for help.\n"
        )

def parse_arguments():
    parser = HelpArgumentParser(
        prog="localServer.py",
        add_help=False,
        prefix_chars="/",
        formatter_class=RawTextHelpFormatter,
        description=(
            "Servidor local para VJ1221-PJ / Esfera Armillar.\n\n"
            "Sin parámetros abre la versión actual en el navegador y mantiene\n"
            "silenciados los eventos HTTP."
        ),
    )

    launch_mode = parser.add_mutually_exclusive_group()

    launch_mode.add_argument(
        "/current",
        "/c",
        dest="launch_mode",
        action="store_const",
        const="current",
        help=(
            "Abre la versión actual en http://localhost:8000/.\n"
            "Es el comportamiento predeterminado."
        ),
    )

    launch_mode.add_argument(
        "/legacy",
        "/l",
        dest="launch_mode",
        action="store_const",
        const="legacy",
        help="Abre astrolabio.html directamente.",
    )

    launch_mode.add_argument(
        "/none",
        "/n",
        dest="launch_mode",
        action="store_const",
        const="none",
        help="No abre ningún navegador; solo levanta el servidor.",
    )

    parser.add_argument(
        "/verbose",
        "/v",
        action="store_true",
        help="Muestra en la terminal las peticiones y eventos HTTP.",
    )

    parser.add_argument(
        "/help",
        "/h",
        "/?",
        action="help",
        help="Muestra esta ayuda y termina.",
    )

    parser.set_defaults(
        launch_mode="current",
        verbose=False,
    )

    return parser.parse_args()


def get_url(launch_mode):
    root_url = f"http://{HOST}:{PORT}/"

    if launch_mode == "legacy":
        return f"{root_url}{LEGACY_ENTRY_POINT}"

    # /current and /none both use the project root.
    # SimpleHTTPRequestHandler serves index.html implicitly from "/".
    return root_url


def print_server_info(project_root, url, launch_mode, verbose):
    print()
    print("=" * 62)
    print("Servidor local de Esfera Armillar iniciado")
    print(f"Directorio servido: {project_root}")
    print()

    if launch_mode == "legacy":
        print("Demo legacy:")
    elif launch_mode == "none":
        print("Servidor disponible en:")
    else:
        print("Demo actual:")

    print(f"  {url}")
    print()
    print(f"Eventos HTTP: {'visibles' if verbose else 'silenciados'}")

    if launch_mode == "none":
        print("Navegador: no se abrirá automáticamente")

    print()
    print("Pulsa Ctrl+C para detener el servidor.")
    print("=" * 62)
    print()


def main():
    args = parse_arguments()

    # localServer.py está en ./scripts; la raíz del proyecto es su carpeta padre.
    project_root = Path(__file__).resolve().parent.parent
    os.chdir(project_root)

    url = get_url(args.launch_mode)

    # Handler.verbose is shared by every request handler created by this server.
    Handler.verbose = args.verbose

    server = ThreadingHTTPServer((HOST, PORT), Handler)

    print_server_info(
        project_root,
        url,
        args.launch_mode,
        args.verbose,
    )

    if args.launch_mode != "none":
        webbrowser.open(url)

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor detenido.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
