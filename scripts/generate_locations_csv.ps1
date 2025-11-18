# Generate CanadaCities-Min.csv from GeoNames cities500.txt
# Usage: Run this script in PowerShell after downloading cities500.txt from GeoNames

# ===== CONFIGURATION =====
# Update these paths to match your file locations
$inputFile = "C:\Users\Ankit\Downloads\cities500\cities500.txt"
$outputFile = "C:\Users\Ankit\Downloads\CanadaCities-Min.csv"

# ===== CORRECTED PROVINCE MAPPING =====
# GeoNames admin1_code -> Canadian province/territory abbreviations
$prov = @{
    '01'='AB'  # Alberta
    '02'='BC'  # British Columbia
    '03'='MB'  # Manitoba
    '04'='NB'  # New Brunswick
    '05'='NL'  # Newfoundland and Labrador
    '07'='NS'  # Nova Scotia
    '08'='ON'  # Ontario
    '09'='PE'  # Prince Edward Island
    '10'='QC'  # Quebec
    '11'='SK'  # Saskatchewan
    '12'='YT'  # Yukon
    '13'='NT'  # Northwest Territories
    '14'='NU'  # Nunavut
}

Write-Host "Reading GeoNames data from: $inputFile"
Write-Host "Output will be saved to: $outputFile"
Write-Host ""

# Check if input file exists
if (-not (Test-Path $inputFile)) {
    Write-Host "ERROR: Input file not found: $inputFile" -ForegroundColor Red
    Write-Host "Please update `$inputFile at the top of this script with the correct path." -ForegroundColor Yellow
    exit 1
}

# Dictionary to store best entry per (city, province) - keeps highest population
$best = @{}

# Set culture to invariant for number parsing
[System.Globalization.CultureInfo]::CurrentCulture = [System.Globalization.CultureInfo]::InvariantCulture

$lineCount = 0
$processedCount = 0

# Read and process each line
Get-Content -LiteralPath $inputFile -Encoding UTF8 | ForEach-Object {
    $lineCount++
    if ($lineCount % 10000 -eq 0) {
        Write-Host "Processed $lineCount lines, found $processedCount Canadian cities..." -ForegroundColor Gray
    }
    
    # GeoNames format is tab-separated
    $fields = $_ -split "`t", 20
    
    if ($fields.Count -ge 15) {
        $country = $fields[8]
        $featureClass = $fields[6]
        $featureCode = $fields[7]
        $admin1 = $fields[10]
        $population = [int]($fields[14] -as [int])
        
        # Filter: Canada, populated place, population >= 500
        if ($country -eq 'CA' -and $featureClass -eq 'P' -and $population -ge 500) {
            # Use 'name' field (index 1), fallback to 'asciiname' (index 2)
            $city = if ([string]::IsNullOrWhiteSpace($fields[1])) { $fields[2] } else { $fields[1] }
            $city = $city.Trim()
            
            # Get province abbreviation
            $province = $prov[$admin1]
            
            if ($city -and $province) {
                $processedCount++
                
                # Create unique key: lowercase city + province
                $key = ($city.ToLower() + '|' + $province.ToLower())
                
                # Parse coordinates
                $lat = [double]$fields[4]
                $lng = [double]$fields[5]
                
                # Keep entry with highest population for each (city, province) pair
                if (-not $best.ContainsKey($key) -or $population -gt $best[$key].population) {
                    $best[$key] = [pscustomobject]@{
                        city = $city
                        province = $province
                        lat = $lat
                        lng = $lng
                        population = $population
                    }
                }
            }
        }
    }
}

Write-Host ""
Write-Host "Processing complete!" -ForegroundColor Green
Write-Host "Total lines processed: $lineCount"
Write-Host "Canadian cities found: $processedCount"
Write-Host "Unique (city, province) pairs: $($best.Count)"
Write-Host ""

# Write CSV header
"city,province,lat,lng,population" | Out-File -LiteralPath $outputFile -Encoding utf8

# Write data rows, sorted by population (descending)
$best.Values | Sort-Object population -Descending | ForEach-Object {
    # Escape quotes in city names
    $cityEscaped = '"' + $_.city.Replace('"', '""') + '"'
    "$cityEscaped,$($_.province),$($_.lat),$($_.lng),$($_.population)" | 
        Out-File -LiteralPath $outputFile -Append -Encoding utf8
}

Write-Host "CSV file created successfully: $outputFile" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Open Supabase Dashboard" -ForegroundColor White
Write-Host "2. Go to Table Editor > public.locations" -ForegroundColor White
Write-Host "3. Click 'Import data' button" -ForegroundColor White
Write-Host "4. Select the CSV file: $outputFile" -ForegroundColor White
Write-Host "5. Map columns: city, province, lat, lng, population" -ForegroundColor White
Write-Host "6. Click Import" -ForegroundColor White

