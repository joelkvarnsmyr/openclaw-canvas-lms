import { Type } from "@sinclair/typebox";
import type { CanvasClient } from "../canvas-client.js";
import type { CanvasTool, Course, Enrollment, Tab } from "../types.js";

export function createEnrollmentTools(client: CanvasClient): CanvasTool[] {
  return [
    {
      name: "canvas_get_enrollments",
      label: "Get Enrollments",
      description:
        "Get the current user's enrollments including grades",
      parameters: Type.Object({}),
      async execute() {
        const items = await client.get<Enrollment[]>(
          "/api/v1/users/self/enrollments"
        );
        const result = { items, total: items.length };
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          details: result,
        };
      },
    },
    {
      name: "canvas_get_tabs",
      label: "Get Course Tabs",
      description: "Get available tabs/navigation items for a course",
      parameters: Type.Object({
        course_id: Type.Number({ description: "Course ID" }),
      }),
      async execute(_id, params) {
        const items = await client.get<Tab[]>(
          `/api/v1/courses/${params.course_id}/tabs`
        );
        const result = { items, total: items.length };
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          details: result,
        };
      },
    },
    {
      name: "canvas_list_favorites",
      label: "List Favorite Courses",
      description: "List the current user's favorite courses",
      parameters: Type.Object({}),
      async execute() {
        const items = await client.get<Course[]>(
          "/api/v1/users/self/favorites/courses"
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
