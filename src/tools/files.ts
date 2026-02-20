import { Type } from "@sinclair/typebox";
import type { CanvasClient } from "../canvas-client.js";
import { paginate } from "../canvas-client.js";
import type { CanvasFile, CanvasTool, Quiz } from "../types.js";

export function createFileTools(client: CanvasClient): CanvasTool[] {
  return [
    {
      name: "canvas_list_files",
      label: "List Files",
      description:
        "List files for a course or folder. Note: may return 403 for student accounts - use get_file with known IDs instead",
      parameters: Type.Object({
        course_id: Type.Optional(
          Type.Number({ description: "Course ID" })
        ),
        folder_id: Type.Optional(
          Type.Number({ description: "Folder ID" })
        ),
        page: Type.Optional(
          Type.Number({ description: "Page number (1-indexed)", default: 1 })
        ),
        items_per_page: Type.Optional(
          Type.Number({ description: "Items per page", default: 10 })
        ),
      }),
      async execute(_id, params) {
        let endpoint: string;
        if (params.course_id) {
          endpoint = `/api/v1/courses/${params.course_id}/files`;
        } else if (params.folder_id) {
          endpoint = `/api/v1/folders/${params.folder_id}/files`;
        } else {
          endpoint = "/api/v1/users/self/files";
        }

        const items = await client.getAllPages<CanvasFile>(endpoint);
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
      name: "canvas_get_file",
      label: "Get File",
      description:
        "Get a file by ID. Find file IDs from module items or page HTML.",
      parameters: Type.Object({
        course_id: Type.Number({ description: "Course ID" }),
        file_id: Type.Number({ description: "File ID" }),
      }),
      async execute(_id, params) {
        const result = await client.get<CanvasFile>(
          `/api/v1/courses/${params.course_id}/files/${params.file_id}`
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          details: result,
        };
      },
    },
    {
      name: "canvas_list_quizzes",
      label: "List Quizzes",
      description:
        "List quizzes for a course. Note: returns 404 if the institution uses New Quizzes (quiz_lti)",
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
        const items = await client.getAllPages<Quiz>(
          `/api/v1/courses/${params.course_id}/quizzes`
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
      name: "canvas_get_quiz",
      label: "Get Quiz",
      description:
        "Get a single quiz by ID. Note: returns 404 if the institution uses New Quizzes (quiz_lti)",
      parameters: Type.Object({
        course_id: Type.Number({ description: "Course ID" }),
        quiz_id: Type.Number({ description: "Quiz ID" }),
      }),
      async execute(_id, params) {
        const result = await client.get<Quiz>(
          `/api/v1/courses/${params.course_id}/quizzes/${params.quiz_id}`
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          details: result,
        };
      },
    },
  ];
}
