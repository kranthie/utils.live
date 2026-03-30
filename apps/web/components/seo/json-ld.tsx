import type {
  SoftwareApplicationSchema,
  BreadcrumbListSchema,
  WebsiteSchema,
  OrganizationSchema,
  FAQPageSchema,
  ItemListSchema,
} from "@/lib/seo/json-ld";

type JsonLdData =
  | SoftwareApplicationSchema
  | BreadcrumbListSchema
  | WebsiteSchema
  | OrganizationSchema
  | FAQPageSchema
  | ItemListSchema
  | Record<string, unknown>;

interface JsonLdProps {
  /**
   * The structured data object to render.
   */
  data: JsonLdData;
}

/**
 * Renders JSON-LD structured data in a script tag.
 *
 * @example
 * <JsonLd
 *   data={{
 *     "@context": "https://schema.org",
 *     "@type": "SoftwareApplication",
 *     name: "JSON Formatter",
 *     ...
 *   }}
 * />
 */
export function JsonLd({ data }: JsonLdProps): React.ReactElement {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data, null, 0),
      }}
    />
  );
}

/**
 * Renders multiple JSON-LD structured data items.
 */
export function JsonLdMultiple({
  items,
}: {
  items: JsonLdData[];
}): React.ReactElement {
  return (
    <>
      {items.map((data, index) => (
        <JsonLd key={index} data={data} />
      ))}
    </>
  );
}
