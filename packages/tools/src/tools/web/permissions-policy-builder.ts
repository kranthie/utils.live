import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  camera: z
    .enum(["*", "self", "none"])
    .default("none")
    .describe("Camera access"),
  microphone: z
    .enum(["*", "self", "none"])
    .default("none")
    .describe("Microphone access"),
  geolocation: z
    .enum(["*", "self", "none"])
    .default("none")
    .describe("Geolocation access"),
  fullscreen: z
    .enum(["*", "self", "none"])
    .default("self")
    .describe("Fullscreen API"),
  payment: z
    .enum(["*", "self", "none"])
    .default("none")
    .describe("Payment API"),
  accelerometer: z
    .enum(["*", "self", "none"])
    .default("none")
    .describe("Accelerometer access"),
  gyroscope: z
    .enum(["*", "self", "none"])
    .default("none")
    .describe("Gyroscope access"),
  magnetometer: z
    .enum(["*", "self", "none"])
    .default("none")
    .describe("Magnetometer access"),
  usb: z.enum(["*", "self", "none"]).default("none").describe("USB access"),
  autoplay: z
    .enum(["*", "self", "none"])
    .default("self")
    .describe("Autoplay media"),
  pictureInPicture: z
    .enum(["*", "self", "none"])
    .default("self")
    .describe("Picture-in-Picture"),
  displayCapture: z
    .enum(["*", "self", "none"])
    .default("none")
    .describe("Display capture"),
});

const outputSchema = z.object({
  output: z.string().describe("Generated Permissions-Policy header"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function formatValue(value: string): string {
  switch (value) {
    case "*":
      return "*";
    case "self":
      return "self";
    case "none":
      return "()";
    default:
      return "()";
  }
}

function execute(input: Input): Output {
  const features: Record<string, string> = {
    camera: input.camera,
    microphone: input.microphone,
    geolocation: input.geolocation,
    fullscreen: input.fullscreen,
    payment: input.payment,
    accelerometer: input.accelerometer,
    gyroscope: input.gyroscope,
    magnetometer: input.magnetometer,
    usb: input.usb,
    autoplay: input.autoplay,
    "picture-in-picture": input.pictureInPicture,
    "display-capture": input.displayCapture,
  };

  const directives: string[] = [];
  for (const [feature, value] of Object.entries(features)) {
    const formatted = formatValue(value);
    directives.push(`${feature}=${formatted}`);
  }

  const header = directives.join(", ");

  const lines = [
    `# Permissions-Policy Header`,
    ``,
    `Permissions-Policy: ${header}`,
    ``,
    `# Apache (.htaccess)`,
    `Header always set Permissions-Policy "${header}"`,
    ``,
    `# Nginx`,
    `add_header Permissions-Policy "${header}";`,
    ``,
    `# Express.js`,
    `app.use((req, res, next) => {`,
    `  res.setHeader('Permissions-Policy', '${header}');`,
    `  next();`,
    `});`,
  ];

  return { output: lines.join("\n") };
}

export const permissionsPolicyBuilder = defineTool({
  meta: {
    id: "web/permissions-policy-builder",
    name: "Permissions Policy Builder",
    description:
      "Free online Permissions-Policy header builder — control browser feature access for camera, microphone, geolocation, and more instantly in your browser. No data is stored. Generates header with Apache, Nginx, and Express config examples.",
    category: "web",
    subgroup: "Security",
    tier: ToolTier.CLIENT,
    keywords: [
      "permissions policy",
      "feature policy",
      "security",
      "header",
      "browser",
      "camera",
      "microphone",
      "geolocation",
      "privacy",
      "apache",
      "nginx",
    ],
    examples: [
      {
        title: "Restrictive policy disabling sensitive browser APIs",
        description:
          "Build a Permissions-Policy that disables camera, microphone, and geolocation while allowing fullscreen and autoplay for self",
        input: {
          camera: "none",
          microphone: "none",
          geolocation: "none",
          fullscreen: "self",
          payment: "none",
          accelerometer: "none",
          gyroscope: "none",
          magnetometer: "none",
          usb: "none",
          autoplay: "self",
          pictureInPicture: "self",
          displayCapture: "none",
        },
        output: `# Permissions-Policy Header\n\nPermissions-Policy: camera=(), microphone=(), geolocation=(), fullscreen=self, payment=(), accelerometer=(), gyroscope=(), magnetometer=(), usb=(), autoplay=self, picture-in-picture=self, display-capture=()\n\n# Apache (.htaccess)\nHeader always set Permissions-Policy "camera=(), microphone=(), geolocation=(), fullscreen=self, payment=(), accelerometer=(), gyroscope=(), magnetometer=(), usb=(), autoplay=self, picture-in-picture=self, display-capture=()"\n\n# Nginx\nadd_header Permissions-Policy "camera=(), microphone=(), geolocation=(), fullscreen=self, payment=(), accelerometer=(), gyroscope=(), magnetometer=(), usb=(), autoplay=self, picture-in-picture=self, display-capture=()";\n\n# Express.js\napp.use((req, res, next) => {\n  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), fullscreen=self, payment=(), accelerometer=(), gyroscope=(), magnetometer=(), usb=(), autoplay=self, picture-in-picture=self, display-capture=()');\n  next();\n});`,
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
