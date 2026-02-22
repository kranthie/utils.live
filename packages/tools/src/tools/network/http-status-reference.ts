import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { INPUT_INVALID_FORMAT } from "../../core/error-codes";

/**
 * Comprehensive HTTP status code database.
 */
const HTTP_STATUS_CODES: Record<
  number,
  { phrase: string; description: string; category: string; spec: string }
> = {
  // 1xx Informational
  100: {
    phrase: "Continue",
    description:
      "The server has received the request headers and the client should proceed to send the request body.",
    category: "Informational",
    spec: "RFC 7231",
  },
  101: {
    phrase: "Switching Protocols",
    description:
      "The server is switching protocols as requested by the client via the Upgrade header.",
    category: "Informational",
    spec: "RFC 7231",
  },
  102: {
    phrase: "Processing",
    description:
      "The server has received and is processing the request, but no response is available yet.",
    category: "Informational",
    spec: "RFC 2518",
  },
  103: {
    phrase: "Early Hints",
    description:
      "Used to return some response headers before the final HTTP message.",
    category: "Informational",
    spec: "RFC 8297",
  },

  // 2xx Success
  200: {
    phrase: "OK",
    description:
      "The request has succeeded. The meaning depends on the HTTP method used.",
    category: "Success",
    spec: "RFC 7231",
  },
  201: {
    phrase: "Created",
    description:
      "The request has been fulfilled and a new resource has been created.",
    category: "Success",
    spec: "RFC 7231",
  },
  202: {
    phrase: "Accepted",
    description:
      "The request has been accepted for processing, but the processing has not been completed.",
    category: "Success",
    spec: "RFC 7231",
  },
  203: {
    phrase: "Non-Authoritative Information",
    description:
      "The returned metadata is not exactly the same as available from the origin server.",
    category: "Success",
    spec: "RFC 7231",
  },
  204: {
    phrase: "No Content",
    description:
      "The server successfully processed the request but is not returning any content.",
    category: "Success",
    spec: "RFC 7231",
  },
  205: {
    phrase: "Reset Content",
    description:
      "The server successfully processed the request and is asking the client to reset the document view.",
    category: "Success",
    spec: "RFC 7231",
  },
  206: {
    phrase: "Partial Content",
    description:
      "The server is delivering only part of the resource due to a range header sent by the client.",
    category: "Success",
    spec: "RFC 7233",
  },
  207: {
    phrase: "Multi-Status",
    description:
      "The message body contains multiple status codes for multiple independent operations.",
    category: "Success",
    spec: "RFC 4918",
  },
  208: {
    phrase: "Already Reported",
    description:
      "The members of a DAV binding have already been enumerated and are not included again.",
    category: "Success",
    spec: "RFC 5842",
  },
  226: {
    phrase: "IM Used",
    description:
      "The server has fulfilled a request for the resource, and the response is a representation of the result of one or more instance-manipulations.",
    category: "Success",
    spec: "RFC 3229",
  },

  // 3xx Redirection
  300: {
    phrase: "Multiple Choices",
    description:
      "The request has more than one possible response. The user should choose one of them.",
    category: "Redirection",
    spec: "RFC 7231",
  },
  301: {
    phrase: "Moved Permanently",
    description:
      "The URL of the requested resource has been changed permanently. The new URL is given in the response.",
    category: "Redirection",
    spec: "RFC 7231",
  },
  302: {
    phrase: "Found",
    description:
      "The URI of requested resource has been changed temporarily. The client should use the same URI for future requests.",
    category: "Redirection",
    spec: "RFC 7231",
  },
  303: {
    phrase: "See Other",
    description:
      "The server sent this response to direct the client to get the requested resource at another URI with a GET request.",
    category: "Redirection",
    spec: "RFC 7231",
  },
  304: {
    phrase: "Not Modified",
    description:
      "The response has not been modified since the last request. The client can use the cached version.",
    category: "Redirection",
    spec: "RFC 7232",
  },
  305: {
    phrase: "Use Proxy",
    description:
      "The requested resource must be accessed through the proxy given by the Location header.",
    category: "Redirection",
    spec: "RFC 7231",
  },
  307: {
    phrase: "Temporary Redirect",
    description:
      "The server sends this response to direct the client to get the resource at another URI with the same method.",
    category: "Redirection",
    spec: "RFC 7231",
  },
  308: {
    phrase: "Permanent Redirect",
    description:
      "The resource is now permanently located at another URI, specified by the Location header.",
    category: "Redirection",
    spec: "RFC 7538",
  },

  // 4xx Client Errors
  400: {
    phrase: "Bad Request",
    description:
      "The server cannot process the request due to malformed syntax or invalid request message framing.",
    category: "Client Error",
    spec: "RFC 7231",
  },
  401: {
    phrase: "Unauthorized",
    description:
      "The request requires user authentication. The client must authenticate itself to get the requested response.",
    category: "Client Error",
    spec: "RFC 7235",
  },
  402: {
    phrase: "Payment Required",
    description:
      "Reserved for future use. Originally intended for digital payment schemes.",
    category: "Client Error",
    spec: "RFC 7231",
  },
  403: {
    phrase: "Forbidden",
    description:
      "The client does not have access rights to the content. Unlike 401, the server knows the client's identity.",
    category: "Client Error",
    spec: "RFC 7231",
  },
  404: {
    phrase: "Not Found",
    description:
      "The server cannot find the requested resource. The URL is not recognized.",
    category: "Client Error",
    spec: "RFC 7231",
  },
  405: {
    phrase: "Method Not Allowed",
    description:
      "The request method is known by the server but is not supported by the target resource.",
    category: "Client Error",
    spec: "RFC 7231",
  },
  406: {
    phrase: "Not Acceptable",
    description:
      "The server cannot produce a response matching the list of acceptable values defined in the request headers.",
    category: "Client Error",
    spec: "RFC 7231",
  },
  407: {
    phrase: "Proxy Authentication Required",
    description: "The client must first authenticate itself with the proxy.",
    category: "Client Error",
    spec: "RFC 7235",
  },
  408: {
    phrase: "Request Timeout",
    description:
      "The server timed out waiting for the request from the client.",
    category: "Client Error",
    spec: "RFC 7231",
  },
  409: {
    phrase: "Conflict",
    description: "The request conflicts with the current state of the server.",
    category: "Client Error",
    spec: "RFC 7231",
  },
  410: {
    phrase: "Gone",
    description:
      "The content has been permanently deleted from the server with no forwarding address.",
    category: "Client Error",
    spec: "RFC 7231",
  },
  411: {
    phrase: "Length Required",
    description:
      "The server rejects the request because the Content-Length header field is not defined.",
    category: "Client Error",
    spec: "RFC 7231",
  },
  412: {
    phrase: "Precondition Failed",
    description:
      "The client has indicated preconditions in its headers which the server does not meet.",
    category: "Client Error",
    spec: "RFC 7232",
  },
  413: {
    phrase: "Payload Too Large",
    description: "The request entity is larger than limits defined by server.",
    category: "Client Error",
    spec: "RFC 7231",
  },
  414: {
    phrase: "URI Too Long",
    description:
      "The URI requested by the client is longer than the server is willing to interpret.",
    category: "Client Error",
    spec: "RFC 7231",
  },
  415: {
    phrase: "Unsupported Media Type",
    description:
      "The media format of the requested data is not supported by the server.",
    category: "Client Error",
    spec: "RFC 7231",
  },
  416: {
    phrase: "Range Not Satisfiable",
    description:
      "The range specified by the Range header field in the request cannot be fulfilled.",
    category: "Client Error",
    spec: "RFC 7233",
  },
  417: {
    phrase: "Expectation Failed",
    description:
      "The expectation indicated by the Expect request header field cannot be met by the server.",
    category: "Client Error",
    spec: "RFC 7231",
  },
  418: {
    phrase: "I'm a Teapot",
    description:
      "The server refuses to brew coffee because it is, permanently, a teapot. An April Fools' joke from 1998.",
    category: "Client Error",
    spec: "RFC 2324",
  },
  421: {
    phrase: "Misdirected Request",
    description:
      "The request was directed at a server that is not able to produce a response.",
    category: "Client Error",
    spec: "RFC 7540",
  },
  422: {
    phrase: "Unprocessable Entity",
    description:
      "The request was well-formed but was unable to be followed due to semantic errors.",
    category: "Client Error",
    spec: "RFC 4918",
  },
  423: {
    phrase: "Locked",
    description: "The resource that is being accessed is locked.",
    category: "Client Error",
    spec: "RFC 4918",
  },
  424: {
    phrase: "Failed Dependency",
    description:
      "The request failed because it depended on another request that failed.",
    category: "Client Error",
    spec: "RFC 4918",
  },
  425: {
    phrase: "Too Early",
    description:
      "The server is unwilling to risk processing a request that might be replayed.",
    category: "Client Error",
    spec: "RFC 8470",
  },
  426: {
    phrase: "Upgrade Required",
    description:
      "The server refuses to perform the request using the current protocol but might do so with an upgraded protocol.",
    category: "Client Error",
    spec: "RFC 7231",
  },
  428: {
    phrase: "Precondition Required",
    description:
      "The origin server requires the request to be conditional to prevent lost updates.",
    category: "Client Error",
    spec: "RFC 6585",
  },
  429: {
    phrase: "Too Many Requests",
    description:
      "The user has sent too many requests in a given amount of time (rate limiting).",
    category: "Client Error",
    spec: "RFC 6585",
  },
  431: {
    phrase: "Request Header Fields Too Large",
    description:
      "The server is unwilling to process the request because its header fields are too large.",
    category: "Client Error",
    spec: "RFC 6585",
  },
  451: {
    phrase: "Unavailable For Legal Reasons",
    description:
      "The user agent requested a resource that cannot be legally provided.",
    category: "Client Error",
    spec: "RFC 7725",
  },

  // 5xx Server Errors
  500: {
    phrase: "Internal Server Error",
    description:
      "The server has encountered a situation it does not know how to handle.",
    category: "Server Error",
    spec: "RFC 7231",
  },
  501: {
    phrase: "Not Implemented",
    description:
      "The request method is not supported by the server and cannot be handled.",
    category: "Server Error",
    spec: "RFC 7231",
  },
  502: {
    phrase: "Bad Gateway",
    description:
      "The server acting as a gateway received an invalid response from the upstream server.",
    category: "Server Error",
    spec: "RFC 7231",
  },
  503: {
    phrase: "Service Unavailable",
    description:
      "The server is not ready to handle the request, often due to maintenance or overloading.",
    category: "Server Error",
    spec: "RFC 7231",
  },
  504: {
    phrase: "Gateway Timeout",
    description:
      "The server acting as a gateway did not get a response in time from the upstream server.",
    category: "Server Error",
    spec: "RFC 7231",
  },
  505: {
    phrase: "HTTP Version Not Supported",
    description:
      "The HTTP version used in the request is not supported by the server.",
    category: "Server Error",
    spec: "RFC 7231",
  },
  506: {
    phrase: "Variant Also Negotiates",
    description:
      "Transparent content negotiation for the request results in a circular reference.",
    category: "Server Error",
    spec: "RFC 2295",
  },
  507: {
    phrase: "Insufficient Storage",
    description:
      "The server is unable to store the representation needed to complete the request.",
    category: "Server Error",
    spec: "RFC 4918",
  },
  508: {
    phrase: "Loop Detected",
    description:
      "The server detected an infinite loop while processing the request.",
    category: "Server Error",
    spec: "RFC 5842",
  },
  510: {
    phrase: "Not Extended",
    description:
      "Further extensions to the request are required for the server to fulfill it.",
    category: "Server Error",
    spec: "RFC 2774",
  },
  511: {
    phrase: "Network Authentication Required",
    description:
      "The client needs to authenticate to gain network access, typically used by captive portals.",
    category: "Server Error",
    spec: "RFC 6585",
  },
};

