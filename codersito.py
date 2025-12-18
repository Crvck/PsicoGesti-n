import os
import json
from datetime import datetime

PAGINAS_ARCHIVOS = {
    "becario_dashboard": [
        "backend/src/controllers/dashboardController.js",
        "backend/src/routes/dashboardRoutes.js",
        "backend/src/models/userModel.js",
        "backend/src/models/citaModel.js",
        "backend/src/models/notificacionModel.js",
        "backend/src/services/estadisticaService.js",
        "backend/src/services/dashboardService.js",
        "frontend/src/services/dashboardService.js"
    ],
    "becario_citas": [
        "backend/src/controllers/citaController.js",
        "backend/src/routes/citaRoutes.js",
        "backend/src/models/citaModel.js",
        "backend/src/models/pacienteModel.js",
        "backend/src/controllers/disponibilidadController.js",
        "backend/src/routes/disponibilidadRoutes.js"
    ],
    "becario_pacientes": [
        "backend/src/controllers/pacienteController.js",
        "backend/src/routes/pacienteRoutes.js",
        "backend/src/models/pacienteModel.js",
        "backend/src/controllers/asignacionController.js",
        "backend/src/routes/asignacionRoutes.js"
    ],
    "becario_notificaciones": [
        "backend/src/controllers/notificacionController.js",
        "backend/src/routes/notificacionRoutes.js",
        "backend/src/models/notificacionModel.js"
    ],
    "becario_observaciones": [
        "backend/src/controllers/observacionController.js",
        "backend/src/routes/observacionRoutes.js",
        "backend/src/models/observacionBecarioModel.js",
        "backend/src/models/pacienteModel.js"
    ],
    "coordinador_dashboard": [
        "backend/src/controllers/dashboardController.js",
        "backend/src/routes/dashboardRoutes.js",
        "backend/src/models/userModel.js",
        "backend/src/models/citaModel.js",
        "backend/src/models/pacienteModel.js",
        "backend/src/services/estadisticaService.js",
        "backend/src/services/dashboardService.js",
        "frontend/src/services/dashboardService.js"
    ],
    "coordinador_usuarios": [
        "backend/src/controllers/authController.js",
        "backend/src/routes/authRoutes.js",
        "backend/src/models/userModel.js",
        "backend/src/models/permisoModel.js"
    ],
    "coordinador_pacientes": [
        "backend/src/controllers/pacienteController.js",
        "backend/src/routes/pacienteRoutes.js",
        "backend/src/models/pacienteModel.js"
    ],
    "coordinador_asignaciones": [
        "backend/src/controllers/asignacionController.js",
        "backend/src/routes/asignacionRoutes.js",
        "backend/src/models/asignacionModel.js",
        "backend/src/models/userModel.js",
        "backend/src/models/pacienteModel.js"
    ],
    "coordinador_agenda": [
        "backend/src/controllers/agendaController.js",
        "backend/src/routes/agendaRoutes.js",
        "backend/src/models/citaModel.js",
        "backend/src/models/userModel.js",
        "backend/src/services/calendarioService.js"
    ],
    "coordinador_reportes": [
        "backend/src/controllers/reporteController.js",
        "backend/src/routes/reporteRoutes.js",
        "backend/src/models/reporteModel.js",
        "backend/src/services/reporteService.js",
        "backend/src/services/estadisticaService.js"
    ],
    "coordinador_altas": [
        "backend/src/controllers/altaController.js",
        "backend/src/routes/altaRoutes.js",
        "backend/src/models/altaModel.js",
        "backend/src/models/pacienteModel.js"
    ],
    "coordinador_configuracion": [
        "backend/src/controllers/configuracionController.js",
        "backend/src/routes/configuracionRoutes.js",
        "backend/src/services/backupService.js",
        "backend/src/models/logSistemaModel.js"
    ],
    "psicologo_dashboard": [
        "backend/src/controllers/dashboardController.js",
        "backend/src/routes/dashboardRoutes.js",
        "backend/src/models/citaModel.js",
        "backend/src/models/pacienteModel.js",
        "backend/src/models/userModel.js",
        "backend/src/services/dashboardService.js",
        "frontend/src/services/dashboardService.js"
    ],
    "psicologo_pacientes": [
        "backend/src/controllers/pacienteController.js",
        "backend/src/routes/pacienteRoutes.js",
        "backend/src/models/pacienteModel.js",
        "backend/src/models/expedienteModel.js"
    ],
    "psicologo_citas": [
        "backend/src/controllers/citaController.js",
        "backend/src/routes/citaRoutes.js",
        "backend/src/models/citaModel.js",
        "backend/src/controllers/disponibilidadController.js",
        "backend/src/routes/disponibilidadRoutes.js"
    ],
    "psicologo_expedientes": [
        "backend/src/controllers/expedienteController.js",
        "backend/src/routes/expedienteRoutes.js",
        "backend/src/models/expedienteModel.js",
        "backend/src/models/pacienteModel.js",
        "backend/src/models/sesionModel.js"
    ],
    "psicologo_sesiones": [
        "backend/src/controllers/sesionController.js",
        "backend/src/routes/sesionRoutes.js",
        "backend/src/models/sesionModel.js",
        "backend/src/models/pacienteModel.js"
    ],
    "psicologo_supervision": [
        "backend/src/controllers/supervisionController.js",
        "backend/src/routes/supervisionRoutes.js",
        "backend/src/models/observacionBecarioModel.js",
        "backend/src/models/userModel.js"
    ]
}

