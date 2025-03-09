/* eslint-disable */

export function getIpFingerprint(req: Request | Record<any, any>): string {
  const forwarded =
    req instanceof Request
      ? req.headers.get("x-forwarded-for")
      : req.headers["x-forwarded-for"];
  const ip = forwarded
    ? (typeof forwarded === "string" ? forwarded : forwarded[0])?.split(/, /)[0]
    : ((req as any)?.socket?.remoteAddress ?? null);

  return ip || "127.0.0.1";
}
