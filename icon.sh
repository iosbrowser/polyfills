#!/bin/bash

set -e

INPUT_ICON=icon.png
INPUT_OUTLINE_ICON=icon-outline.png
TWEAK_ICON_PATH=layout/Library/PreferenceLoader/Preferences/Polyfills
CC_ICON_PATH=PolyfillsCC/Resources

resize_icon() {
    local input=$1
    local size=$2
    local output=$3
    local background=${4:-none}
    magick $input -resize $size -background $background $output
}

resize_icon $INPUT_ICON 87 $TWEAK_ICON_PATH/Polyfills@3x.png
resize_icon $INPUT_ICON 58 $TWEAK_ICON_PATH/Polyfills@2x.png
resize_icon $INPUT_ICON 29 $TWEAK_ICON_PATH/Polyfills.png

resize_icon $INPUT_OUTLINE_ICON 144 $CC_ICON_PATH/icon@3x.png
resize_icon $INPUT_OUTLINE_ICON 96 $CC_ICON_PATH/icon@2x.png
resize_icon $INPUT_ICON 87 $CC_ICON_PATH/SettingsIcon@3x.png white
resize_icon $INPUT_ICON 58 $CC_ICON_PATH/SettingsIcon@2x.png white

pngquant --skip-if-larger -f --ext .png $TWEAK_ICON_PATH/*.png || true
oxipng -q $TWEAK_ICON_PATH/*.png
pngquant --skip-if-larger -f --ext .png $CC_ICON_PATH/*.png || true
oxipng -q $CC_ICON_PATH/*.png
