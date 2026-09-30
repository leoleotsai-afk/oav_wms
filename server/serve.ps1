<#
 Purpose: serve the public/ folder as static files over HTTP for local preview.
 This machine has no node/python/IIS available, so we use .NET HttpListener directly.
 Usage: powershell -File server\serve.ps1 -Port 8080
#>
param(
    [int]$Port = 8080
)

$publicDir = Join-Path (Split-Path -Parent $PSScriptRoot) "public"
if (-not (Test-Path $publicDir)) {
    $publicDir = Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) "..\public"
}
$publicDir = (Resolve-Path $publicDir).Path

$mime = @{
    ".html" = "text/html; charset=utf-8"
    ".htm"  = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".svg"  = "image/svg+xml"
    ".png"  = "image/png"
    ".ico"  = "image/x-icon"
    ".webmanifest" = "application/manifest+json"
}

$listener = New-Object System.Net.HttpListener
$prefix = "http://localhost:$Port/"
$listener.Prefixes.Add($prefix)
$listener.Start()
Write-Output "Serving $publicDir"
Write-Output "Listening on $prefix (Ctrl+C to stop)"

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        try {
            $path = [System.Uri]::UnescapeDataString($request.Url.AbsolutePath)
            if ($path -eq "/") { $path = "/index.html" }
            $fullPath = Join-Path $publicDir ($path.TrimStart("/"))
            $fullPath = $fullPath -replace "/", "\"

            if ((Test-Path $fullPath) -and -not (Get-Item $fullPath).PSIsContainer) {
                $ext = [System.IO.Path]::GetExtension($fullPath).ToLower()
                $contentType = $mime[$ext]
                if (-not $contentType) { $contentType = "application/octet-stream" }
                $bytes = [System.IO.File]::ReadAllBytes($fullPath)
                $response.ContentType = $contentType
                $response.ContentLength64 = $bytes.Length
                $response.StatusCode = 200
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            } else {
                $notFound = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $path")
                $response.StatusCode = 404
                $response.OutputStream.Write($notFound, 0, $notFound.Length)
            }
        } catch {
            $errBytes = [System.Text.Encoding]::UTF8.GetBytes("500 Server Error: $($_.Exception.Message)")
            $response.StatusCode = 500
            $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
        } finally {
            $response.OutputStream.Close()
        }
    }
} finally {
    $listener.Stop()
    $listener.Close()
}
