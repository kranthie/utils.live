import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

// Shared data for fake generators
const FIRST_NAMES = [
  "James",
  "Mary",
  "John",
  "Patricia",
  "Robert",
  "Jennifer",
  "Michael",
  "Linda",
  "William",
  "Elizabeth",
  "David",
  "Barbara",
  "Richard",
  "Susan",
  "Joseph",
  "Jessica",
  "Thomas",
  "Sarah",
  "Christopher",
  "Karen",
  "Daniel",
  "Nancy",
  "Matthew",
  "Lisa",
];

const LAST_NAMES = [
  "Smith",
  "Johnson",
  "Williams",
  "Brown",
  "Jones",
  "Garcia",
  "Miller",
  "Davis",
  "Rodriguez",
  "Martinez",
  "Hernandez",
  "Lopez",
  "Gonzalez",
  "Wilson",
  "Anderson",
  "Thomas",
  "Taylor",
  "Moore",
  "Jackson",
  "Martin",
  "Lee",
  "Thompson",
  "White",
  "Harris",
];

const STREET_NAMES = [
  "Main",
  "Oak",
  "Maple",
  "Cedar",
  "Pine",
  "Elm",
  "Washington",
  "Lake",
  "Hill",
  "Park",
  "River",
  "Forest",
  "Sunset",
  "Valley",
  "Spring",
  "Church",
];

const STREET_TYPES = [
  "Street",
  "Avenue",
  "Boulevard",
  "Drive",
  "Lane",
  "Road",
  "Way",
  "Court",
];

const CITIES = [
  "New York",
  "Los Angeles",
  "Chicago",
  "Houston",
  "Phoenix",
  "Philadelphia",
  "San Antonio",
  "San Diego",
  "Dallas",
  "Austin",
  "San Jose",
  "Jacksonville",
  "Fort Worth",
  "Columbus",
  "Charlotte",
  "Seattle",
  "Denver",
  "Boston",
];

const STATES = [
  { code: "CA", name: "California" },
  { code: "TX", name: "Texas" },
  { code: "FL", name: "Florida" },
  { code: "NY", name: "New York" },
  { code: "PA", name: "Pennsylvania" },
  { code: "IL", name: "Illinois" },
  { code: "OH", name: "Ohio" },
  { code: "GA", name: "Georgia" },
  { code: "NC", name: "North Carolina" },
  { code: "MI", name: "Michigan" },
];

const COMPANY_PREFIXES = [
  "Alpha",
  "Beta",
  "Delta",
  "Global",
  "Acme",
  "Prime",
  "Apex",
  "Summit",
  "Blue",
  "Green",
  "Tech",
  "Data",
  "Cloud",
  "Smart",
  "Fast",
  "Core",
];

const COMPANY_SUFFIXES = [
  "Corp",
  "Inc",
  "LLC",
  "Group",
  "Industries",
  "Solutions",
  "Systems",
  "Labs",
  "Technologies",
  "Enterprises",
  "Holdings",
  "Partners",
  "Services",
  "Dynamics",
];

const INDUSTRIES = [
  "Technology",
  "Healthcare",
  "Finance",
  "Manufacturing",
  "Retail",
  "Education",
  "Real Estate",
  "Energy",
  "Transportation",
  "Media",
];

function random<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// --- Fake Name Tool ---
const nameInputSchema = z.object({
  count: z.number().min(1).max(100).default(1).describe("Number of names"),
});

const nameOutputSchema = z.object({
  names: z
    .array(
      z.object({
        first: z.string(),
        last: z.string(),
        full: z.string(),
        email: z.string(),
      })
    )
    .describe("Generated fake names"),
});

type NameInput = z.infer<typeof nameInputSchema>;
type NameOutput = z.infer<typeof nameOutputSchema>;

