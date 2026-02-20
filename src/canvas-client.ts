export class CanvasClient {
  private baseUrl: string;
  private apiToken: string;
  private headers: Record<string, string>;

  constructor(baseUrl: string, apiToken: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.apiToken = apiToken;
    this.headers = {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
      "User-Agent": "openclaw-canvas-lms/1.0.0",
    };
  }

  async get<T = unknown>(
    endpoint: string,
    params?: Record<string, unknown>
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null) continue;
        if (Array.isArray(value)) {
          for (const v of value) {
            url.searchParams.append(key, String(v));
          }
        } else {
          url.searchParams.append(key, String(value));
        }
      }
    }

    const response = await fetch(url.toString(), { headers: this.headers });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(
        `Canvas API error ${response.status}: ${response.statusText} - ${body}`
      );
    }

    return response.json() as Promise<T>;
  }

  async getAllPages<T = unknown>(
    endpoint: string,
    params?: Record<string, unknown>
  ): Promise<T[]> {
    const allItems: T[] = [];
    let url: string | null = `${this.baseUrl}${endpoint}`;

    const searchParams = new URLSearchParams();
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null) continue;
        if (Array.isArray(value)) {
          for (const v of value) {
            searchParams.append(key, String(v));
          }
        } else {
          searchParams.append(key, String(value));
        }
      }
    }
    if (!searchParams.has("per_page")) {
      searchParams.set("per_page", "100");
    }

    url = `${url}?${searchParams.toString()}`;

    while (url) {
      const response = await fetch(url, { headers: this.headers });

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new Error(
          `Canvas API error ${response.status}: ${response.statusText} - ${body}`
        );
      }

      const items = (await response.json()) as T[];
      allItems.push(...items);

      // Parse Link header for next page
      url = this.getNextPageUrl(response.headers.get("link"));
    }

    return allItems;
  }

  private getNextPageUrl(linkHeader: string | null): string | null {
    if (!linkHeader) return null;
    const matches = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
    return matches ? matches[1] : null;
  }
}

export function paginate<T>(
  items: T[],
  page: number = 1,
  itemsPerPage: number = 10
): {
  items: T[];
  next_page: string | null;
  previous_page: string | null;
  page: number;
  total_pages: number;
  total_items: number;
  items_per_page: number;
} {
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const currentPage = Math.max(1, Math.min(page, totalPages));
  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = Math.min(startIdx + itemsPerPage, totalItems);

  return {
    items: items.slice(startIdx, endIdx),
    next_page: currentPage < totalPages ? String(currentPage + 1) : null,
    previous_page: currentPage > 1 ? String(currentPage - 1) : null,
    page: currentPage,
    total_pages: totalPages,
    total_items: totalItems,
    items_per_page: itemsPerPage,
  };
}
