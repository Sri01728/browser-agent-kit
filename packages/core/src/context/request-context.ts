/**
 * Request context for conditional logic and multi-tenancy
 */
export class RequestContext {
  private data: Map<string, unknown>;
  
  constructor(initialData?: Record<string, unknown>) {
    this.data = new Map(Object.entries(initialData || {}));
  }
  
  /**
   * Get a value from context
   */
  get<T = unknown>(key: string): T | undefined {
    return this.data.get(key) as T | undefined;
  }
  
  /**
   * Set a value in context
   */
  set(key: string, value: unknown): void {
    this.data.set(key, value);
  }
  
  /**
   * Check if key exists
   */
  has(key: string): boolean {
    return this.data.has(key);
  }
  
  /**
   * Delete a key
   */
  delete(key: string): boolean {
    return this.data.delete(key);
  }
  
  /**
   * Get all context data
   */
  toObject(): Record<string, unknown> {
    return Object.fromEntries(this.data);
  }
  
  /**
   * Clone the context
   */
  clone(): RequestContext {
    return new RequestContext(this.toObject());
  }
}

