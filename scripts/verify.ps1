param([string]$BaseUrl = 'http://localhost:14202')
$ErrorActionPreference = 'Stop'

$page = Invoke-WebRequest -Uri $BaseUrl -UseBasicParsing
if ($page.StatusCode -ne 200 -or $page.Content -notmatch '<app-root>') {
    throw 'La aplicación Angular no responde correctamente.'
}

$settings = Invoke-RestMethod -Uri "$BaseUrl/api/public/business"
if ($null -eq $settings.configured -or $settings.currency -notmatch '^[A-Z]{3}$') {
    throw 'La configuración pública no cumple el contrato esperado.'
}

$csrf = Invoke-RestMethod -Uri "$BaseUrl/api/auth/csrf"
if ($csrf.headerName -ne 'X-XSRF-TOKEN' -or [string]::IsNullOrWhiteSpace($csrf.token)) {
    throw 'No se obtuvo un token CSRF válido.'
}

try {
    Invoke-WebRequest -Uri "$BaseUrl/api/admin/products" -UseBasicParsing | Out-Null
    throw 'El endpoint administrativo permitió acceso anónimo.'
} catch {
    if ($null -eq $_.Exception.Response -or [int]$_.Exception.Response.StatusCode -ne 401) { throw }
}

Write-Output 'OK: Angular, proxy API, configuración PostgreSQL, CSRF y acceso administrativo.'
