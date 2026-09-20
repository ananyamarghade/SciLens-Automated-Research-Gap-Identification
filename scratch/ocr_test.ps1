[Windows.Media.Ocr.OcrEngine, Windows.Foundation.Diagnostics, ContentType = WindowsRuntime] | Out-Null
[Windows.Graphics.Imaging.BitmapDecoder, Windows.Foundation.Diagnostics, ContentType = WindowsRuntime] | Out-Null
[Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime] | Out-Null

$paths = @(
    'C:\Users\Dipali\Pictures\Screenshots\Screenshot 2026-09-20 102906.png',
    'C:\Users\Dipali\Pictures\Screenshots\Screenshot 2026-09-20 114315.png',
    'C:\Users\Dipali\Pictures\Screenshots\Screenshot 2026-09-20 114620.png',
    'C:\Users\Dipali\Pictures\Screenshots\Screenshot 2026-09-20 114915.png',
    'C:\Users\Dipali\Pictures\Screenshots\Screenshot 2026-09-20 121218.png',
    'C:\Users\Dipali\Pictures\Screenshots\Screenshot 2026-09-20 121736.png',
    'C:\Users\Dipali\Pictures\Screenshots\Screenshot 2026-09-20 124240.png',
    'C:\Users\Dipali\Pictures\Screenshots\Screenshot 2026-09-20 165217.png',
    'C:\Users\Dipali\Pictures\Screenshots\Screenshot 2026-09-20 212705.png'
)

$engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()

foreach ($p in $paths) {
    if (Test-Path $p) {
        $file = [Windows.Storage.StorageFile]::GetFileFromPathAsync($p).GetAwaiter().GetResult()
        $stream = $file.OpenAsync([Windows.Storage.FileAccessMode]::Read).GetAwaiter().GetResult()
        $decoder = [Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream).GetAwaiter().GetResult()
        $bitmap = $decoder.GetSoftwareBitmapAsync().GetAwaiter().GetResult()
        $result = $engine.RecognizeAsync($bitmap).GetAwaiter().GetResult()
        $name = [System.IO.Path]::GetFileName($p)
        $t = $result.Text -replace '\r?\n', ' '
        if ($t.Length -gt 150) { $t = $t.Substring(0, 150) }
        Write-Host "$name : $t"
    }
}
