/** Test double: capture the edge handler instead of binding a port. */
export function serve(handler: (req: Request) => Response | Promise<Response>): void {
  (globalThis as Record<string, unknown>).__edgeHandler = handler;
}
