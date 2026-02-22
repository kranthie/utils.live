import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { INPUT_INVALID_FORMAT } from "../../core/error-codes";

const inputSchema = z.object({
  input: z
    .string()
    .describe(
      "IP address with CIDR notation (e.g. '192.168.1.0/24') or IP with subnet mask (e.g. '192.168.1.0 255.255.255.0')"
    ),
});

const outputSchema = z.object({
  networkAddress: z.string().describe("Network address"),
  broadcastAddress: z.string().describe("Broadcast address"),
  subnetMask: z.string().describe("Subnet mask in dotted decimal"),
  wildcardMask: z.string().describe("Wildcard mask"),
  cidr: z.number().describe("CIDR prefix length"),
  firstHost: z.string().describe("First usable host address"),
  lastHost: z.string().describe("Last usable host address"),
  totalHosts: z.number().describe("Total number of addresses"),
  usableHosts: z.number().describe("Number of usable host addresses"),
  ipClass: z.string().describe("IP class (A, B, C, D, E)"),
  isPrivate: z.boolean().describe("Whether the address is in a private range"),
  binaryMask: z.string().describe("Subnet mask in binary"),
  ipBinary: z.string().describe("IP address in binary"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function parseIpToNumber(ip: string): number {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    throw createToolError({
      code: INPUT_INVALID_FORMAT,
      message: `Invalid IP address: ${ip}`,
    });
  }
  return (
    ((parts[0]! << 24) | (parts[1]! << 16) | (parts[2]! << 8) | parts[3]!) >>> 0
  );
}

function numberToIp(num: number): string {
  return [
    (num >>> 24) & 0xff,
    (num >>> 16) & 0xff,
    (num >>> 8) & 0xff,
    num & 0xff,
  ].join(".");
}

function numberToBinary(num: number): string {
  return [
    ((num >>> 24) & 0xff).toString(2).padStart(8, "0"),
    ((num >>> 16) & 0xff).toString(2).padStart(8, "0"),
    ((num >>> 8) & 0xff).toString(2).padStart(8, "0"),
    (num & 0xff).toString(2).padStart(8, "0"),
  ].join(".");
}

function cidrToMask(cidr: number): number {
  if (cidr === 0) return 0;
  return (~0 << (32 - cidr)) >>> 0;
}

function maskToCidr(mask: number): number {
  let cidr = 0;
  let m = mask;
  while (m & 0x80000000) {
    cidr++;
    m = (m << 1) >>> 0;
  }
  return cidr;
}

function getIpClass(ip: number): string {
  const firstOctet = (ip >>> 24) & 0xff;
  if (firstOctet < 128) return "A";
  if (firstOctet < 192) return "B";
  if (firstOctet < 224) return "C";
  if (firstOctet < 240) return "D";
  return "E";
}

function isPrivateIp(ip: number): boolean {
  const first = (ip >>> 24) & 0xff;
  const second = (ip >>> 16) & 0xff;
  // 10.0.0.0/8
  if (first === 10) return true;
  // 172.16.0.0/12
  if (first === 172 && second >= 16 && second <= 31) return true;
  // 192.168.0.0/16
  if (first === 192 && second === 168) return true;
  // 127.0.0.0/8
  if (first === 127) return true;
  return false;
}

function parseMaskString(maskStr: string): number {
  const parts = maskStr.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    throw createToolError({
      code: INPUT_INVALID_FORMAT,
      message: `Invalid subnet mask: ${maskStr}`,
    });
  }
  return (
    ((parts[0]! << 24) | (parts[1]! << 16) | (parts[2]! << 8) | parts[3]!) >>> 0
  );
}

function execute(input: Input): Output {
  const trimmed = input.input.trim();

  let ipNum: number;
  let maskNum: number;
  let cidr: number;

  // Try CIDR notation: 192.168.1.0/24
  const cidrMatch = trimmed.match(
    /^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\/(\d{1,2})$/
  );
  if (cidrMatch) {
    ipNum = parseIpToNumber(cidrMatch[1]!);
    cidr = parseInt(cidrMatch[2]!, 10);
    if (cidr < 0 || cidr > 32) {
      throw createToolError({
        code: INPUT_INVALID_FORMAT,
        message: `Invalid CIDR prefix: /${cidr}. Must be between 0 and 32.`,
      });
    }
    maskNum = cidrToMask(cidr);
  } else {
    // Try IP + subnet mask: 192.168.1.0 255.255.255.0
    const parts = trimmed.split(/\s+/);
    if (parts.length === 2) {
      ipNum = parseIpToNumber(parts[0]!);
      maskNum = parseMaskString(parts[1]!);
      cidr = maskToCidr(maskNum);
    } else {
      throw createToolError({
        code: INPUT_INVALID_FORMAT,
        message:
          "Invalid input. Use CIDR notation (e.g. 192.168.1.0/24) or IP with subnet mask (e.g. 192.168.1.0 255.255.255.0).",
      });
    }
  }

  const networkNum = (ipNum & maskNum) >>> 0;
  const wildcardNum = ~maskNum >>> 0;
  const broadcastNum = (networkNum | wildcardNum) >>> 0;
  const totalHosts = Math.pow(2, 32 - cidr);
  const usableHosts = cidr >= 31 ? totalHosts : Math.max(totalHosts - 2, 0);

  let firstHost: string;
  let lastHost: string;
  if (cidr === 32) {
    firstHost = numberToIp(networkNum);
    lastHost = numberToIp(networkNum);
  } else if (cidr === 31) {
    firstHost = numberToIp(networkNum);
    lastHost = numberToIp(broadcastNum);
  } else {
    firstHost = numberToIp((networkNum + 1) >>> 0);
    lastHost = numberToIp((broadcastNum - 1) >>> 0);
  }

  return {
    networkAddress: numberToIp(networkNum),
    broadcastAddress: numberToIp(broadcastNum),
    subnetMask: numberToIp(maskNum),
    wildcardMask: numberToIp(wildcardNum),
    cidr,
    firstHost,
    lastHost,
    totalHosts,
    usableHosts,
    ipClass: getIpClass(ipNum),
    isPrivate: isPrivateIp(ipNum),
    binaryMask: numberToBinary(maskNum),
    ipBinary: numberToBinary(ipNum),
  };
}

export const subnetCalculator = defineTool({
  meta: {
    id: "network/subnet-calculator",
    name: "Subnet Calculator",
    description:
      "Free online subnet calculator — enter CIDR notation or IP with subnet mask and get network address, broadcast, first/last host, usable hosts, wildcard mask, IP class, and binary representations instantly in your browser. No data is stored.",
    category: "network",
    subgroup: "Network",
    tier: ToolTier.CLIENT,
    keywords: [
      "network",
      "subnet",
      "cidr",
      "mask",
      "ip",
      "calculator",
      "ipv4",
      "netmask",
      "wildcard",
      "broadcast",
    ],
    ui: { outputRenderer: "json-tree" as const },
    examples: [
      {
        title: "Calculate subnet for 192.168.1.0/24",
        description:
          "Get network, broadcast, host range, mask, class, and binary for a /24 subnet",
        input: "192.168.1.0/24",
        output:
          '{"networkAddress":"192.168.1.0","broadcastAddress":"192.168.1.255","subnetMask":"255.255.255.0","wildcardMask":"0.0.0.255","cidr":24,"firstHost":"192.168.1.1","lastHost":"192.168.1.254","totalHosts":256,"usableHosts":254,"ipClass":"C","isPrivate":true,"binaryMask":"11111111.11111111.11111111.00000000","ipBinary":"11000000.10101000.00000001.00000000"}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
