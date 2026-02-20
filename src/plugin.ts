import { CanvasClient } from "./canvas-client.js";
import { createAssignmentTools } from "./tools/assignments.js";
import { createCalendarTools } from "./tools/calendar.js";
import { createContentTools } from "./tools/content.js";
import { createCourseTools } from "./tools/courses.js";
import { createDiscussionTools } from "./tools/discussions.js";
import { createEnrollmentTools } from "./tools/enrollment.js";
import { createFileTools } from "./tools/files.js";
import type { CanvasPluginConfig, CanvasTool } from "./types.js";

interface OpenClawToolContext {
  sandboxed: boolean;
}

type OpenClawPluginToolFactory = (
  ctx: OpenClawToolContext
) => CanvasTool | null;

interface OpenClawPluginApi {
  pluginConfig: unknown;
  registerTool(
    factory: OpenClawPluginToolFactory,
    options?: { optional?: boolean }
  ): void;
}

export function registerCanvasPlugin(api: OpenClawPluginApi): void {
  const config = api.pluginConfig as CanvasPluginConfig;

  if (!config.canvasApiToken || !config.canvasBaseUrl) {
    console.error(
      "[canvas-lms] Missing required config: canvasApiToken and canvasBaseUrl"
    );
    return;
  }

  const client = new CanvasClient(config.canvasBaseUrl, config.canvasApiToken);

  const allTools: CanvasTool[] = [
    ...createCourseTools(client),
    ...createAssignmentTools(client),
    ...createContentTools(client),
    ...createDiscussionTools(client),
    ...createCalendarTools(client, config.scheduleIcsUrl, config.keywordMap),
    ...createEnrollmentTools(client),
    ...createFileTools(client),
  ];

  for (const tool of allTools) {
    api.registerTool(
      ((ctx: OpenClawToolContext) =>
        ctx.sandboxed ? null : tool) as OpenClawPluginToolFactory,
      { optional: true }
    );
  }

  console.log(`[canvas-lms] Registered ${allTools.length} tools for ${config.canvasBaseUrl}`);
}
