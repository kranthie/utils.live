# TOML Tools

Tools for working with TOML (Tom's Obvious, Minimal Language) data, a popular configuration file format. Includes formatting, validation, and conversion to other formats.

## Available Tools

| Tool            | Description                        |
| --------------- | ---------------------------------- |
| `tomlFormatter` | Format and prettify TOML           |
| `tomlValidator` | Validate TOML syntax and structure |
| `tomlToJson`    | Convert TOML to JSON format        |
| `tomlToYaml`    | Convert TOML to YAML format        |

## Usage

```typescript
import {
  tomlFormatter,
  tomlValidator,
  tomlToJson,
  tomlToYaml,
} from "@utils-live/tools";
import { executeTool } from "@utils-live/tools";

// Format TOML
const formatted = executeTool(tomlFormatter, {
  input: `
[package]
name = "my-project"
version = "1.0.0"

[dependencies]
serde = "1.0"
tokio = { version = "1.0", features = ["full"] }
`,
});
console.log(formatted.output);

// Validate TOML
const validation = executeTool(tomlValidator, {
  input: `
[database]
server = "192.168.1.1"
ports = [ 8001, 8002, 8003 ]
enabled = true
`,
});
console.log(validation.valid); // true

// Convert TOML to JSON
const json = executeTool(tomlToJson, {
  input: `
[server]
host = "localhost"
port = 8080

[server.ssl]
enabled = true
cert = "/path/to/cert"
`,
});
console.log(json.output);
// Output: {"server":{"host":"localhost","port":8080,"ssl":{"enabled":true,"cert":"/path/to/cert"}}}

// Convert TOML to YAML
const yaml = executeTool(tomlToYaml, {
  input: `
[package]
name = "example"
version = "0.1.0"
`,
});
console.log(yaml.output);
// Output:
// package:
//   name: example
//   version: 0.1.0
```

## TOML Basics

TOML is designed to be a minimal configuration file format. Key features:

### Key-Value Pairs

```toml
string = "Hello, World!"
integer = 42
float = 3.14
boolean = true
datetime = 2024-01-15T10:30:00Z
```

### Tables (Sections)

```toml
[database]
host = "localhost"
port = 5432

[database.connection]
timeout = 30
```

### Arrays

```toml
ports = [8001, 8002, 8003]
contributors = ["Alice", "Bob", "Charlie"]
```

### Inline Tables

```toml
point = { x = 1, y = 2 }
```

### Array of Tables

```toml
[[products]]
name = "Hammer"
price = 9.99

[[products]]
name = "Nail"
price = 0.05
```

## Common Use Cases

TOML is commonly used for:

- **Rust projects**: `Cargo.toml` for package configuration
- **Python projects**: `pyproject.toml` for project metadata
- **Configuration files**: Application settings and preferences
- **Build tools**: Build system configuration

## Related Categories

- [JSON Tools](../json/README.md) - Convert between TOML and JSON
- [YAML Tools](../yaml/README.md) - Convert between TOML and YAML
- [Data Tools](../data/README.md) - INI and other configuration formats
