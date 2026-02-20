import { Type } from "@sinclair/typebox";
import type { CanvasClient } from "../canvas-client.js";
import { paginate } from "../canvas-client.js";
import type { CanvasTool, Discussion } from "../types.js";

export function createDiscussionTools(client: CanvasClient): CanvasTool[] {
  return [
    {
      name: "canvas_list_discussions",
      label: "List Discussions",
      description: "List discussion topics for a course",
      parameters: Type.Object({
        course_id: Type.Number({ description: "Course ID" }),
        page: Type.Optional(
          Type.Number({ description: "Page number (1-indexed)", default: 1 })
        ),
        items_per_page: Type.Optional(
          Type.Number({ description: "Items per page", default: 10 })
        ),
      }),
      async execute(_id, params) {
        const items = await client.getAllPages<Discussion>(
          `/api/v1/courses/${params.course_id}/discussion_topics`
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
      name: "canvas_get_discussion_view",
      label: "Get Discussion View",
      description:
        "Get the full view of a discussion topic including all replies",
      parameters: Type.Object({
        course_id: Type.Number({ description: "Course ID" }),
        discussion_id: Type.Number({ description: "Discussion topic ID" }),
      }),
      async execute(_id, params) {
        const result = await client.get(
          `/api/v1/courses/${params.course_id}/discussion_topics/${params.discussion_id}/view`
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          details: result,
        };
      },
    },
  ];
}
