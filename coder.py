import os
import json

def generar_archivo_contenido(directorio_base, archivo_salida, modo_manual=False, 
                             archivos_manual=None, omitir=None, omitir_extensiones=None, 
                             omitir_directorios=None):
    """
    Genera un archivo con el contenido de los archivos en el directorio especificado.
    
    Args:
        directorio_base: Directorio raíz para buscar archivos
        archivo_salida: Nombre del archivo de salida
        modo_manual: Si es True, solo incluye los tipos de archivo especificados manualmente
        archivos_manual: Lista de extensiones a incluir en modo manual (ej: ['.py', '.json'])
        omitir: Lista de nombres de archivos específicos a omitir
        omitir_extensiones: Lista de extensiones a omitir
        omitir_directorios: Lista de directorios a omitir
    """
    if omitir is None:
        omitir = []
    if omitir_extensiones is None:
        omitir_extensiones = []
    if omitir_directorios is None:
        omitir_directorios = []
    if archivos_manual is None:
        archivos_manual = ['.py', '.json']  # Valores por defecto en modo manual
    
    with open(archivo_salida, 'w', encoding='utf-8') as out_file:
        for root, dirs, files in os.walk(directorio_base):
            # Filtrar directorios no deseados
            dirs[:] = [d for d in dirs if d not in omitir_directorios]
            
            for file in files:
                file_path = os.path.join(root, file)
                rel_path = os.path.relpath(file_path, directorio_base)
                
                # Determinar si el archivo debe ser incluido según el modo
                incluir_archivo = False
                
                if modo_manual:
                    # Modo manual: Solo incluir los tipos de archivo especificados
                    if any(file.endswith(ext) for ext in archivos_manual):
                        # Verificar que no esté en la lista de omitidos
                        if file not in omitir and not any(file.endswith(ext) for ext in omitir_extensiones):
                            incluir_archivo = True
                else:
                    # Modo automático: Incluir todos excepto los omitidos
                    # Por defecto incluye .py y .json, pero puedes modificar esto
                    if file.endswith(('.py', '.json')):
                        if file not in omitir and not any(file.endswith(ext) for ext in omitir_extensiones):
                            incluir_archivo = True
                
                if incluir_archivo:
                    try:
                        with open(file_path, 'r', encoding='utf-8') as in_file:
                            contenido = in_file.read()
                        out_file.write(f"\n\n/{rel_path}:\n")
                        out_file.write("-" * 80 + "\n")
                        out_file.write(contenido)
                    except Exception as e:
                        out_file.write(f"\n\nError al leer {rel_path}: {str(e)}\n")

if __name__ == "__main__":
    # Ejecutar en modo interactivo o directo
    modo_interactivo = False  # Cambiar a True para usar el menú interactivo
    
    if modo_interactivo:
        modo_interactivo()
    else:
        # Configuración directa (como antes)
        MODO_MANUAL = True  # Cambiar según necesidad
        
        if MODO_MANUAL:
            DIRECTORIO_BASE = os.path.dirname(os.path.abspath(__file__))
        else:
            DIRECTORIO_BASE = os.path.dirname(os.path.abspath(__file__))
    
    ARCHIVO_SALIDA = "contenidoCOMPLETO_PsicoGestion.txt"
    
    # Configuración para modo MANUAL
    # En modo manual, solo se incluirán los tipos de archivo especificados aquí
    ARCHIVOS_MANUAL = ['.py', '.json', '.yaml', '.yml','.env', '.js', '.jsx']
    
    # Configuración para modo AUTOMÁTICO
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