ARCHIVOS_BASE = [
    "backend/server.js",
    "backend/src/db/db.sql",
    "backend/src/services/api.js",
    "frontend/src/App.js",
    "frontend/src/index.js",
    "frontend/src/services/api.js",
    "frontend/src/global.css"
]

def generar_txt_por_pagina(directorio_base, output_dir="paginas_backend"):
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    for pagina, archivos_necesarios in PAGINAS_ARCHIVOS.items():
        todos_archivos = list(set(archivos_necesarios + ARCHIVOS_BASE))
        nombre_archivo = f"{pagina}_backend.txt"
        ruta_completa = os.path.join(output_dir, nombre_archivo)
        
        print(f"Generando {nombre_archivo}...")
        
        with open(ruta_completa, 'w', encoding='utf-8') as out_file:
            out_file.write(f"ARCHIVOS BACKEND PARA: {pagina.upper()}\n")
            out_file.write("=" * 80 + "\n")
            out_file.write(f"Generado: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            out_file.write("=" * 80 + "\n\n")
            
            archivos_encontrados = 0
            archivos_no_encontrados = []
            
            for archivo_relativo in todos_archivos:
                ruta_absoluta = os.path.join(directorio_base, archivo_relativo)
                
                out_file.write(f"/{archivo_relativo}:\n")
                out_file.write("-" * 80 + "\n")
                
                if os.path.exists(ruta_absoluta):
                    try:
                        with open(ruta_absoluta, 'r', encoding='utf-8') as in_file:
                            contenido = in_file.read()
                        out_file.write(contenido + "\n")
                        archivos_encontrados += 1
                    except Exception as e:
                        out_file.write(f"Error al leer archivo: {str(e)}\n")
                        archivos_no_encontrados.append(archivo_relativo)
                else:
                    out_file.write("ARCHIVO NO ENCONTRADO\n")
                    archivos_no_encontrados.append(archivo_relativo)
                
                out_file.write("\n\n")
            
            out_file.write("=" * 80 + "\n")
            out_file.write(f"RESUMEN PARA {pagina.upper()}:\n")
            out_file.write("-" * 40 + "\n")
            out_file.write(f"Archivos necesarios: {len(todos_archivos)}\n")
            out_file.write(f"Archivos encontrados: {archivos_encontrados}\n")
            out_file.write(f"Archivos no encontrados: {len(archivos_no_encontrados)}\n")
            
            if archivos_no_encontrados:
                out_file.write("\nArchivos faltantes:\n")
                for archivo in archivos_no_encontrados:
                    out_file.write(f"  - {archivo}\n")
    
    print(f"\nProceso completado. Archivos generados en: {output_dir}/")

def generar_archivo_contenido(directorio_base, archivo_salida, modo_manual=False, 
                             archivos_manual=None, omitir=None, omitir_extensiones=None, 
                             omitir_directorios=None):
    
    if omitir is None:
        omitir = []
    if omitir_extensiones is None:
        omitir_extensiones = []
    if omitir_directorios is None:
        omitir_directorios = []
    if archivos_manual is None:
        archivos_manual = ['.py', '.json']
    
    archivo_rutas = archivo_salida.replace('_contenido.txt', '_rutas.txt')
    
    with open(archivo_salida, 'w', encoding='utf-8') as out_file, \
         open(archivo_rutas, 'w', encoding='utf-8') as rutas_file:
        
        rutas_file.write("MAPAS DE CARPETAS Y ARCHIVOS\n")
        rutas_file.write("=" * 80 + "\n\n")
        
        for root, dirs, files in os.walk(directorio_base):
            dirs[:] = [d for d in dirs if d not in omitir_directorios]
            
            ruta_relativa = os.path.relpath(root, directorio_base)
            ruta_mostrar = ruta_relativa if ruta_relativa != '.' else ''
            ruta_completa = os.path.join(directorio_base, ruta_relativa)
            
            if ruta_mostrar:
                rutas_file.write(f"{ruta_completa}/\n")
            else:
                rutas_file.write(f"{directorio_base}/\n")
            
            archivos_incluidos = []
            
            for file in files:
                file_path = os.path.join(root, file)
                rel_path = os.path.relpath(file_path, directorio_base)
                ruta_archivo_completa = os.path.join(directorio_base, rel_path)
                
                incluir_archivo = False
                
                if modo_manual:
                    if any(file.endswith(ext) for ext in archivos_manual):
                        if file not in omitir and not any(file.endswith(ext) for ext in omitir_extensiones):
                            incluir_archivo = True
                else:
                    if file.endswith(('.py', '.json')):
                        if file not in omitir and not any(file.endswith(ext) for ext in omitir_extensiones):
                            incluir_archivo = True
                
                if incluir_archivo:
                    archivos_incluidos.append(file)
                    
                    try:
                        with open(file_path, 'r', encoding='utf-8') as in_file:
                            contenido = in_file.read()
                        out_file.write(f"\n\n/{rel_path}:\n")
                        out_file.write("-" * 80 + "\n")
                        out_file.write(contenido)
                    except Exception as e:
                        out_file.write(f"\n\nError al leer {rel_path}: {str(e)}\n")
                
                if file not in omitir and not any(file.endswith(ext) for ext in omitir_extensiones):
                    rutas_file.write(f"  {ruta_archivo_completa}\n")
            
            if not archivos_incluidos:
                rutas_file.write("  (sin archivos incluidos)\n")
            
            rutas_file.write("\n")

if __name__ == "__main__":
    DIRECTORIO_BASE = os.path.dirname(os.path.abspath(__file__))
    OUTPUT_DIR = "paginas_backend"
    
    print("=" * 80)
    print("GENERADOR DE ARCHIVOS TXT POR PÁGINA")
    print("=" * 80)
    print(f"Directorio base: {DIRECTORIO_BASE}")
    print(f"Total de páginas: {len(PAGINAS_ARCHIVOS)}")
    print()
    
    print("1. Generando archivos TXT por página...")
    generar_txt_por_pagina(DIRECTORIO_BASE, output_dir=OUTPUT_DIR)
    
    print("\n2. Generando archivos generales...")
    
    MODO_MANUAL = True
    ARCHIVO_CONTENIDO = "psicogestion_contenido.txt"
    ARCHIVO_RUTAS = "psicogestion_rutas.txt"
    
    ARCHIVOS_MANUAL = ['.py', '.json', '.yaml', '.yml','.env', '.js', '.jsx', '.sql', '.css']
    
    ARCHIVOS_A_OMITIR = ["instruments.json", "coder.py", "package-lock.json"]
    EXTENSIONES_A_OMITIR = ['.log', '.pyc', '.tmp', '.bak']
    DIRECTORIOS_A_OMITIR = ['__pycache__', 'logs', '.git', 'venv', 'env', '.idea', 
                           '.vscode', 'node_modules', 'images', 'scripts', OUTPUT_DIR]
    
    try:
        print(f"Generando {ARCHIVO_CONTENIDO}...")
        generar_archivo_contenido(
            DIRECTORIO_BASE, 
            ARCHIVO_CONTENIDO,
            modo_manual=MODO_MANUAL,
            archivos_manual=ARCHIVOS_MANUAL,
            omitir=ARCHIVOS_A_OMITIR,
            omitir_extensiones=EXTENSIONES_A_OMITIR,
            omitir_directorios=DIRECTORIOS_A_OMITIR
        )
        print(f"✓ {ARCHIVO_CONTENIDO} generado")
        print(f"✓ {ARCHIVO_RUTAS} generado")
    except Exception as e:
        print(f"✗ Error: {e}")
    
    print("\n" + "=" * 80)
    print("¡PROCESO COMPLETADO!")
    print("=" * 80)
    
    archivos_paginas = [f for f in os.listdir(OUTPUT_DIR) if f.endswith("_backend.txt")] if os.path.exists(OUTPUT_DIR) else []
    
    print(f"\nArchivos generados en '{OUTPUT_DIR}/':")
    print("-" * 40)
    
    grupos = {
        "BECARIO": [f for f in archivos_paginas if f.startswith("becario_")],
        "COORDINADOR": [f for f in archivos_paginas if f.startswith("coordinador_")],
        "PSICÓLOGO": [f for f in archivos_paginas if f.startswith("psicologo_")]
    }
    
    for grupo, archivos in grupos.items():
        if archivos:
            print(f"\n{grupo}:")
            for archivo in sorted(archivos):
                print(f"  • {archivo}")
    
    print(f"\nArchivos generales:")
    print(f"  • {ARCHIVO_CONTENIDO}")
    print(f"  • {ARCHIVO_RUTAS}")