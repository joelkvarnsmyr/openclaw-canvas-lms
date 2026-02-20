import { Type } from "@sinclair/typebox";
import type { CanvasClient } from "../canvas-client.js";
import { paginate } from "../canvas-client.js";
import { crossReference, fetchTimeEditIcs } from "../timeedit.js";
import type {
  Assignment,
  CalendarEvent,
  CanvasTool,
  PlannerItem,
} from "../types.js";

export function createCalendarTools(
  client: CanvasClient,
  timeeditUrl?: string
): CanvasTool[] {
  const tools: CanvasTool[] = [
    {
      name: "canvas_list_calendar_events",
      label: "List Calendar Events",
      description: "List calendar events for courses",
      parameters: Type.Object({
        context_codes: Type.Array(Type.String(), {
          description: 'List of context codes (e.g. ["course_4538"])',
        }),
        start_date: Type.Optional(
          Type.String({ description: "Start date in ISO 8601 format" })
        ),
        end_date: Type.Optional(
          Type.String({ description: "End date in ISO 8601 format" })
        ),
        page: Type.Optional(
          Type.Number({ description: "Page number (1-indexed)", default: 1 })
        ),
        items_per_page: Type.Optional(
          Type.Number({ description: "Items per page", default: 10 })
        ),
      }),
      async execute(_id, params) {
        const queryParams: Record<string, unknown> = {
          "context_codes[]": params.context_codes,
        };
        if (params.start_date) queryParams.start_date = params.start_date;
        if (params.end_date) queryParams.end_date = params.end_date;

        const items = await client.getAllPages<CalendarEvent>(
          "/api/v1/calendar_events",
          queryParams
        );
        const result = paginate(
          items,
          (params.page as number) ?? 1,
          (params.items_per_page as number) ?? 10
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          details: result,
        };
      },
    },
    {
      name: "canvas_list_planner_items",
      label: "List Planner Items",
      description: "List planner items for the authenticated user",
      parameters: Type.Object({
        start_date: Type.String({
          description: "Start date in ISO 8601 format (required)",
        }),
        end_date: Type.String({
          description: "End date in ISO 8601 format (required)",
        }),
        context_codes: Type.Optional(
          Type.Array(Type.String(), {
            description: 'Optional context codes (e.g. ["course_4538"])',
          })
        ),
        page: Type.Optional(
          Type.Number({ description: "Page number (1-indexed)", default: 1 })
        ),
        items_per_page: Type.Optional(
          Type.Number({ description: "Items per page", default: 10 })
        ),
      }),
      async execute(_id, params) {
        const queryParams: Record<string, unknown> = {
          start_date: params.start_date,
          end_date: params.end_date,
        };
        if (params.context_codes)
          queryParams["context_codes[]"] = params.context_codes;

        const items = await client.getAllPages<PlannerItem>(
          "/api/v1/planner/items",
          queryParams
        );
        const result = paginate(
          items,
          (params.page as number) ?? 1,
          (params.items_per_page as number) ?? 10
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          details: result,
        };
      },
    },
  ];

  // Only add TimeEdit crossref tool if URL is configured
  if (timeeditUrl) {
    tools.push({
      name: "canvas_timeedit_crossref",
      label: "Canvas x TimeEdit Cross-Reference",
      description:
        "Cross-reference Canvas assignments with TimeEdit schedule to find implicit deadlines for undated assignments. Use when asked about deadlines or upcoming work.",
      parameters: Type.Object({
        course_id: Type.Number({ description: "Canvas course ID" }),
        days_ahead: Type.Optional(
          Type.Number({
            description: "Number of days to look ahead (default: 30)",
            default: 30,
          })
        ),
      }),
      async execute(_id, params) {
        // Fetch TimeEdit events
        const events = await fetchTimeEditIcs(timeeditUrl);

        // Fetch all Canvas assignments for the course
        const allAssignments: Assignment[] = [];
        const seenIds = new Set<number>();
        for (const bucket of [
          "upcoming",
          "undated",
          "future",
          "past",
        ] as const) {
          try {
            const items = await client.getAllPages<Assignment>(
              `/api/v1/courses/${params.course_id}/assignments`,
              { bucket, order_by: "name", per_page: 50 }
            );
            for (const item of items) {
              if (!seenIds.has(item.id)) {
                seenIds.add(item.id);
                allAssignments.push(item);
              }
            }
          } catch {
            // Some buckets may fail, continue with others
          }
        }

        const result = crossReference(
          allAssignments,
          events,
          (params.days_ahead as number) ?? 30
        );

        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          details: result,
        };
      },
    });
  }

  return tools;
}
