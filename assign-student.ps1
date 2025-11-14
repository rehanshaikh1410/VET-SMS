$body = @{
    studentUsername = "shekhar"
    className = "TYBCA (Grade 15)"
} | ConvertTo-Json

Write-Host "Assigning student 'shekhar' to class 'TYBCA (Grade 15)'..."
Write-Host "Request body: $body"

try {
    $response = Invoke-RestMethod -Uri 'http://localhost:5004/api/assign-student-by-classname' `
        -Method Post `
        -Body $body `
        -ContentType 'application/json'
    Write-Host "Success! Response:"
    $response | ConvertTo-Json -Depth 5 | Write-Host
}
catch {
    Write-Host "Error: $_"
    exit 1
}
