# https://stackoverflow.com/a/76723749
# https://creativecommons.org/licenses/by-sa/4.0/
function Import-Env {
    [CmdletBinding(SupportsShouldProcess)]
    [Alias('dotenv')]
    param(
        [ValidateNotNullOrEmpty()]
        [String] $Path = '.env',

        # Determines whether variables are environment variables or normal
        [ValidateSet('Environment', 'Regular')]
        [String] $Type = 'Environment'
    )
    $Env = Get-Content -raw $Path | ConvertFrom-StringData
    $Env.GetEnumerator() | Foreach-Object {
        $Name, $Value  = $_.Name, $_.Value
        
        # Account for quote rules in Bash
        $StartQuote = [Regex]::Match($Value, "^('|`")")
        $EndQuote = [Regex]::Match($Value, "('|`")$")
        if ($StartQuote.Success -and -not $EndQuote.Success) {
            throw [System.IO.InvalidDataException] "Missing terminating quote $($StartQuote.Value) in '$Name': $Value"
        } elseif (-not $StartQuote.Success -and $EndQuote.Success) {
            throw [System.IO.InvalidDataException] "Missing starting quote $($EndQuote.Value) in '$Name': $Value"
        } elseif ($StartQuote.Value -ne $EndQuote.Value) {
            throw [System.IO.InvalidDataException] "Mismatched quotes in '$Name': $Value"
        } elseif ($StartQuote.Success -and $EndQuote.Success) {
            $Value = $Value -replace "^('|`")" -replace "('|`")$"  # Trim quotes
        }
        
        if ($PSCmdlet.ShouldProcess($Name, "Importing $Type Variable")) {
            switch ($Type) {
                'Environment' { Set-Content -Path "env:\$Name" -Value $Value }
                'Regular' { Set-Variable -Name $Name -Value $Value -Scope Script }
            }
        }
    }
}
Import-Env(".env")

tsx index.ts