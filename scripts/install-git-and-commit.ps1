# Instalar Git (opcional) y hacer commit con el mensaje preparado
# Uso: Ejecutar en PowerShell (preferible como Administrador)
# Ejemplo: Abrir PowerShell como Admin y correr:
#   .\scripts\install-git-and-commit.ps1

function Write-Info($m){ Write-Host $m -ForegroundColor Cyan }
function Write-Ok($m){ Write-Host $m -ForegroundColor Green }
function Write-Warn($m){ Write-Host $m -ForegroundColor Yellow }
function Write-Err($m){ Write-Host $m -ForegroundColor Red }

$root = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $root

# Comprueba si git está disponible
$gitCmd = Get-Command git -ErrorAction SilentlyContinue
if (-not $gitCmd) {
    Write-Warn "Git no está instalado o no está en PATH."
    $install = Read-Host "¿Deseas descargar e instalar Git para Windows ahora? (S/N)"
    if ($install -match '^[sS]') {
        $tmp = [IO.Path]::GetTempPath()
        $installer = Join-Path $tmp "Git-For-Windows-Installer.exe"
        $url = "https://github.com/git-for-windows/git/releases/latest/download/Git-64-bit.exe"
        Write-Info "Descargando Git desde: $url"
        try {
            Invoke-WebRequest -Uri $url -OutFile $installer -UseBasicParsing -ErrorAction Stop
            Write-Ok "Descargado instalador en: $installer"
        } catch {
            Write-Err "Error al descargar Git: $_"
            exit 1
        }
        Write-Info "Ejecutando instalador (se pedirá UAC)."
        try {
            $args = @('/VERYSILENT','/NORESTART')
            Start-Process -FilePath $installer -ArgumentList $args -Verb RunAs -Wait
            Write-Ok "Instalación completada (si el instalador terminó correctamente)."
        } catch {
            Write-Err "La instalación fue cancelada o falló: $_"
            exit 1
        }
        # Intenta localizar ejecutable de Git (instalación por defecto)
        $possiblePaths = @("C:\Program Files\Git\cmd\git.exe","C:\Program Files\Git\bin\git.exe","C:\Program Files (x86)\Git\cmd\git.exe")
        $gitExe = $null
        foreach ($p in $possiblePaths) {
            if (Test-Path $p) { $gitExe = $p; break }
        }
        if (-not $gitExe) {
            # Intenta Get-Command otra vez
            $gitCmd = Get-Command git -ErrorAction SilentlyContinue
            if ($gitCmd) { $gitExe = $gitCmd.Source }
        }
        if (-not $gitExe) {
            Write-Warn "No pude detectar la ruta de git tras la instalación. Abre una nueva terminal y vuelve a ejecutar este script."
            exit 1
        }
    } else {
        Write-Err "Necesitas Git para hacer el commit desde este script. Cancelando."
        exit 1
    }
} else {
    $gitExe = $gitCmd.Source
}

Write-Info "Usando git en: $gitExe"

# Solicitar configuración de usuario si no existe
$name = & $gitExe config --global user.name 2>$null
$email = & $gitExe config --global user.email 2>$null
if (-not $name) {
    $name = Read-Host "Introduce el nombre de usuario para Git (ej. 'Tu Nombre')"
    if ($name) { & $gitExe config --global user.name "$name" }
}
if (-not $email) {
    $email = Read-Host "Introduce el email para Git (ej. 'tu@email.com')"
    if ($email) { & $gitExe config --global user.email "$email" }
}

# Verifica que exista el archivo COMMIT_MESSAGE.txt
$commitMsgFile = Join-Path $root 'COMMIT_MESSAGE.txt'
if (-not (Test-Path $commitMsgFile)) {
    Write-Err "No encontré COMMIT_MESSAGE.txt en la raíz del proyecto. Asegúrate de que existe."
    exit 1
}

# Inicializar repo si hace falta
if (-not (Test-Path (Join-Path $root '.git'))) {
    Write-Info "No encuentro un repositorio Git. Inicializando 'git init'."
    & $gitExe init
}

# Añadir y commitear
Write-Info "Añadiendo todos los cambios y creando commit..."
& $gitExe add -A
try {
    & $gitExe commit -F "$commitMsgFile"
} catch {
    Write-Warn "Commit falló (posible: no hay cambios para commitear o conflicto). Intentaré mostrar estado."
    & $gitExe status -s
    exit 1
}

$hash = & $gitExe rev-parse --short HEAD
Write-Ok "Commit creado: $hash"
Write-Info "Si quieres subir a un remoto, añade el remoto y haz 'git push -u origin HEAD'."

Write-Ok "Listo."
