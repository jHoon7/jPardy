# Font Installation Instructions

To complete the setup of the jPardy! game with the correct fonts, please download the Gyparody font:

1. You can find the Gyparody font online by searching for "Gyparody font download"
2. Download the font files (.ttf, .woff, and/or .woff2 formats if available)
3. Place the downloaded font files in this directory (public/fonts/)
4. Rename the files to match the following pattern:
   - gyparody.ttf
   - gyparody.woff
   - gyparody.woff2

If you can't find the Gyparody font, you can also use Korinna BT or ITC Korinna fonts, which are similar to the classic Jeopardy! game show font.

## Alternative Solution

If you prefer not to download custom fonts, you can modify the components/jpardy.jsx file to use a Google Font that resembles the Jeopardy! style:

1. Find a suitable Google Font (like "Playfair Display" or "Roboto Slab")
2. Update the @import statement in the style section
3. Update the font-family in the .jpardy-title class 