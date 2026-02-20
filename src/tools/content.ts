import { Type } from "@sinclair/typebox";
import type { CanvasClient } from "../canvas-client.js";
import { paginate } from "../canvas-client.js";
import type {
  Announcement,
  CanvasTool,
  Page,
  Submission,
} from "../types.js";

export function createContentTools(client: CanvasClient): CanvasTool[] {
  return [
    {
      name: "canvas_get_page",
      label: "Get Page",
      description:
        'Get a single page by its URL slug (e.g. "kurshandbok", "examination")',
      parameters: Type.Object({
        course_id: Type.Number({ description: "Course ID" }),
        page_slug: Type.String({
          description: 'Page URL slug (e.g. "kurshandbok")',
        }),
      }),
      async execute(_id, params) {
        const result = await client.get<Page>(
          `/api/v1/courses/${params.course_id}/pages/${params.page_slug}`
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          details: result,
        };
      },
    },
    {
      name: "canvas_list_submissions",
      label: "List Submissions",
      description:
        "List the current user's submissions for a course, including grades and feedback",
      parameters: Type.Object({
        course_id: Type.Number({ description: "Course ID" }),
        include: Type.Optional(
          Type.Array(Type.String(), {
            description:
              'Optional data to include (e.g. ["assignment", "submission_comments"])',
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
          "student_ids[]": "self",
        };
        if (params.include) queryParams["include[]"] = params.include;

        const items = await client.getAllPages<Submission>(
          `/api/v1/courses/${params.course_id}/students/submissions`,
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
      name: "canvas_list_announcements",
      label: "List Announcements",
      description: "List announcements for one or more courses",
      parameters: Type.Object({
        course_ids: Type.Array(Type.Number(), {
          description: "List of course IDs to fetch announcements for",
        }),
        page: Type.Optional(
          Type.Number({ description: "Page number (1-indexed)", default: 1 })
        ),
        items_per_page: Type.Optional(
          Type.Number({ description: "Items per page", default: 10 })
        ),
      }),
      async execute(_id, params) {
        const contextCodes = (params.course_ids as number[]).map(
          (id) => `course_${id}`
        );
        const items = await client.getAllPages<Announcement>(
          "/api/v1/announcements",
          { "context_codes[]": contextCodes }
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
}
