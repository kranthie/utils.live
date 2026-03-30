import type { BlogPost } from "../types";

export const colorPickerConverterGuide: BlogPost = {
  slug: "color-picker-converter-guide",
  title: "Color Picker & Converter: HEX, RGB, HSL Explained",
  description:
    "Learn how HEX, RGB, HSL, and other color formats work and how to convert between them for web design and development.",
  publishedAt: "2026-03-30",
  readingTimeMinutes: 9,
  category: "Color",
  ctaTools: [
    { name: "Color Converter", href: "/tools/color/color-converter" },
  ],
  content: `## How Computers Represent Color

Every color you see on a digital screen is produced by combining red, green, and blue light at varying intensities. This is the RGB (Red, Green, Blue) color model, and it reflects the physical reality of how LCD, OLED, and other display technologies work: each pixel contains separate red, green, and blue sub-pixels that illuminate at different intensities to produce the full spectrum of visible color.

Different color formats represent the same underlying RGB values in different ways, each optimized for different use cases. Understanding these formats helps you work more fluidly with color in CSS, design tools, and code.

---

## The RGB Color Model

In the standard 8-bit-per-channel RGB model, each color channel (red, green, and blue) is an integer from 0 to 255. This gives 256 x 256 x 256 = 16,777,216 possible colors.

\`\`\`
rgb(255, 0, 0)      — pure red
rgb(0, 255, 0)      — pure green
rgb(0, 0, 255)      — pure blue
rgb(0, 0, 0)        — black (all channels off)
rgb(255, 255, 255)  — white (all channels at maximum)
rgb(128, 128, 128)  — medium gray (all channels equal)
\`\`\`

In CSS, RGB colors can also use decimal fractions (0–1) or percentages:

\`\`\`css
color: rgb(255, 99, 71);           /* Tomato red */
color: rgb(255 99 71);             /* Modern space-separated syntax */
color: rgba(255, 99, 71, 0.5);     /* 50% transparent */
color: rgb(255 99 71 / 0.5);       /* Modern syntax with alpha */
\`\`\`

### Alpha Channel (RGBA)

Adding a fourth channel, alpha, controls transparency:
- \`0\` = fully transparent
- \`1\` = fully opaque
- \`0.5\` = 50% transparent

---

## HEX Color Codes

Hexadecimal (HEX) color codes are the most common format in web development. They encode the same RGB values as pairs of hexadecimal digits:

\`\`\`
#RRGGBB
\`\`\`

Each pair represents one channel (red, green, or blue) as a value from \`00\` (0) to \`FF\` (255).

\`\`\`
#FF0000 — red (255, 0, 0)
#00FF00 — green (0, 255, 0)
#0000FF — blue (0, 0, 255)
#000000 — black
#FFFFFF — white
#808080 — medium gray (128, 128, 128)
#FF6347 — tomato red (255, 99, 71)
\`\`\`

### Shorthand HEX

When each pair has identical digits, the code can be shortened to three characters:

\`\`\`
#FF0000 → #F00
#FFFFFF → #FFF
#000000 → #000
#336699 → #369  (only works if each pair has matching digits)
\`\`\`

### 8-Digit HEX with Alpha

CSS now supports 8-character HEX codes where the final two digits specify the alpha channel:

\`\`\`
#FF634780 — tomato red at 50% opacity (80 hex = 128 decimal = ~50%)
#FF000000 — fully transparent red (alpha = 0)
#FF0000FF — fully opaque red (alpha = 255)
\`\`\`

### Converting HEX to RGB

Each HEX pair is a hexadecimal number. Convert to decimal:

\`\`\`
#FF6347
R: FF = 15*16 + 15 = 255
G: 63 = 6*16 + 3 = 99
B: 47 = 4*16 + 7 = 71
→ rgb(255, 99, 71)
\`\`\`

---

## HSL: Hue, Saturation, Lightness

HSL is a cylindrical representation of the RGB color model that maps much better to how humans perceive and describe color. Instead of three independent light channels, HSL describes color in terms of:

- **Hue:** The color type (0–360 degrees on a color wheel)
- **Saturation:** The color's intensity or "colorfulness" (0–100%)
- **Lightness:** How light or dark the color is (0–100%)

\`\`\`
hsl(0, 100%, 50%)    — pure red
hsl(120, 100%, 50%)  — pure green
hsl(240, 100%, 50%)  — pure blue
hsl(0, 0%, 0%)       — black (any hue, 0% lightness)
hsl(0, 0%, 100%)     — white (any hue, 100% lightness)
hsl(0, 0%, 50%)      — medium gray (0% saturation)
hsl(14, 100%, 64%)   — tomato red (#FF6347)
\`\`\`

### The Hue Wheel

Hue is expressed as an angle on the color wheel:
- 0° / 360°: Red
- 30°: Orange
- 60°: Yellow
- 90°: Yellow-green
- 120°: Green
- 180°: Cyan
- 240°: Blue
- 270°: Blue-violet
- 300°: Magenta

### Why HSL Is Useful for Development

HSL is much easier to reason about and manipulate than RGB or HEX:

- **Creating color variations:** To make a color lighter, increase the L value. To make it darker, decrease it. With RGB, you would have to adjust all three channels.
- **Creating complementary colors:** A complementary color is just \`hue + 180\` degrees.
- **Building color palettes:** Keep hue and saturation constant, vary lightness to create a tint/shade scale.

\`\`\`css
/* A button with hover state using HSL */
.button {
  background-color: hsl(220, 80%, 50%);   /* Base blue */
}
.button:hover {
  background-color: hsl(220, 80%, 45%);   /* 5% darker, same hue */
}
.button:active {
  background-color: hsl(220, 80%, 40%);   /* Even darker */
}
\`\`\`

With HEX or RGB, computing "5% darker" requires knowing the math. With HSL, it's a single number change.

---

## HSB / HSV: Hue, Saturation, Brightness/Value

HSB (also called HSV) is similar to HSL but uses a different lightness model. It is commonly used in design tools like Photoshop, Figma, and Sketch:

- **Hue:** Same as HSL (0–360°)
- **Saturation:** How "pure" the color is vs white (0–100%)
- **Brightness/Value:** The brightness of the color (0–100%)

The key difference from HSL: in HSB, 100% brightness with 100% saturation gives pure colors, while 0% brightness is always black. In HSL, 50% lightness gives the most saturated colors, 0% is always black, and 100% is always white.

Most color picker tools use HSB/HSV because it is more intuitive for artists. CSS uses HSL.

---

## Converting Between Color Formats

### RGB to HEX

Convert each channel to a 2-digit hex number and concatenate:

\`\`\`javascript
function rgbToHex(r, g, b) {
  return "#" + [r, g, b]
    .map(v => v.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()
}

rgbToHex(255, 99, 71)  // => "#FF6347"
\`\`\`

### HEX to RGB

\`\`\`javascript
function hexToRgb(hex) {
  const clean = hex.replace("#", "")
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  }
}

hexToRgb("#FF6347")  // => { r: 255, g: 99, b: 71 }
\`\`\`

### RGB to HSL

\`\`\`javascript
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

rgbToHsl(255, 99, 71)  // => { h: 9, s: 100, l: 64 }
\`\`\`

---

## Other Color Formats

### OKLCH and OKLAB

Modern CSS Color Level 4 introduces perceptually uniform color spaces. OKLCH is increasingly popular because it more accurately represents how humans perceive differences between colors:

\`\`\`css
color: oklch(62.7% 0.258 29.2);   /* Tomato */
\`\`\`

The perceptual uniformity means that equal mathematical steps in OKLCH correspond to equal perceptual steps in color difference — which is not true for RGB or HSL.

### CMYK

CMYK (Cyan, Magenta, Yellow, Key/Black) is used in print. RGB is additive (mixing colors produces white); CMYK is subtractive (mixing inks produces black). Web browsers do not use CMYK natively, but design tools that target print use it.

### Named CSS Colors

CSS defines 140+ named colors: \`red\`, \`blue\`, \`tomato\`, \`steelblue\`, \`peachpuff\`, etc. These are exact HEX values with human-readable names. Use them for clarity in code where the specific shade is not critical.

---

## Color Contrast and Accessibility

The Web Content Accessibility Guidelines (WCAG) define minimum contrast ratios for text readability:

| Level | Normal text | Large text |
|-------|------------|------------|
| AA (minimum) | 4.5:1 | 3:1 |
| AAA (enhanced) | 7:1 | 4.5:1 |

Contrast ratio is computed from relative luminance, which is derived from the linear RGB values. Tools and browser developer tools can compute this for you. When picking colors, always check contrast ratios for text.

---

## Convert Colors Instantly

Switching between HEX, RGB, HSL, and other formats by hand is tedious and error-prone. The Color Converter on utils.live converts between all common color formats instantly — paste any color value and get the equivalent in every format.
`,
};