function executeNameGenerator(input: NameInput): NameOutput {
  const names = [];
  for (let i = 0; i < input.count; i++) {
    const first = random(FIRST_NAMES);
    const last = random(LAST_NAMES);
    names.push({
      first,
      last,
      full: `${first} ${last}`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}@example.com`,
    });
  }
  return { names };
}

export const fakeName = defineTool({
  meta: {
    id: "text/fake-name",
    name: "Fake Name Generator",
    description:
      "Free online fake name generator — create random names with emails for testing instantly in your browser. No data is stored. Generates first, last, full names, and email addresses in bulk.",
    category: "text",
    subgroup: "Fake Data",
    tier: ToolTier.CLIENT,
    keywords: ["text", "fake", "name", "generate", "test"],
    examples: [
      {
        title: "Generate fake names",
        description: "Create random names for test data",
        input: { count: 2 },
        output: "(Random fake names with emails — output varies each run)",
      },
    ],
  },
  inputSchema: nameInputSchema,
  outputSchema: nameOutputSchema,
  execute: executeNameGenerator,
});

// --- Fake Address Tool ---
const addressInputSchema = z.object({
  count: z.number().min(1).max(100).default(1).describe("Number of addresses"),
});

const addressOutputSchema = z.object({
  addresses: z
    .array(
      z.object({
        street: z.string(),
        city: z.string(),
        state: z.string(),
        stateCode: z.string(),
        zip: z.string(),
        full: z.string(),
      })
    )
    .describe("Generated fake addresses"),
});

type AddressInput = z.infer<typeof addressInputSchema>;
type AddressOutput = z.infer<typeof addressOutputSchema>;

function executeAddressGenerator(input: AddressInput): AddressOutput {
  const addresses = [];
  for (let i = 0; i < input.count; i++) {
    const street = `${randomInt(100, 9999)} ${random(STREET_NAMES)} ${random(STREET_TYPES)}`;
    const city = random(CITIES);
    const stateObj = random(STATES);
    const zip = String(randomInt(10000, 99999));
    addresses.push({
      street,
      city,
      state: stateObj.name,
      stateCode: stateObj.code,
      zip,
      full: `${street}, ${city}, ${stateObj.code} ${zip}`,
    });
  }
  return { addresses };
}

export const fakeAddress = defineTool({
  meta: {
    id: "text/fake-address",
    name: "Fake Address Generator",
    description:
      "Free online fake address generator — create random US addresses for testing instantly in your browser. No data is stored. Generates street, city, state, and ZIP code combinations.",
    category: "text",
    subgroup: "Fake Data",
    tier: ToolTier.CLIENT,
    keywords: ["text", "fake", "address", "generate", "test"],
    examples: [
      {
        title: "Generate fake addresses",
        description: "Create random US addresses for testing",
        input: { count: 1 },
        output: "(Random fake US addresses — output varies each run)",
      },
    ],
  },
  inputSchema: addressInputSchema,
  outputSchema: addressOutputSchema,
  execute: executeAddressGenerator,
});

// --- Fake Company Tool ---
const companyInputSchema = z.object({
  count: z.number().min(1).max(100).default(1).describe("Number of companies"),
});

const companyOutputSchema = z.object({
  companies: z
    .array(
      z.object({
        name: z.string(),
        industry: z.string(),
        catchPhrase: z.string(),
      })
    )
    .describe("Generated fake companies"),
});

type CompanyInput = z.infer<typeof companyInputSchema>;
type CompanyOutput = z.infer<typeof companyOutputSchema>;

const CATCH_PHRASES = [
  "Innovative solutions for tomorrow",
  "Building the future today",
  "Excellence in every detail",
  "Your success is our mission",
  "Transforming ideas into reality",
];

function executeCompanyGenerator(input: CompanyInput): CompanyOutput {
  const companies = [];
  for (let i = 0; i < input.count; i++) {
    companies.push({
      name: `${random(COMPANY_PREFIXES)} ${random(COMPANY_SUFFIXES)}`,
      industry: random(INDUSTRIES),
      catchPhrase: random(CATCH_PHRASES),
    });
  }
  return { companies };
}

export const fakeCompany = defineTool({
  meta: {
    id: "text/fake-company",
    name: "Fake Company Generator",
    description:
      "Free online fake company generator — create random company names with industry and taglines for testing instantly in your browser. No data is stored. Generates name, industry, and catch phrase.",
    category: "text",
    subgroup: "Fake Data",
    tier: ToolTier.CLIENT,
    keywords: ["text", "fake", "company", "generate", "test"],
    examples: [
      {
        title: "Generate fake companies",
        description: "Create random company names for testing",
        input: { count: 2 },
        output:
          "(Random fake company names with industries — output varies each run)",
      },
    ],
  },
  inputSchema: companyInputSchema,
  outputSchema: companyOutputSchema,
  execute: executeCompanyGenerator,
});
