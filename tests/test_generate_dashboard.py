from pathlib import Path

from src.generate_dashboard import generate_dashboard

ROOT = Path(__file__).resolve().parents[1]


def test_generate_dashboard(tmp_path):
    output = tmp_path / "tablero_ahorros.html"
    path = generate_dashboard(ROOT / "data" / "propuestas_ahorro.csv", output)
    assert path.exists()
    html = path.read_text(encoding="utf-8")
    assert "Tablero único de propuestas de ahorro" in html
    assert "La Carolina" in html
    assert "Transporte con Corazón" in html
    assert "Logo La Carolina" in html
    assert "Búsqueda rápida" in html
    assert "Ahorro estimado total" in html
    assert "Resumen por departamento" in html
    assert "Optimizar rutas de despacho" in html
