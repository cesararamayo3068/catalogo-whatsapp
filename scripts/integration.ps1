param([string]$BaseUrl='http://localhost:14202',[string]$WhatsApp='')
$ErrorActionPreference='Stop'
$configuration=@{}
Get-Content -LiteralPath (Join-Path $PSScriptRoot '../.env') | ForEach-Object { if($_ -match '^([A-Z_]+)=(.*)$') { $configuration[$matches[1]]=$matches[2] } }
if(-not $configuration['ADMIN_PASSWORD']) { throw 'Configurá las credenciales de bootstrap en .env.' }
$session=New-Object Microsoft.PowerShell.Commands.WebRequestSession
function Read-Api([string]$path) { Invoke-RestMethod -Uri "$BaseUrl/api/$path" -WebSession $session }
function Write-Api([string]$method,[string]$path,$body) {
    $token=Read-Api 'auth/csrf'
    $parameters=@{Uri="$BaseUrl/api/$path";Method=$method;WebSession=$session;Headers=@{'X-XSRF-TOKEN'=$token.token};ContentType='application/json'}
    if($null -ne $body) { $parameters.Body=ConvertTo-Json -InputObject $body -Depth 20 -Compress }
    Invoke-RestMethod @parameters
}
function Expect-Status([int]$status,[scriptblock]$action) {
    try { & $action | Out-Null } catch { if($_.Exception.Response -and [int]$_.Exception.Response.StatusCode -eq $status) { return }; throw }
    throw "Se esperaba HTTP $status."
}
function Assert-True([bool]$condition,[string]$message) { if(-not $condition) { throw $message } }
Expect-Status 401 { Read-Api 'admin/dashboard' }
Expect-Status 401 { Invoke-RestMethod -Uri "$BaseUrl/api/admin/categories" -Method POST -ContentType 'application/json' -Body '{}' }
$token=Read-Api 'auth/csrf'
Invoke-RestMethod -Uri "$BaseUrl/api/auth/login" -Method POST -WebSession $session -Headers @{'X-XSRF-TOKEN'=$token.token} -ContentType 'application/x-www-form-urlencoded' -Body @{username=$configuration['ADMIN_USERNAME'];password=$configuration['ADMIN_PASSWORD']} | Out-Null
Assert-True ((Read-Api 'auth/me').username -eq $configuration['ADMIN_USERNAME']) 'Falló el inicio de sesión.'
Expect-Status 403 { Invoke-RestMethod -Uri "$BaseUrl/api/admin/categories" -Method POST -WebSession $session -ContentType 'application/json' -Body '{}' }
$original=Read-Api 'admin/business'
$testSettings=$original.PSObject.Copy()
$testSettings.whatsapp=if($WhatsApp) { $WhatsApp } else { '5491100000000' }
$testSettings.minimumOrder=0
$createdProduct=$null;$createdCategory=$null
try {
    Write-Api PUT 'admin/business' $testSettings | Out-Null
    $createdCategory=Write-Api POST 'admin/categories' @{name=('Prueba automatizada '+[guid]::NewGuid().ToString('N').Substring(0,8));active=$true;sortOrder=100}
    $inputProduct=@{name='Producto de integración';sku=('TEST-'+[guid]::NewGuid().ToString('N'));description='Registro temporal de prueba';categoryId=$createdCategory.id;price=10.10;promotionalPrice=9.00;active=$true;available=$true;featured=$false;minimumQuantity=2;images=@();attributes=@{Material='Algodón'};variants=@(@{id=$null;label='M / Azul';sku='';price=$null;available=$true;attributes=@{Talle='M';Color='Azul'}},@{id=$null;label='L / Verde';sku='';price=12.50;available=$true;attributes=@{Talle='L';Color='Verde'}});version=$null}
    $createdProduct=Write-Api POST 'admin/products' $inputProduct
    $png=[Convert]::FromBase64String('iVBORw0KGgoAAAANSUhEUgAAAAMAAAADCAYAAABWKLW/AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAATSURBVBhXY8AEDQz/oSwYYGAAABwVAYD7y3HJAAAAAElFTkSuQmCC')
    $token=Read-Api 'auth/csrf'
    $handler=New-Object System.Net.Http.HttpClientHandler
    $handler.CookieContainer=$session.Cookies
    $client=New-Object System.Net.Http.HttpClient($handler)
    $multipart=New-Object System.Net.Http.MultipartFormDataContent
    try {
        $part=New-Object System.Net.Http.ByteArrayContent(,$png)
        $part.Headers.ContentType=New-Object System.Net.Http.Headers.MediaTypeHeaderValue('image/png')
        $multipart.Add($part,'file','fixture.png')
        $client.DefaultRequestHeaders.Add('X-XSRF-TOKEN',$token.token)
        $response=$client.PostAsync("$BaseUrl/api/admin/images",$multipart).GetAwaiter().GetResult()
        Assert-True ($response.IsSuccessStatusCode) 'Falló la carga de imagen válida.'
        $uploaded=$response.Content.ReadAsStringAsync().GetAwaiter().GetResult() | ConvertFrom-Json
        $image=Invoke-WebRequest -Uri ($BaseUrl+$uploaded.url) -UseBasicParsing
        Assert-True ($image.StatusCode -eq 200 -and ($image.Headers['Content-Type'] -join '') -match 'image/png') 'La imagen almacenada no se sirve correctamente.'
    } finally { $multipart.Dispose();$client.Dispose();$handler.Dispose() }
    $createdProduct.images=@($uploaded.url)
    $createdProduct=Write-Api PUT "admin/products/$($createdProduct.id)" $createdProduct
    Assert-True ($createdProduct.variants.Count -eq 2) 'No se guardaron las variantes.'
    $public=Read-Api "public/products/$($createdProduct.id)"
    Assert-True ($public.categoryId -eq $createdCategory.id -and $public.categoryName -eq $createdCategory.name) 'La categoría no se resolvió desde su relación persistida.'
    Assert-True ($public.attributes.Material -eq 'Algodón') 'No se persistieron las características.'
    $search=Read-Api "public/products?query=integraci%C3%B3n&category=$($createdCategory.id)&page=0&size=1"
    Assert-True ($search.totalElements -eq 1 -and $search.items.Count -eq 1) 'Fallaron búsqueda, categoría o paginación.'
    $inherited=@($createdProduct.variants | Where-Object { $_.label -eq 'M / Azul' })[0]
    $specific=@($createdProduct.variants | Where-Object { $_.label -eq 'L / Verde' })[0]
    $checkout=@{customerName='Cliente de prueba';phone='';locality='Córdoba';notes='Prueba automática sin envío';items=@(@{productId=$createdProduct.id;variantId=$inherited.id;quantity=2},@{productId=$createdProduct.id;variantId=$specific.id;quantity=3})}
    $prepared=Write-Api POST 'public/checkout/prepare' $checkout
    Assert-True ([decimal]$prepared.total -eq [decimal]55.50) 'El cálculo monetario por variantes no es exacto.'
    Assert-True ($prepared.whatsappUrl.StartsWith("https://wa.me/$($testSettings.whatsapp)?text=")) 'El enlace no usa el WhatsApp configurado.'
    $decoded=[Uri]::UnescapeDataString(($prepared.whatsappUrl -split '\?text=',2)[1])
    Assert-True ($decoded -eq $prepared.message) 'El mensaje no se codificó correctamente.'
    $createdProduct.promotionalPrice=8.75
    $staleVersion=$createdProduct.PSObject.Copy()
    $createdProduct=Write-Api PUT "admin/products/$($createdProduct.id)" $createdProduct
    Expect-Status 409 { Write-Api PUT "admin/products/$($createdProduct.id)" $staleVersion }
    Assert-True ([decimal](Write-Api POST 'public/checkout/prepare' $checkout).total -eq [decimal]55.00) 'No se recalculó con el precio actualizado.'
    $checkout.items[0].quantity=1
    Expect-Status 400 { Write-Api POST 'public/checkout/prepare' $checkout }
    $checkout.items[0].quantity=2
    $testSettings.minimumOrder=1000
    Write-Api PUT 'admin/business' $testSettings | Out-Null
    Expect-Status 400 { Write-Api POST 'public/checkout/prepare' $checkout }
    $testSettings.minimumOrder=0
    Write-Api PUT 'admin/business' $testSettings | Out-Null
    $createdProduct.available=$false
    $createdProduct=Write-Api PUT "admin/products/$($createdProduct.id)" $createdProduct
    Expect-Status 400 { Write-Api POST 'public/checkout/prepare' $checkout }
    Write-Api PUT "admin/categories/$($createdCategory.id)" @{name=$createdCategory.name;sortOrder=100;active=$false} | Out-Null
    Expect-Status 404 { Read-Api "public/products/$($createdProduct.id)" }
    Expect-Status 400 { Write-Api DELETE "admin/categories/$($createdCategory.id)" $null }
    $stats=Read-Api 'admin/dashboard'
    Assert-True ($stats.products -ge 1 -and $stats.categories -ge 1) 'El dashboard no refleja los registros.'
    Write-Output 'OK: login, sesión, autorización, CSRF, categorías, productos, variantes, características, carga/lectura de imágenes, búsqueda, paginación, promoción, concurrencia, mínimos, disponibilidad, cálculo decimal y enlace WhatsApp.'
} finally {
    try {
        if($createdProduct) { Write-Api DELETE "admin/products/$($createdProduct.id)" $null | Out-Null }
    } finally {
        try {
            if($createdCategory) { Write-Api DELETE "admin/categories/$($createdCategory.id)" $null | Out-Null }
        } finally {
            if($WhatsApp) { $original.whatsapp=$WhatsApp }
            Write-Api PUT 'admin/business' $original | Out-Null
        }
    }
}
Write-Api POST 'auth/logout' $null | Out-Null
Expect-Status 401 { Read-Api 'admin/dashboard' }
Write-Output 'OK: registros de prueba eliminados, configuración restaurada y logout verificado. No se abrió WhatsApp ni se envió ningún mensaje.'
