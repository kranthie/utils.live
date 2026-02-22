import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import {
  mermaidRenderer,
  mermaidEditor,
  plantumlAnalyzer,
  graphvizAnalyzer,
  sequenceDiagramEditor,
  flowchartEditor,
  erDiagramEditor,
  ganttChartEditor,
  mindMapEditor,
  asciiDiagram,
  qrCodeGenerator,
  qrWithLogo,
  styledQrCode,
  wifiQrCode,
  vcardQrCode,
  urlQrCode,
  bulkQrGenerator,
  code128Generator,
  code39Generator,
  ean13Generator,
  ean8Generator,
  upcAGenerator,
  upcEGenerator,
  itfGenerator,
  pdf417Info,
  dataMatrixInfo,
  lineChartGenerator,
  barChartGenerator,
  pieChartGenerator,
  scatterPlotGenerator,
  areaChartGenerator,
  radarChartGenerator,
  sparklineGenerator,
  jsonToChart,
} from "../../../src/tools/diagram";

// ─── Diagram Rendering ───────────────────────────────────────────────

describe("Mermaid Renderer", () => {
  it("should have correct metadata", () => {
    expect(mermaidRenderer.meta.id).toBe("diagram/mermaid-renderer");
    expect(mermaidRenderer.meta.category).toBe("diagram");
  });

  it("should render valid mermaid flowchart syntax", async () => {
    const result = await executeTool(mermaidRenderer, {
      input: "graph TD\n  A --> B",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "graph TD"
      );
    }
  });

  it("should render valid sequenceDiagram syntax", async () => {
    const result = await executeTool(mermaidRenderer, {
      input: "sequenceDiagram\n  Alice->>Bob: Hello",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "sequenceDiagram"
      );
    }
  });

  it("should reject invalid mermaid syntax", async () => {
    const result = await executeTool(mermaidRenderer, {
      input: "this is not mermaid syntax",
    });
    expect(result.success).toBe(false);
  });

  it("should reject empty input", async () => {
    const result = await executeTool(mermaidRenderer, { input: "   " });
    expect(result.success).toBe(false);
  });
});

