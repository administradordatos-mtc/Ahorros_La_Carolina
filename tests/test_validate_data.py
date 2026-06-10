from pathlib import Path

import pandas as pd
import pytest

from src.validate_data import DataValidationError, load_proposals, normalize_money


ROOT = Path(__file__).resolve().parents[1]


def test_load_sample_csv():
    df = load_proposals(ROOT / "data" / "propuestas_ahorro.csv")
    assert len(df) == 8
    assert "pendiente_evidencia" in df.columns
    assert "esta_bloqueada" in df.columns


def test_missing_column_raises(tmp_path):
    csv_path = tmp_path / "bad.csv"
    pd.DataFrame({"departamento": ["Operaciones"]}).to_csv(csv_path, index=False)
    with pytest.raises(DataValidationError, match="Faltan columnas"):
        load_proposals(csv_path)


def test_invalid_state_raises(tmp_path):
    csv_path = tmp_path / "bad_state.csv"
    data = {
        "departamento": ["Operaciones"],
        "propuesta": ["Prueba"],
        "responsable": ["Nestor"],
        "cifra_estimada": [1000],
        "calculo": ["x"],
        "evidencia": ["y"],
        "fecha_implementacion": ["2026-01-01"],
        "estado": ["Estado inventado"],
        "ahorro_real": [0],
        "bloqueo": [""],
    }
    pd.DataFrame(data).to_csv(csv_path, index=False)
    with pytest.raises(DataValidationError, match="estado inválido"):
        load_proposals(csv_path)


def test_normalize_money_formats():
    assert normalize_money("$ 1.200.000") == 1200000
    assert normalize_money("1,200,000") == 1200000
    assert normalize_money(2500) == 2500
    assert normalize_money("") == 0
