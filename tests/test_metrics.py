from pathlib import Path

from src.metrics import calculate_kpis, format_cop, summarize_by_department
from src.validate_data import load_proposals

ROOT = Path(__file__).resolve().parents[1]


def test_calculate_kpis():
    df = load_proposals(ROOT / "data" / "propuestas_ahorro.csv")
    kpis = calculate_kpis(df)
    assert kpis["total_propuestas"] == 8
    assert kpis["ahorro_estimado_total"] == 59500000
    assert kpis["ahorro_real_total"] == 12500000
    assert kpis["diferencia_ahorro"] == 47000000
    assert kpis["propuestas_bloqueadas"] == 2
    assert kpis["propuestas_implementadas"] == 2
    assert kpis["propuestas_pendientes_evidencia"] == 1


def test_summarize_by_department():
    df = load_proposals(ROOT / "data" / "propuestas_ahorro.csv")
    summary = summarize_by_department(df)
    operaciones = next(item for item in summary if item["departamento"] == "Operaciones")
    assert operaciones["propuestas"] == 2
    assert operaciones["ahorro_estimado"] == 23500000
    assert operaciones["bloqueos"] == 1


def test_format_cop():
    assert format_cop(1234567) == "$1.234.567"