describe("Mermaid Editor", () => {
  it("should have correct metadata", () => {
    expect(mermaidEditor.meta.id).toBe("diagram/mermaid-editor");
    expect(mermaidEditor.meta.category).toBe("diagram");
  });

  it("should process valid mermaid input", async () => {
    const result = await executeTool(mermaidEditor, {
      input: "graph TD\n  A --> B",
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty input", async () => {
    const result = await executeTool(mermaidEditor, { input: "   " });
    expect(result.success).toBe(false);
  });
});

describe("PlantUML Renderer", () => {
  it("should have correct metadata", () => {
    expect(plantumlAnalyzer.meta.id).toBe("diagram/plantuml-analyzer");
    expect(plantumlAnalyzer.meta.category).toBe("diagram");
  });

  it("should process valid PlantUML input", async () => {
    const result = await executeTool(plantumlAnalyzer, {
      input: "@startuml\nAlice -> Bob: Hello\n@enduml",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toBeDefined();
    }
  });

  it("should reject empty input", async () => {
    const result = await executeTool(plantumlAnalyzer, { input: "   " });
    expect(result.success).toBe(false);
  });
});

describe("Graphviz Renderer", () => {
  it("should have correct metadata", () => {
    expect(graphvizAnalyzer.meta.id).toBe("diagram/graphviz-analyzer");
    expect(graphvizAnalyzer.meta.category).toBe("diagram");
  });

  it("should process valid DOT language", async () => {
    const result = await executeTool(graphvizAnalyzer, {
      input: "digraph { A -> B; B -> C; }",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toBeDefined();
    }
  });

  it("should reject empty input", async () => {
    const result = await executeTool(graphvizAnalyzer, { input: "  " });
    expect(result.success).toBe(false);
  });
});

describe("Sequence Diagram Editor", () => {
  it("should have correct metadata", () => {
    expect(sequenceDiagramEditor.meta.id).toBe(
      "diagram/sequence-diagram-editor"
    );
    expect(sequenceDiagramEditor.meta.category).toBe("diagram");
  });

  it("should generate mermaid sequence diagram syntax", async () => {
    const result = await executeTool(sequenceDiagramEditor, {
      participants: [
        { name: "Alice", type: "participant" },
        { name: "Bob", type: "actor" },
      ],
      messages: [{ from: "Alice", to: "Bob", text: "Hello" }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "sequenceDiagram"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "Alice"
      );
      expect((result.data as Record<string, unknown>).output).toContain("Bob");
    }
  });

  it("should support autonumber", async () => {
    const result = await executeTool(sequenceDiagramEditor, {
      participants: [{ name: "A" }, { name: "B" }],
      messages: [{ from: "A", to: "B", text: "msg1" }],
      autonumber: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "autonumber"
      );
    }
  });

  it("should fail with fewer than 2 participants", async () => {
    const result = await executeTool(sequenceDiagramEditor, {
      participants: [{ name: "Alice" }],
      messages: [{ from: "Alice", to: "Bob", text: "Hello" }],
    });
    expect(result.success).toBe(false);
  });
});

describe("Flowchart Editor", () => {
  it("should have correct metadata", () => {
    expect(flowchartEditor.meta.id).toBe("diagram/flowchart-editor");
    expect(flowchartEditor.meta.category).toBe("diagram");
  });

  it("should generate mermaid flowchart syntax", async () => {
    const result = await executeTool(flowchartEditor, {
      nodes: [
        { id: "A", label: "Start", shape: "rounded" },
        { id: "B", label: "End", shape: "rectangle" },
      ],
      edges: [{ from: "A", to: "B" }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "flowchart"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "Start"
      );
      expect((result.data as Record<string, unknown>).output).toContain("End");
    }
  });

  it("should support different directions", async () => {
    const result = await executeTool(flowchartEditor, {
      direction: "LR",
      nodes: [{ id: "A", label: "Node A" }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("LR");
    }
  });
});

describe("ER Diagram Editor", () => {
  it("should have correct metadata", () => {
    expect(erDiagramEditor.meta.id).toBe("diagram/er-diagram-editor");
    expect(erDiagramEditor.meta.category).toBe("diagram");
  });

  it("should generate mermaid ER diagram syntax", async () => {
    const result = await executeTool(erDiagramEditor, {
      entities: [
        {
          name: "User",
          attributes: [
            { type: "int", name: "id", key: "PK" },
            { type: "string", name: "name" },
          ],
        },
        {
          name: "Order",
          attributes: [
            { type: "int", name: "id", key: "PK" },
            { type: "int", name: "user_id", key: "FK" },
          ],
        },
      ],
      relationships: [
        {
          from: "User",
          to: "Order",
          fromCardinality: "||",
          toCardinality: "}o",
          label: "places",
        },
      ],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "erDiagram"
      );
      expect((result.data as Record<string, unknown>).output).toContain("User");
      expect((result.data as Record<string, unknown>).output).toContain(
        "Order"
      );
    }
  });

  it("should handle entities with no attributes", async () => {
    const result = await executeTool(erDiagramEditor, {
      entities: [{ name: "Simple" }],
    });
    expect(result.success).toBe(true);
  });
});

describe("Gantt Chart Editor", () => {
  it("should have correct metadata", () => {
    expect(ganttChartEditor.meta.id).toBe("diagram/gantt-chart-editor");
    expect(ganttChartEditor.meta.category).toBe("diagram");
  });

  it("should generate mermaid gantt chart syntax", async () => {
    const result = await executeTool(ganttChartEditor, {
      title: "My Project",
      sections: [
        {
          name: "Phase 1",
          tasks: [
            { name: "Design", start: "2024-01-01", duration: "5d" },
            {
              name: "Implement",
              start: "2024-01-06",
              duration: "10d",
              status: "active",
            },
          ],
        },
      ],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "gantt"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "My Project"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "Design"
      );
    }
  });

  it("should require at least one section", async () => {
    const result = await executeTool(ganttChartEditor, {
      sections: [],
    });
    expect(result.success).toBe(false);
  });
});

describe("Mind Map Editor", () => {
  it("should have correct metadata", () => {
    expect(mindMapEditor.meta.id).toBe("diagram/mind-map-editor");
    expect(mindMapEditor.meta.category).toBe("diagram");
  });

  it("should generate mermaid mindmap syntax", async () => {
    const result = await executeTool(mindMapEditor, {
      root: {
        text: "Central Topic",
        children: [
          { text: "Branch 1" },
          { text: "Branch 2", children: [{ text: "Leaf" }] },
        ],
      },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "mindmap"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "Central Topic"
      );
    }
  });

  it("should handle root node with no children", async () => {
    const result = await executeTool(mindMapEditor, {
      root: { text: "Alone" },
    });
    expect(result.success).toBe(true);
  });
});

describe("ASCII Diagram", () => {
  it("should have correct metadata", () => {
    expect(asciiDiagram.meta.id).toBe("diagram/ascii-diagram");
    expect(asciiDiagram.meta.category).toBe("diagram");
  });

  it("should generate box diagram", async () => {
    const result = await executeTool(asciiDiagram, {
      type: "box",
      items: ["Start", "Process", "End"],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("+");
      expect((result.data as Record<string, unknown>).output).toContain(
        "Start"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "Process"
      );
    }
  });

  it("should generate table diagram", async () => {
    const result = await executeTool(asciiDiagram, {
      type: "table",
      items: ["Row 1", "Row 2"],
      title: "My Table",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "Row 1"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "My Table"
      );
    }
  });

  it("should generate tree diagram", async () => {
    const result = await executeTool(asciiDiagram, {
      type: "tree",
      items: ["Root", "Child 1", "Child 2"],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("Root");
      expect((result.data as Record<string, unknown>).output).toContain("\\--");
    }
  });

  it("should generate flow diagram", async () => {
    const result = await executeTool(asciiDiagram, {
      type: "flow",
      items: ["A", "B"],
      connections: [{ from: 0, to: 1 }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("A");
      expect((result.data as Record<string, unknown>).output).toContain("B");
    }
  });

  it("should fail with empty items", async () => {
    const result = await executeTool(asciiDiagram, {
      type: "box",
      items: [],
    });
    expect(result.success).toBe(false);
  });
});

// ─── QR Codes ────────────────────────────────────────────────────────

describe("QR Code Generator", () => {
  it("should have correct metadata", () => {
    expect(qrCodeGenerator.meta.id).toBe("diagram/qr-code-generator");
    expect(qrCodeGenerator.meta.category).toBe("diagram");
  });

  it("should generate QR code SVG from text", async () => {
    const result = await executeTool(qrCodeGenerator, {
      text: "Hello World",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("<svg");
      expect((result.data as Record<string, unknown>).output).toContain(
        "</svg>"
      );
    }
  });

  it("should generate QR code from URL", async () => {
    const result = await executeTool(qrCodeGenerator, {
      text: "https://example.com",
      size: 300,
      errorCorrection: "H",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("<svg");
    }
  });

  it("should return empty output for empty text", async () => {
    const result = await executeTool(qrCodeGenerator, { text: "" });
    expect(result.success).toBe(true);
    expect((result.data as Record<string, unknown>).output).toBe("");
  });
});

describe("QR With Logo", () => {
  it("should have correct metadata", () => {
    expect(qrWithLogo.meta.id).toBe("diagram/qr-with-logo");
    expect(qrWithLogo.meta.category).toBe("diagram");
  });

  it("should generate QR code with logo placeholder", async () => {
    const result = await executeTool(qrWithLogo, {
      text: "https://example.com",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("<svg");
    }
  });

  it("should fail with empty text", async () => {
    const result = await executeTool(qrWithLogo, { text: "" });
    expect(result.success).toBe(false);
  });
});

describe("Styled QR Code", () => {
  it("should have correct metadata", () => {
    expect(styledQrCode.meta.id).toBe("diagram/styled-qr-code");
    expect(styledQrCode.meta.category).toBe("diagram");
  });

  it("should generate styled QR code with options", async () => {
    const result = await executeTool(styledQrCode, {
      text: "Test data",
      moduleShape: "dots",
      finderShape: "rounded",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("<svg");
    }
  });

  it("should fail with empty text", async () => {
    const result = await executeTool(styledQrCode, { text: "" });
    expect(result.success).toBe(false);
  });
});

describe("WiFi QR Code", () => {
  it("should have correct metadata", () => {
    expect(wifiQrCode.meta.id).toBe("diagram/wifi-qr-code");
    expect(wifiQrCode.meta.category).toBe("diagram");
  });

  it("should generate WiFi QR code SVG", async () => {
    const result = await executeTool(wifiQrCode, {
      ssid: "MyNetwork",
      password: "secret123",
      encryption: "WPA",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("<svg");
      expect((result.data as Record<string, unknown>).output).toContain(
        "</svg>"
      );
    }
  });

  it("should generate QR for open network (nopass)", async () => {
    const result = await executeTool(wifiQrCode, {
      ssid: "OpenNet",
      encryption: "nopass",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("<svg");
    }
  });

  it("should fail with empty ssid", async () => {
    const result = await executeTool(wifiQrCode, { ssid: "" });
    expect(result.success).toBe(false);
  });
});

describe("vCard QR Code", () => {
  it("should have correct metadata", () => {
    expect(vcardQrCode.meta.id).toBe("diagram/vcard-qr-code");
    expect(vcardQrCode.meta.category).toBe("diagram");
  });

  it("should generate vCard QR code SVG", async () => {
    const result = await executeTool(vcardQrCode, {
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      phone: "+1234567890",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("<svg");
      expect((result.data as Record<string, unknown>).output).toContain(
        "</svg>"
      );
    }
  });

  it("should handle minimal vCard (first name only)", async () => {
    const result = await executeTool(vcardQrCode, {
      firstName: "Alice",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("<svg");
    }
  });

  it("should fail with empty firstName", async () => {
    const result = await executeTool(vcardQrCode, { firstName: "" });
    expect(result.success).toBe(false);
  });
});

describe("URL QR Code", () => {
  it("should have correct metadata", () => {
    expect(urlQrCode.meta.id).toBe("diagram/url-qr-code");
    expect(urlQrCode.meta.category).toBe("diagram");
  });

  it("should generate URL QR code SVG", async () => {
    const result = await executeTool(urlQrCode, {
      url: "https://example.com",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("<svg");
      expect((result.data as Record<string, unknown>).output).toContain(
        "</svg>"
      );
    }
  });

  it("should handle URL with label", async () => {
    const result = await executeTool(urlQrCode, {
      url: "https://example.com",
      label: "My Website",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("<svg");
    }
  });

  it("should fail with empty URL", async () => {
    const result = await executeTool(urlQrCode, { url: "" });
    expect(result.success).toBe(false);
  });
});

describe("Bulk QR Generator", () => {
  it("should have correct metadata", () => {
    expect(bulkQrGenerator.meta.id).toBe("diagram/bulk-qr-generator");
    expect(bulkQrGenerator.meta.category).toBe("diagram");
  });

  it("should generate multiple QR codes as SVGs", async () => {
    const result = await executeTool(bulkQrGenerator, {
      items: [
        { text: "Item 1", label: "First" },
        { text: "Item 2", label: "Second" },
      ],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("<svg");
      expect((result.data as Record<string, unknown>).output).toContain(
        "First"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "Second"
      );
    }
  });

  it("should handle single item", async () => {
    const result = await executeTool(bulkQrGenerator, {
      items: [{ text: "Single item" }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("<svg");
    }
  });

  it("should fail with empty items array", async () => {
    const result = await executeTool(bulkQrGenerator, { items: [] });
    expect(result.success).toBe(false);
  });
});

// ─── Barcodes ────────────────────────────────────────────────────────

describe("Code 128 Generator", () => {
  it("should have correct metadata", () => {
    expect(code128Generator.meta.id).toBe("diagram/code128-generator");
    expect(code128Generator.meta.category).toBe("diagram");
  });

  it("should generate Code 128 barcode SVG", async () => {
    const result = await executeTool(code128Generator, {
      text: "ABC-12345",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("<svg");
    }
  });

  it("should support hiding text", async () => {
    const result = await executeTool(code128Generator, {
      text: "Test",
      showText: false,
    });
    expect(result.success).toBe(true);
  });

  it("should fail with empty text", async () => {
    const result = await executeTool(code128Generator, { text: "" });
    expect(result.success).toBe(false);
  });
});

describe("Code 39 Generator", () => {
  it("should have correct metadata", () => {
    expect(code39Generator.meta.id).toBe("diagram/code39-generator");
    expect(code39Generator.meta.category).toBe("diagram");
  });

  it("should generate Code 39 barcode SVG", async () => {
    const result = await executeTool(code39Generator, {
      text: "HELLO",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("<svg");
    }
  });

  it("should fail with empty text", async () => {
    const result = await executeTool(code39Generator, { text: "" });
    expect(result.success).toBe(false);
  });
});

describe("EAN-13 Generator", () => {
  it("should have correct metadata", () => {
    expect(ean13Generator.meta.id).toBe("diagram/ean13-generator");
    expect(ean13Generator.meta.category).toBe("diagram");
  });

  it("should generate EAN-13 barcode from 12 digits", async () => {
    const result = await executeTool(ean13Generator, {
      digits: "590123456789",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("<svg");
    }
  });

  it("should accept 13 digits with valid check digit", async () => {
    // Check digit for 590123456789 is 3
    const result = await executeTool(ean13Generator, {
      digits: "5901234567893",
    });
    expect(result.success).toBe(true);
  });

  it("should reject 13 digits with invalid check digit", async () => {
    const result = await executeTool(ean13Generator, {
      digits: "5901234567890",
    });
    expect(result.success).toBe(false);
  });

  it("should fail with non-numeric input", async () => {
    const result = await executeTool(ean13Generator, { digits: "abc" });
    expect(result.success).toBe(false);
  });
});

describe("EAN-8 Generator", () => {
  it("should have correct metadata", () => {
    expect(ean8Generator.meta.id).toBe("diagram/ean8-generator");
    expect(ean8Generator.meta.category).toBe("diagram");
  });

  it("should generate EAN-8 barcode from 7 digits", async () => {
    const result = await executeTool(ean8Generator, {
      digits: "1234567",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("<svg");
    }
  });

  it("should fail with wrong digit count", async () => {
    const result = await executeTool(ean8Generator, { digits: "123" });
    expect(result.success).toBe(false);
  });
});

describe("UPC-A Generator", () => {
  it("should have correct metadata", () => {
    expect(upcAGenerator.meta.id).toBe("diagram/upc-a-generator");
    expect(upcAGenerator.meta.category).toBe("diagram");
  });

  it("should generate UPC-A barcode from 11 digits", async () => {
    const result = await executeTool(upcAGenerator, {
      digits: "01234567890",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("<svg");
    }
  });

  it("should fail with wrong digit count", async () => {
    const result = await executeTool(upcAGenerator, { digits: "123" });
    expect(result.success).toBe(false);
  });
});

describe("UPC-E Generator", () => {
  it("should have correct metadata", () => {
    expect(upcEGenerator.meta.id).toBe("diagram/upc-e-generator");
    expect(upcEGenerator.meta.category).toBe("diagram");
  });

  it("should generate UPC-E barcode from 6 digits", async () => {
    const result = await executeTool(upcEGenerator, {
      digits: "123456",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("<svg");
    }
  });

  it("should fail with wrong digit count", async () => {
    const result = await executeTool(upcEGenerator, { digits: "12" });
    expect(result.success).toBe(false);
  });
});

describe("ITF Generator", () => {
  it("should have correct metadata", () => {
    expect(itfGenerator.meta.id).toBe("diagram/itf-generator");
    expect(itfGenerator.meta.category).toBe("diagram");
  });

  it("should generate ITF barcode from even digit count", async () => {
    const result = await executeTool(itfGenerator, {
      digits: "1234567890",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("<svg");
    }
  });

  it("should support addCheckDigit for odd digit count", async () => {
    const result = await executeTool(itfGenerator, {
      digits: "12345",
      addCheckDigit: true,
    });
    expect(result.success).toBe(true);
  });

  it("should fail with non-numeric input", async () => {
    const result = await executeTool(itfGenerator, { digits: "abc" });
    expect(result.success).toBe(false);
  });
});

describe("PDF417 Generator", () => {
  it("should have correct metadata", () => {
    expect(pdf417Info.meta.id).toBe("diagram/pdf417-info");
    expect(pdf417Info.meta.category).toBe("diagram");
  });

  it("should generate PDF417 barcode info", async () => {
    const result = await executeTool(pdf417Info, {
      input: "Hello PDF417",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toBeDefined();
    }
  });

  it("should fail with empty input", async () => {
    const result = await executeTool(pdf417Info, { input: "" });
    expect(result.success).toBe(false);
  });
});

describe("Data Matrix Generator", () => {
  it("should have correct metadata", () => {
    expect(dataMatrixInfo.meta.id).toBe("diagram/data-matrix-info");
    expect(dataMatrixInfo.meta.category).toBe("diagram");
  });

  it("should generate Data Matrix barcode info", async () => {
    const result = await executeTool(dataMatrixInfo, {
      input: "Test Data Matrix",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toBeDefined();
    }
  });

  it("should fail with empty input", async () => {
    const result = await executeTool(dataMatrixInfo, { input: "" });
    expect(result.success).toBe(false);
  });
});

// ─── Charts & Graphs ────────────────────────────────────────────────

describe("Line Chart Generator", () => {
  it("should have correct metadata", () => {
    expect(lineChartGenerator.meta.id).toBe("diagram/line-chart-generator");
    expect(lineChartGenerator.meta.category).toBe("diagram");
  });

  it("should generate line chart", async () => {
    const result = await executeTool(lineChartGenerator, {
      series: [{ name: "Sales", data: [10, 20, 30, 40] }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toBeDefined();
    }
  });

  it("should support multiple series", async () => {
    const result = await executeTool(lineChartGenerator, {
      series: [
        { name: "A", data: [1, 2, 3] },
        { name: "B", data: [3, 2, 1] },
      ],
      labels: ["Jan", "Feb", "Mar"],
    });
    expect(result.success).toBe(true);
  });

  it("should fail with empty series", async () => {
    const result = await executeTool(lineChartGenerator, { series: [] });
    expect(result.success).toBe(false);
  });
});

describe("Bar Chart Generator", () => {
  it("should have correct metadata", () => {
    expect(barChartGenerator.meta.id).toBe("diagram/bar-chart-generator");
    expect(barChartGenerator.meta.category).toBe("diagram");
  });

  it("should generate bar chart", async () => {
    const result = await executeTool(barChartGenerator, {
      labels: ["A", "B", "C"],
      data: [10, 20, 30],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toBeDefined();
    }
  });

  it("should fail with mismatched labels and data", async () => {
    const result = await executeTool(barChartGenerator, {
      labels: ["A", "B"],
      data: [10, 20, 30],
    });
    expect(result.success).toBe(false);
  });
});

describe("Pie Chart Generator", () => {
  it("should have correct metadata", () => {
    expect(pieChartGenerator.meta.id).toBe("diagram/pie-chart-generator");
    expect(pieChartGenerator.meta.category).toBe("diagram");
  });

  it("should generate pie chart SVG", async () => {
    const result = await executeTool(pieChartGenerator, {
      segments: [
        { label: "A", value: 30 },
        { label: "B", value: 70 },
      ],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("<svg");
      expect((result.data as Record<string, unknown>).output).toContain(
        "</svg>"
      );
    }
  });

  it("should generate donut chart", async () => {
    const result = await executeTool(pieChartGenerator, {
      segments: [{ label: "Only", value: 100 }],
      donut: true,
    });
    expect(result.success).toBe(true);
  });

  it("should throw on zero total value", async () => {
    const result = await executeTool(pieChartGenerator, {
      segments: [{ label: "Zero", value: 0 }],
    });
    expect(result.success).toBe(false);
  });

  it("should fail with empty segments", async () => {
    const result = await executeTool(pieChartGenerator, { segments: [] });
    expect(result.success).toBe(false);
  });
});

describe("Scatter Plot Generator", () => {
  it("should have correct metadata", () => {
    expect(scatterPlotGenerator.meta.id).toBe("diagram/scatter-plot-generator");
    expect(scatterPlotGenerator.meta.category).toBe("diagram");
  });

  it("should generate scatter plot SVG", async () => {
    const result = await executeTool(scatterPlotGenerator, {
      points: [
        { x: 1, y: 2 },
        { x: 3, y: 4 },
        { x: 5, y: 1 },
      ],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("<svg");
    }
  });

  it("should support labeled points", async () => {
    const result = await executeTool(scatterPlotGenerator, {
      points: [{ x: 10, y: 20, label: "Point A" }],
    });
    expect(result.success).toBe(true);
  });

  it("should fail with empty points", async () => {
    const result = await executeTool(scatterPlotGenerator, { points: [] });
    expect(result.success).toBe(false);
  });
});

describe("Area Chart Generator", () => {
  it("should have correct metadata", () => {
    expect(areaChartGenerator.meta.id).toBe("diagram/area-chart-generator");
    expect(areaChartGenerator.meta.category).toBe("diagram");
  });

  it("should generate area chart SVG", async () => {
    const result = await executeTool(areaChartGenerator, {
      series: [{ name: "Revenue", data: [10, 30, 20, 40, 50] }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("<svg");
    }
  });

  it("should support stacked area chart", async () => {
    const result = await executeTool(areaChartGenerator, {
      series: [
        { name: "A", data: [10, 20, 30] },
        { name: "B", data: [5, 15, 25] },
      ],
      stacked: true,
    });
    expect(result.success).toBe(true);
  });

  it("should fail with empty series", async () => {
    const result = await executeTool(areaChartGenerator, { series: [] });
    expect(result.success).toBe(false);
  });
});

describe("Radar Chart Generator", () => {
  it("should have correct metadata", () => {
    expect(radarChartGenerator.meta.id).toBe("diagram/radar-chart-generator");
    expect(radarChartGenerator.meta.category).toBe("diagram");
  });

  it("should generate radar chart SVG", async () => {
    const result = await executeTool(radarChartGenerator, {
      axes: ["Speed", "Power", "Range", "Defense", "Health"],
      series: [{ name: "Player", values: [80, 60, 70, 90, 50] }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("<svg");
    }
  });

  it("should support multiple series", async () => {
    const result = await executeTool(radarChartGenerator, {
      axes: ["A", "B", "C"],
      series: [
        { name: "S1", values: [50, 60, 70] },
        { name: "S2", values: [70, 50, 60] },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("should fail with fewer than 3 axes", async () => {
    const result = await executeTool(radarChartGenerator, {
      axes: ["A", "B"],
      series: [{ name: "S", values: [50, 60] }],
    });
    expect(result.success).toBe(false);
  });
});

describe("Sparkline Generator", () => {
  it("should have correct metadata", () => {
    expect(sparklineGenerator.meta.id).toBe("diagram/sparkline-generator");
    expect(sparklineGenerator.meta.category).toBe("diagram");
  });

  it("should generate sparkline SVG", async () => {
    const result = await executeTool(sparklineGenerator, {
      data: [1, 3, 2, 5, 4, 7, 6],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("<svg");
    }
  });

  it("should support fill color and dots", async () => {
    const result = await executeTool(sparklineGenerator, {
      data: [10, 20, 15, 25],
      fillColor: "#eee",
      showDots: true,
      showMinMax: true,
    });
    expect(result.success).toBe(true);
  });

  it("should fail with fewer than 2 data points", async () => {
    const result = await executeTool(sparklineGenerator, { data: [1] });
    expect(result.success).toBe(false);
  });
});

describe("JSON to Chart", () => {
  it("should have correct metadata", () => {
    expect(jsonToChart.meta.id).toBe("diagram/json-to-chart");
    expect(jsonToChart.meta.category).toBe("diagram");
  });

  it("should convert JSON array to bar chart", async () => {
    const data = JSON.stringify([
      { name: "A", value: 10 },
      { name: "B", value: 20 },
      { name: "C", value: 30 },
    ]);
    const result = await executeTool(
      jsonToChart,
      { input: data },
      { chartType: "bar" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toBeDefined();
    }
  });

  it("should handle invalid JSON gracefully", async () => {
    const result = await executeTool(jsonToChart, { input: "not json" });
    expect(result.success).toBe(false);
  });
});
