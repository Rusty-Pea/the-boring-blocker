#!/bin/bash

# Script to convert a .mov file to a GIF with decent quality

# Input file path
INPUT_FILE="/Users/whatever/Documents/GitHub/elon-evaporator/boring_promo.mov"

# Output file path - same location but with .gif extension
OUTPUT_FILE="${INPUT_FILE%.*}.gif"

# Get details about the video
echo "Getting video information..."
ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate -of csv=p=0 "$INPUT_FILE"

# Set parameters for decent quality but not amazing
# Resolution: scale to 640px width while maintaining aspect ratio
# Frame rate: 12 fps
# Dithering: floyd_steinberg (good quality)
# Colors: 256 (decent color reproduction)

echo "Converting $INPUT_FILE to GIF..."
echo "This may take a while depending on the video size..."

ffmpeg -i "$INPUT_FILE" \
  -vf "fps=12,scale=640:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=256[p];[s1][p]paletteuse=dither=floyd_steinberg" \
  -y "$OUTPUT_FILE"

echo "Conversion complete!"
echo "Output saved to: $OUTPUT_FILE"

# Print file size
echo "File size: $(du -h "$OUTPUT_FILE" | cut -f1)" 