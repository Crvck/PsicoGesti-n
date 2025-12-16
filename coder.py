import os
import json

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
    
    rutas_encontradas = []
    
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
            
            rutas_encontradas.append(ruta_completa)
            
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
    MODO_MANUAL = True
    
    if MODO_MANUAL:
        DIRECTORIO_BASE = os.path.dirname(os.path.abspath(__file__))
    else:
        DIRECTORIO_BASE = os.path.dirname(os.path.abspath(__file__))

    NOMBRE = "psicogestion"
    ARCHIVO_SALIDA = f"{NOMBRE}_contenido.txt"
    
    ARCHIVOS_MANUAL = ['.py', '.json', '.yaml', '.yml','.env', '.js', '.jsx']
    
    ARCHIVOS_A_OMITIR = ["instruments.json", "coder.py", "package-lock.json",".sql"]
    EXTENSIONES_A_OMITIR = ['.log', '.pyc', '.tmp', '.bak']
    DIRECTORIOS_A_OMITIR = ['__pycache__', 'logs', '.git', 'venv', 'env', '.idea', '.vscode', 'node_modules', 'images', 'scripts']
    
    print(f"Generando archivo {ARCHIVO_SALIDA} con contenido de {DIRECTORIO_BASE}...")
    print(f"Modo: {'MANUAL' if MODO_MANUAL else 'AUTOMÁTICO'}")
    
    if MODO_MANUAL:
        print(f"Tipos de archivo incluidos: {ARCHIVOS_MANUAL}")
    
    generar_archivo_contenido(
        DIRECTORIO_BASE, 
        ARCHIVO_SALIDA,
        modo_manual=MODO_MANUAL,
        archivos_manual=ARCHIVOS_MANUAL,
        omitir=ARCHIVOS_A_OMITIR,
        omitir_extensiones=EXTENSIONES_A_OMITIR,
        omitir_directorios=DIRECTORIOS_A_OMITIR
    )
    
    print("¡Proceso completado!")
    print(f"Archivos generados:")
    print(f"1. {ARCHIVO_SALIDA} - Contenido de los archivos")
    print(f"2. {NOMBRE}_rutas.txt - Mapa de carpetas y archivos")