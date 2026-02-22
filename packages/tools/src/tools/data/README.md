# Data Tools

Tools for working with miscellaneous data formats, including INI configuration files and cross-format conversions. This category covers formats not covered by dedicated tool categories.

## Available Tools

| Tool           | Description                                 |
| -------------- | ------------------------------------------- |
| `iniFormatter` | Format and prettify INI configuration files |
| `iniValidator` | Validate INI syntax and structure           |
| `iniToJson`    | Convert INI to JSON format                  |
| `jsonToToml`   | Convert JSON to TOML format                 |
| `jsonToIni`    | Convert JSON to INI format                  |

## Usage

```typescript
import {
  iniFormatter,
  iniToJson,
  jsonToIni,
  jsonToToml,
} from "@utils-live/tools";
import { executeTool } from "@utils-live/tools";

// Format INI file
const formatted = executeTool(iniFormatter, {
  input: `
[database]
host=localhost
port=5432
user=admin

[cache]
enabled=true
ttl=3600
`,
});
console.log(formatted.output);

// Convert INI to JSON
const json = executeTool(iniToJson, {
  input: `
[server]
host = 127.0.0.1
port = 8080

[logging]
level = debug
file = /var/log/app.log
`,
});
console.log(json.output);
// Output: {"server":{"host":"127.0.0.1","port":"8080"},"logging":{"level":"debug","file":"/var/log/app.log"}}

// Convert JSON to INI
const ini = executeTool(jsonToIni, {
  input: JSON.stringify({
    database: {
      host: "localhost",
      port: 3306,
    },
    app: {
      name: "MyApp",
      debug: true,
    },
  }),
});
console.log(ini.output);
// Output:
// [database]
// host=localhost
// port=3306
//
// [app]
// name=MyApp
// debug=true

// Convert JSON to TOML
const toml = executeTool(jsonToToml, {
  input: JSON.stringify({
    package: {
      name: "my-project",
      version: "1.0.0",
    },
    dependencies: {
      lodash: "4.17.21",
    },
  }),
});
console.log(toml.output);
```

## INI Format Basics

INI files are simple configuration files with sections and key-value pairs:

```ini
; This is a comment
# This is also a comment

[section]
key = value
another_key = another value

[database]
host = localhost
port = 5432
enabled = true
```

### Key Features

- **Sections**: Enclosed in square brackets `[section_name]`
- **Key-Value Pairs**: `key = value` or `key=value`
- **Comments**: Lines starting with `;` or `#`
- **No nesting**: INI files are flat (single level of sections)

## Format Conversions

### INI to JSON Mapping

INI sections become JSON object keys:

```ini
[database]
host = localhost
port = 5432
```

Converts to:

```json
{
  "database": {
    "host": "localhost",
    "port": "5432"
  }
}
```

### JSON to INI Limitations

- Only one level of nesting supported (nested objects become sections)
- Arrays are serialized as JSON strings
- Complex nested structures may lose fidelity

### JSON to TOML

JSON objects convert naturally to TOML tables:

```json
{
  "server": {
    "host": "localhost",
    "port": 8080
  }
}
```

Converts to:

```toml
[server]
host = "localhost"
port = 8080
```

## Common Use Cases

INI files are commonly used for:

- **Windows configuration**: `.ini` files for application settings
- **PHP configuration**: `php.ini` for PHP settings
- **Git configuration**: `.gitconfig` files
- **Desktop entries**: `.desktop` files on Linux
- **Legacy applications**: Many older applications use INI format

## Related Categories

- [JSON Tools](../json/README.md) - JSON formatting and conversion
- [YAML Tools](../yaml/README.md) - YAML configuration format
- [TOML Tools](../toml/README.md) - TOML configuration format
- [XML Tools](../xml/README.md) - XML configuration format
