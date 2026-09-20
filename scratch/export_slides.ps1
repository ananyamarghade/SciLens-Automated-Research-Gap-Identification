try {
    $ppt = New-Object -ComObject PowerPoint.Application
    $pres = $ppt.Presentations.Open('d:\Ananya\AgenticAI\SciLens\SciLens_Project_Presentation.pptx', [Microsoft.Office.Core.MsoTriState]::msoFalse, [Microsoft.Office.Core.MsoTriState]::msoFalse, [Microsoft.Office.Core.MsoTriState]::msoFalse)
    $outDir = 'd:\Ananya\AgenticAI\SciLens\scratch\slide_images'
    if (!(Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }
    
    for ($i = 1; $i -le $pres.Slides.Count; $i++) {
        $pres.Slides.Item($i).Export("$outDir\slide_$i.png", 'PNG', 1920, 1080)
    }
    
    $pres.Close()
    $ppt.Quit()
    Write-Host "Exported all $($pres.Slides.Count) slides successfully!"
} catch {
    Write-Host 'PowerPoint COM error:' $_.Exception.Message
}
