from __future__ import annotations

from pathlib import Path
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


def generate_dashboard(data_path: Path = DATA_PATH, output_path: Path = OUTPUT_PATH) -> Path:
    df = load_proposals(data_path)
    kpis = calculate_kpis(df)
    department_summary = summarize_by_department(df)

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
        fmt=format_cop,
    )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(html, encoding="utf-8")
    return output_path


if __name__ == "__main__":
    path = generate_dashboard()
    print(f"Tablero generado correctamente: {path}")
