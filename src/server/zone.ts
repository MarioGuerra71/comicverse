import "server-only";
import { cookies } from "next/headers";
import { parseZone, ZONE_COOKIE } from "@/lib/zones";

/** Zona elegida por el usuario (cookie de preferencia; no es un dato sensible). */
export async function getZone() {
  return parseZone((await cookies()).get(ZONE_COOKIE)?.value);
}