const inputSchema = z.object({
  input: z
    .string()
    .describe(
      "HTTP status code (e.g. '404') or search term (e.g. 'not found')"
    ),
});

const statusEntrySchema = z.object({
  code: z.number().describe("HTTP status code"),
  phrase: z.string().describe("Status phrase"),
  description: z.string().describe("Description of the status code"),
  category: z.string().describe("Status category (1xx-5xx)"),
  spec: z.string().describe("RFC specification"),
});

const outputSchema = z.object({
  results: z.array(statusEntrySchema).describe("Matching HTTP status codes"),
  totalKnown: z.number().describe("Total number of known status codes"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  const query = input.input.trim();

  if (!query) {
    throw createToolError({
      code: INPUT_INVALID_FORMAT,
      message: "Please provide a status code or search term",
    });
  }

  const totalKnown = Object.keys(HTTP_STATUS_CODES).length;

  // Try exact code match first
  const codeNum = parseInt(query, 10);
  if (!isNaN(codeNum) && HTTP_STATUS_CODES[codeNum]) {
    const entry = HTTP_STATUS_CODES[codeNum];
    return {
      results: [
        {
          code: codeNum,
          phrase: entry.phrase,
          description: entry.description,
          category: entry.category,
          spec: entry.spec,
        },
      ],
      totalKnown,
    };
  }

  // Try category match (e.g. "2xx", "4xx")
  const categoryMatch = query.match(/^(\d)xx$/i);
  if (categoryMatch) {
    const prefix = categoryMatch[1]!;
    const results = Object.entries(HTTP_STATUS_CODES)
      .filter(([code]) => code.startsWith(prefix))
      .map(([code, entry]) => ({
        code: parseInt(code, 10),
        phrase: entry.phrase,
        description: entry.description,
        category: entry.category,
        spec: entry.spec,
      }))
      .sort((a, b) => a.code - b.code);

    return { results, totalKnown };
  }

  // Search by phrase or description
  const lowerQuery = query.toLowerCase();
  const results = Object.entries(HTTP_STATUS_CODES)
    .filter(
      ([, entry]) =>
        entry.phrase.toLowerCase().includes(lowerQuery) ||
        entry.description.toLowerCase().includes(lowerQuery) ||
        entry.category.toLowerCase().includes(lowerQuery)
    )
    .map(([code, entry]) => ({
      code: parseInt(code, 10),
      phrase: entry.phrase,
      description: entry.description,
      category: entry.category,
      spec: entry.spec,
    }))
    .sort((a, b) => a.code - b.code);

  return { results, totalKnown };
}

export const httpStatusReference = defineTool({
  meta: {
    id: "network/http-status-reference",
    name: "HTTP Status Reference",
    description:
      'Free online HTTP status code reference — look up any status code or search by description to get the meaning, category, and RFC spec instantly in your browser. No data is stored. Covers all 62 standard codes from 1xx to 5xx, supports category search like "4xx".',
    category: "network",
    subgroup: "HTTP Tools",
    tier: ToolTier.CLIENT,
    keywords: [
      "network",
      "http",
      "status",
      "code",
      "reference",
      "api",
      "rest",
      "web",
      "rfc",
      "error",
    ],
    ui: { outputRenderer: "json-tree" as const },
    examples: [
      {
        title: "Look up HTTP 429 Too Many Requests",
        description:
          "Get the meaning, category, and RFC spec for status code 429",
        input: "429",
        output:
          '{"results":[{"code":429,"phrase":"Too Many Requests","description":"The user has sent too many requests in a given amount of time (rate limiting).","category":"Client Error","spec":"RFC 6585"}],"totalKnown":62}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
