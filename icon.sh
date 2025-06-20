#!/bin/bash

set -e

INPUT_ICON="icon.png"
ICON_PATH=layout/Library/PreferenceLoader/Preferences/Polyfills

resize_icon() {
    local input=$1
    local size=$2
    local output=$3
    magick "$input" -resize "$size" "$output"
}

resize_icon $INPUT_ICON 87 Polyfills@3x.png
resize_icon $INPUT_ICON 58 Polyfills@2x.png
resize_icon $INPUT_ICON 29 Polyfills.png

mv Polyfills*.png $ICON_PATH/
rm -f $ICON_PATH/$INPUT_ICON

pngquant --skip-if-larger -f --ext .png $ICON_PATH/*.png || true
oxipng -q $ICON_PATH/*.png
