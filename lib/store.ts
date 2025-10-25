// Simple in-memory store for URLs
// In production, replace with a database

export interface ShortUrl {
  id: string;
  originalUrl: string;
  shortCode: string;
  prefix?: string;
  createdAt: Date;
  clicks: number;
}

class URLStore {
  private urls: Map<string, ShortUrl> = new Map();

  add(url: ShortUrl): void {
    this.urls.set(url.shortCode, url);
  }

  get(shortCode: string): ShortUrl | undefined {
    return this.urls.get(shortCode);
  }

  getAll(): ShortUrl[] {
    return Array.from(this.urls.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  incrementClicks(shortCode: string): void {
    const url = this.urls.get(shortCode);
    if (url) {
      url.clicks++;
    }
  }

  exists(shortCode: string): boolean {
    return this.urls.has(shortCode);
  }

  delete(shortCode: string): boolean {
    return this.urls.delete(shortCode);
  }
}

export const urlStore = new URLStore();
