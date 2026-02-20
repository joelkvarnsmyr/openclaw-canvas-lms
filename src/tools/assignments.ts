import { Type } from "@sinclair/typebox";
import type { CanvasClient } from "../canvas-client.js";
import { paginate } from "../canvas-client.js";
import type { Assignment, AssignmentGroup, CanvasTool } from "../types.js";

export function createAssignmentTools(client: CanvasClient): CanvasTool[] {
  return [
    {
      name: "canvas_list_assignments",
      label: "List Assignments",
      description: "List assignments for a course with filtering and sorting",
      parameters: Type.Object({
        course_id: Type.Number({ description: "Course ID" }),
        bucket: Type.Union(
          [
            Type.Literal("past"),
            Type.Literal("overdue"),
            Type.Literal("undated"),
            Type.Literal("ungraded"),
            Type.Literal("unsubmitted"),
            Type.Literal("upcoming"),
            Type.Literal("future"),
          ],
          {
            description:
              "Filter bucket: past, overdue, undated, ungraded, unsubmitted, upcoming, future",
          }
        ),
        order_by: Type.Union(
          [
            Type.Literal("due_at"),
            Type.Literal("position"),
            Type.Literal("name"),
          ],
          { description: "Sort order: due_at, position, name" }
        ),
        include: Type.Optional(
          Type.Array(Type.String(), {
            description:
              'Optional data to include (e.g. ["submission"] for grade status)',
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
        const queryParams: Record<string, unknown> = {};
        if (params.bucket) queryParams.bucket = params.bucket;
        if (params.order_by) queryParams.order_by = params.order_by;
        if (params.include) queryParams["include[]"] = params.include;

        const items = await client.getAllPages<Assignment>(
          `/api/v1/courses/${params.course_id}/assignments`,
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
      name: "canvas_get_assignment",
      label: "Get Assignment",
      description: "Get a single assignment by ID",
      parameters: Type.Object({
        course_id: Type.Number({ description: "Course ID" }),
        assignment_id: Type.Number({ description: "Assignment ID" }),
      }),
      async execute(_id, params) {
        const result = await client.get<Assignment>(
          `/api/v1/courses/${params.course_id}/assignments/${params.assignment_id}`
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          details: result,
        };
      },
    },
    {
      name: "canvas_list_assignment_groups",
      label: "List Assignment Groups",
      description:
        "List assignment groups for a course (shows grade weighting/categories)",
      parameters: Type.Object({
        course_id: Type.Number({ description: "Course ID" }),
      }),
      async execute(_id, params) {
        const items = await client.get<AssignmentGroup[]>(
          `/api/v1/courses/${params.course_id}/assignment_groups`
        );
        const result = { items, total: items.length };
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          details: result,
        };
      },
    },
  ];
}
