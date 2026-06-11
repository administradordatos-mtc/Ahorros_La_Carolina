from __future__ import annotations

import base64
from datetime import datetime
from pathlib import Path
import shutil
import sys

from jinja2 import Environment, FileSystemLoader, select_autoescape

if __package__ is None or __package__ == "":
    sys.path.append(str(Path(__file__).resolve().parents[1]))

from src.metrics import calculate_kpis, format_cop, summarize_by_department
from src.validate_data import load_proposals

ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "data" / "propuestas_ahorro.csv"
TEMPLATE_DIR = ROOT / "templates"
OUTPUT_PATH = ROOT / "output" / "tablero_ahorros.html"
INDEX_PATH = ROOT / "index.html"
LOGO_PATH = ROOT / "assets" / "logo-carolina.jpg"


def logo_data_uri(logo_path: Path = LOGO_PATH) -> str:
    if not logo_path.exists():
        return ""
    encoded = base64.b64encode(logo_path.read_bytes()).decode("ascii")
    return f"data:image/jpeg;base64,{encoded}"


def add_department_participation(department_summary: list[dict], total_estimated: float) -> list[dict]:
    enriched = []
    for item in department_summary:
        copy = dict(item)
        copy["participacion"] = 0 if total_estimated == 0 else round((copy["ahorro_estimado"] / total_estimated) * 100, 1)
        enriched.append(copy)
    return enriched


def generate_dashboard(data_path: Path = DATA_PATH, output_path: Path = OUTPUT_PATH) -> Path:
    df = load_proposals(data_path)
    kpis = calculate_kpis(df)
    department_summary = add_department_participation(
        summarize_by_department(df),
        kpis["ahorro_estimado_total"],
    )

    env = Environment(
        loader=FileSystemLoader(TEMPLATE_DIR),
        autoescape=select_autoescape(["html", "xml", "j2"]),
    )
    template = env.get_template("tablero_ahorros.html.j2")

    html = template.render(
        proposals=df.to_dict(orient="records"),
        kpis=kpis,
        department_summary=department_summary,
        departamentos=sorted(df["departamento"].unique()),
        responsables=sorted(df["responsable"].unique()),
        estados=sorted(df["estado"].unique()),
        generated_at=datetime.now().strftime("%Y-%m-%d %H:%M"),
        logo_src=logo_data_uri(),
        fmt=format_cop,
    )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(html, encoding="utf-8")

    # Vercel/static hosting entrypoint: serve the same dashboard from repository root.
    if output_path.resolve() != INDEX_PATH.resolve():
        shutil.copyfile(output_path, INDEX_PATH)

    return output_path


if __name__ == "__main__":
    path = generate_dashboard()
    print(f"Tablero generado correctamente: {path}")
    print(f"Entrypoint estático actualizado: {INDEX_PATH}")
