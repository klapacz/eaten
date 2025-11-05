#!/bin/bash

set -e

echo "🎨 Optimizing SVG logos..."
pnpx svgo public/*.svg

echo "📱 Generating PNG logos for PWA manifest..."
magick public/logo.svg -background none -resize 192x192 public/logo192.png
magick public/logo.svg -background none -resize 512x512 public/logo512.png

echo "🍎 Generating iOS touch icons for home screen bookmarks..."
# iOS requires specific apple-touch-icon sizes for proper home screen display
# Without these, iOS may use the smallest available icon (favicon.ico) instead
# iOS devices look for these exact sizes:
# - 120x120: iPhone 6/7/8 Plus @2x
# - 152x152: iPad mini/Air @2x  
# - 167x167: iPad Pro @2x
# - 180x180: iPhone 6/7/8 Plus @3x, iPhone X/XS/11 Pro @2x
magick public/logo.svg -background none -resize 120x120 public/apple-touch-icon-120x120.png
magick public/logo.svg -background none -resize 152x152 public/apple-touch-icon-152x152.png
magick public/logo.svg -background none -resize 167x167 public/apple-touch-icon-167x167.png
magick public/logo.svg -background none -resize 180x180 public/apple-touch-icon-180x180.png

echo "🌐 Generating favicon.ico..."
magick public/logo-sm.svg -background none -define icon:auto-resize=64,48,32,16 public/favicon.ico

echo "✅ All logos generated successfully!"
