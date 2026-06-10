from __future__ import annotations

import pandas as pd


def calculate_kpis(df: pd.DataFrame) -> dict:
    ahorro_estimado_total = float(df["cifra_estimada"].sum())
    ahorro_real_total = float(df["ahorro_real"].sum())
    return {
        "total_propuestas": int(len(df)),
        "ahorro_estimado_total": ahorro_estimado_total,
        "ahorro_real_total": ahorro_real_total,
        "diferencia_ahorro": ahorro_estimado_total - ahorro_real_total,
        "propuestas_bloqueadas": int(df["esta_bloqueada"].sum()),
        "propuestas_implementadas": int(df["implementada_o_medida"].sum()),
        "propuestas_pendientes_evidencia": int(df["pendiente_evidencia"].sum()),
        "propuestas_pendientes_calculo": int(df["pendiente_calculo"].sum()),
    }


def summarize_by_department(df: pd.DataFrame) -> list[dict]:
    summary = (
        df.groupby("departamento", dropna=False)
        .agg(
            propuestas=("propuesta", "count"),
            ahorro_estimado=("cifra_estimada", "sum"),
            ahorro_real=("ahorro_real", "sum"),
            bloqueos=("esta_bloqueada", "sum"),
        )
        .reset_index()
        .sort_values(["ahorro_estimado", "departamento"], ascending=[False, True])
    )
    summary["bloqueos"] = summary["bloqueos"].astype(int)
    return summary.to_dict(orient="records")


def format_cop(value: float) -> str:
    return "$" + f"{value:,.0f}".replace(",", ".")
