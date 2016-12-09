param(
    [switch]$install = $false
)

if ($install) {
    npm install clean-css -g
    npm install uglifyjs -g
}

#uglifyjs scripts/auth.js scripts/header.js -o scripts/assignment.min.js -m -c
Get-Content styles/header.css, styles/body.css, styles/loading.css, styles/utility.css | cleancss -o styles/main.min.css