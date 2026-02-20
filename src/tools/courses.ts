import { Type } from "@sinclair/typebox";
import type { CanvasClient } from "../canvas-client.js";
import { paginate } from "../canvas-client.js";
import type { CanvasTool, Course, Module, ModuleItem } from "../types.js";

export function createCourseTools(client: CanvasClient): CanvasTool[] {
  return [
    {
      name: "canvas_list_courses",
      label: "List Canvas Courses",
      description:
        "List courses the user is actively enrolled in as a student",
      parameters: Type.Object({
        page: Type.Optional(
          Type.Number({ description: "Page number (1-indexed)", default: 1 })
        ),
        items_per_page: Type.Optional(
          Type.Number({ description: "Items per page", default: 10 })
        ),
      }),
      async execute(_id, params) {
        const items = await client.getAllPages<Course>("/api/v1/courses", {
          enrollment_type: "student",
          enrollment_state: "active",
        });
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
      name: "canvas_get_course",
      label: "Get Canvas Course",
      description: "Get a single course by ID with optional extra data",
      parameters: Type.Object({
        course_id: Type.Number({ description: "Course ID" }),
        include: Type.Optional(
          Type.Array(Type.String(), {
            description:
              'Optional data to include (e.g. ["term", "total_students"])',
          })
        ),
      }),
      async execute(_id, params) {
        const queryParams: Record<string, unknown> = {};
        if (params.include) queryParams["include[]"] = params.include;

        const result = await client.get<Course>(
          `/api/v1/courses/${params.course_id}`,
          queryParams
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          details: result,
        };
      },
    },
    {
      name: "canvas_get_course_syllabus",
      label: "Get Course Syllabus",
      description: "Get the syllabus HTML for a course",
      parameters: Type.Object({
        course_id: Type.Number({ description: "Course ID" }),
      }),
      async execute(_id, params) {
        const result = await client.get<Course>(
          `/api/v1/courses/${params.course_id}`,
          { "include[]": "syllabus_body" }
        );
        const syllabus = result.syllabus_body ?? "";
        return {
          content: [{ type: "text", text: syllabus }],
          details: { syllabus_body: syllabus },
        };
      },
    },
    {
      name: "canvas_get_course_modules",
      label: "Get Course Modules",
      description: "Get modules for a course",
      parameters: Type.Object({
        course_id: Type.Number({ description: "Course ID" }),
        include: Type.Optional(
          Type.Array(Type.String(), {
            description: 'Optional data to include (e.g. ["items"])',
          })
        ),
      }),
      async execute(_id, params) {
        const queryParams: Record<string, unknown> = { per_page: 100 };
        if (params.include) queryParams["include[]"] = params.include;

        const items = await client.get<Module[]>(
          `/api/v1/courses/${params.course_id}/modules`,
          queryParams
        );
        return {
          content: [{ type: "text", text: JSON.stringify(items, null, 2) }],
          details: items,
        };
      },
    },
    {
      name: "canvas_get_module_items",
      label: "Get Module Items",
      description: "Get items for a specific module in a course",
      parameters: Type.Object({
        course_id: Type.Number({ description: "Course ID" }),
        module_id: Type.Number({ description: "Module ID" }),
      }),
      async execute(_id, params) {
        const items = await client.get<ModuleItem[]>(
          `/api/v1/courses/${params.course_id}/modules/${params.module_id}/items`
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
