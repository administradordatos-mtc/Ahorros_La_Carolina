from __future__ import annotations

from pathlib import Path
import re

import pandas as pd

REQUIRED_COLUMNS = [
    "departamento",
    "propuesta",
    "responsable",
    "cifra_estimada",
    "calculo",
    "evidencia",
    "fecha_implementacion",
    "estado",
    "ahorro_real",
    "bloqueo",
]

ALLOWED_STATES = {
    "Idea",
    "En análisis",
    "Aprobada",
    "En implementación",
    "Implementada",
    "Medida",
    "Bloqueada",
    "Descartada",
}

MANDATORY_FIELDS = ["departamento", "propuesta", "responsable", "cifra_estimada", "estado"]


class DataValidationError(ValueError):
    """Raised when the proposals CSV does not meet the required contract."""


def _is_blank(value) -> bool:
    return pd.isna(value) or str(value).strip() == ""


def normalize_money(value) -> float:
    """Normalize COP-like values to float.

    Accepts numbers or strings such as "$ 1.200.000", "1,200,000" or "1200000".
    Empty values are interpreted as zero.
    """
    if pd.isna(value) or str(value).strip() == "":
        return 0.0
    if isinstance(value, (int, float)):
        return float(value)

    raw = str(value).strip()
    raw = re.sub(r"(?i)cop|\$|\s", "", raw)

    if "," in raw and "." in raw:
        # Colombian format: 1.234.567,89
        raw = raw.replace(".", "").replace(",", ".")
    elif raw.count(".") > 1:
        raw = raw.replace(".", "")
    elif raw.count(",") > 1:
        raw = raw.replace(",", "")
    elif "," in raw and "." not in raw:
        parts = raw.split(",")
        if len(parts[-1]) == 3:
            raw = raw.replace(",", "")
        else:
            raw = raw.replace(",", ".")

    try:
        return float(raw)
    except ValueError as exc:
        raise DataValidationError(f"Valor monetario inválido: {value!r}") from exc


def load_proposals(csv_path: str | Path) -> pd.DataFrame:
    csv_path = Path(csv_path)
    if not csv_path.exists():
        raise DataValidationError(f"No existe el archivo CSV: {csv_path}")

    df = pd.read_csv(csv_path, keep_default_na=False)
    validate_columns(df)
    df = normalize_dataframe(df)
    validate_rows(df)
    return add_derived_columns(df)


def validate_columns(df: pd.DataFrame) -> None:
    missing = [col for col in REQUIRED_COLUMNS if col not in df.columns]
    if missing:
        raise DataValidationError(f"Faltan columnas obligatorias: {', '.join(missing)}")


def normalize_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    for col in REQUIRED_COLUMNS:
        if col not in ["cifra_estimada", "ahorro_real"]:
            df[col] = df[col].fillna("").astype(str).str.strip()

    df["cifra_estimada"] = df["cifra_estimada"].apply(normalize_money)
    df["ahorro_real"] = df["ahorro_real"].apply(normalize_money)
    return df


def validate_rows(df: pd.DataFrame) -> None:
    errors: list[str] = []

    for idx, row in df.iterrows():
        row_num = idx + 2  # CSV header is line 1
        for field in MANDATORY_FIELDS:
            if field in ["cifra_estimada"]:
                continue
            if _is_blank(row[field]):
                errors.append(f"Fila {row_num}: '{field}' es obligatorio")

        if row["cifra_estimada"] < 0:
            errors.append(f"Fila {row_num}: 'cifra_estimada' no puede ser negativa")
        if row["ahorro_real"] < 0:
            errors.append(f"Fila {row_num}: 'ahorro_real' no puede ser negativo")
        if row["estado"] not in ALLOWED_STATES:
            errors.append(
                f"Fila {row_num}: estado inválido '{row['estado']}'. Permitidos: {', '.join(sorted(ALLOWED_STATES))}"
            )
        if not _is_blank(row["fecha_implementacion"]):
            try:
                pd.to_datetime(row["fecha_implementacion"], format="%Y-%m-%d", errors="raise")
            except Exception:
                errors.append(f"Fila {row_num}: fecha_implementacion debe tener formato YYYY-MM-DD")

    if errors:
        raise DataValidationError("\n".join(errors))


def add_derived_columns(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["pendiente_evidencia"] = df["evidencia"].apply(_is_blank)
    df["pendiente_calculo"] = df["calculo"].apply(_is_blank)
    df["esta_bloqueada"] = (df["estado"] == "Bloqueada") | (~df["bloqueo"].apply(_is_blank))
    df["implementada_o_medida"] = df["estado"].isin(["Implementada", "Medida"])
    return df
