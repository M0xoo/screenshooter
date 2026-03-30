import { z } from "zod";

export const captureRequestSchema = z.object({
  url: z.string().url(),
  viewport: z
    .object({
      width: z.number().int().min(320).max(4096),
      height: z.number().int().min(240).max(4096),
    })
    .default({ width: 1280, height: 720 }),
  deviceScaleFactor: z.number().min(1).max(3).optional().default(1),
  fullPage: z.boolean().optional().default(false),
  waitUntil: z.enum(["load", "domcontentloaded", "networkidle"]).optional().default("networkidle"),
  timeoutMs: z.number().int().min(5000).max(120000).optional().default(45000),
});

export type CaptureRequest = z.infer<typeof captureRequestSchema>;
