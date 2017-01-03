param(
    [switch]$install = $false
)

if ($install) {
    npm install clean-css -g
    npm install uglifyjs -g
}

uglifyjs scripts/objects/FileApi.js, scripts/objects/Field.js, scripts/objects/AudioObject.js, scripts/objects/ImageObject.js, scripts/objects/VideoObject.js, scripts/objects/EditFileFunction.js, scripts/objects/EditFunctions.js -o scripts/objects/Objects.js -b -m
Get-Content styles/header.css, styles/body.css, styles/loading.css, styles/utility.css | cleancss -o styles/main.min.css