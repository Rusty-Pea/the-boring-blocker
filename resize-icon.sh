#!/bin/bash

# Script to resize block-doge.png to 128x128px and create favicon

echo "Resizing block-doge.png to 128x128px..."

# Check if the source file exists
if [ ! -f "./block-doge.png" ]; then
    echo "Error: block-doge.png not found!"
    exit 1
fi

# Resize the image to 128x128 using sips
sips -z 128 128 "./block-doge.png" --out "./icon-128.png"

# Verify the new dimensions
echo "Verifying new image dimensions:"
sips -g pixelHeight -g pixelWidth "./icon-128.png"

echo "Resize complete! Icon saved as icon-128.png"

# Also create 48x48 and 16x16 versions for Chrome extension requirements
echo "Creating additional icon sizes for Chrome Web Store..."
sips -z 48 48 "./block-doge.png" --out "./icon-48.png"
sips -z 16 16 "./block-doge.png" --out "./icon-16.png"

echo "All icons created successfully!"
echo " - icon-128.png (128x128 px)"
echo " - icon-48.png (48x48 px)"
echo " - icon-16.png (16x16 px)"

# Create a 32x32 version for the favicon
echo "Creating favicon..."
sips -z 32 32 "./block-doge.png" --out "./favicon-32.png"

# On macOS, we can use sips to create a simple .ico file by copying the PNG
cp "./icon-16.png" "./favicon.ico"

echo "Favicon created as favicon.ico"

# Copy all icons to both public and dist folders for proper build pipeline
echo "Copying icons to public/ and dist/ folders..."
cp icon-*.png favicon.ico public/
cp icon-*.png favicon.ico dist/

echo "All files have been created and copied to the appropriate directories." 