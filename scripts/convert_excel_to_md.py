import pandas as pd
import openpyxl
import os

def df_to_markdown_custom(df):
    headers = [str(col) for col in df.columns]
    # Fila de cabecera
    md = "| " + " | ".join(headers) + " |\n"
    # Fila separadora
    md += "| " + " | ".join(["---"] * len(headers)) + " |\n"
    # Filas de datos
    for index, row in df.iterrows():
        cells = [str(val).replace('\n', ' ').replace('|', '\\|') for val in row]
        md += "| " + " | ".join(cells) + " |\n"
    return md

def convert_excel_to_markdown(excel_path, md_path):
    if not os.path.exists(excel_path):
        print(f"Error: El archivo {excel_path} no existe.")
        return

    # Cargar el libro de trabajo para obtener las hojas reales con codificación correcta
    wb = openpyxl.load_workbook(excel_path, read_only=True)
    sheets = wb.sheetnames

    with open(md_path, 'w', encoding='utf-8') as f:
        f.write(f"# Análisis de Plantilla de Iniciativas Presupuestales por Departamento\n\n")
        f.write(f"Este documento contiene la información extraída del archivo Excel `{os.path.basename(excel_path)}`.\n\n")
        f.write(f"---\n\n")

        for sheet_name in sheets:
            # Reemplazar caracteres extraños que surjan de la codificación
            clean_sheet_name = sheet_name.encode('utf-8', 'ignore').decode('utf-8')
            print(f"Procesando hoja: {clean_sheet_name}")

            f.write(f"## Departamento / Sección: {clean_sheet_name}\n\n")

            try:
                # Leer hoja con Pandas
                df = pd.read_excel(excel_path, sheet_name=sheet_name)
                
                # Reemplazar NaN por cadenas vacías para que la tabla sea legible
                df = df.fillna('')

                if df.empty:
                    f.write("*Esta hoja está vacía.*\n\n")
                else:
                    # Escribir la tabla en Markdown usando nuestra función personalizada
                    markdown_table = df_to_markdown_custom(df)
                    f.write(markdown_table)
                    f.write("\n\n")
            except Exception as e:
                f.write(f"*Error al procesar la hoja {clean_sheet_name}: {str(e)}*\n\n")

            f.write(f"---\n\n")

    print(f"Conversión completada con éxito. Archivo guardado en: {md_path}")

if __name__ == "__main__":
    excel_file = "Plantilla_Iniciativas_Por_Departamento_presupuestal.xlsx"
    md_file = "Plantilla_Iniciativas_Por_Departamento_presupuestal.md"
    convert_excel_to_markdown(excel_file, md_file)
