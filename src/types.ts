export interface Course {
  id: number;
  name: string;
  course_code?: string;
  syllabus_body?: string;
  enrollment_term_id?: number;
  html_url?: string;
}

export interface Assignment {
  id: number;
  name: string;
  description?: string;
  due_at?: string;
  points_possible?: number;
  html_url?: string;
}

export interface Quiz {
  id: number;
  title: string;
  description?: string;
  due_at?: string;
  points_possible?: number;
  html_url?: string;
}

export interface Module {
  id: number;
  name: string;
  position?: number;
  items?: Record<string, unknown>[];
  state?: string;
  completed_at?: string;
  items_url?: string;
}

export interface ModuleItem {
  id: number;
  title: string;
  position?: number;
  indent?: number;
  quiz_lti?: boolean;
  type: string;
  module_id?: number;
  html_url?: string;
  content_id?: number;
  url?: string;
}

export interface Page {
  title?: string;
  body?: string;
  url?: string;
  created_at?: string;
  updated_at?: string;
  editing_roles?: string;
  published?: boolean;
  front_page?: boolean;
  html_url?: string;
}

export interface Submission {
  id: number;
  assignment_id?: number;
  assignment?: Record<string, unknown>;
  user_id?: number;
  grade?: string;
  score?: number;
  submitted_at?: string;
  graded_at?: string;
  workflow_state?: string;
  late?: boolean;
  missing?: boolean;
  excused?: boolean;
  submission_comments?: unknown[];
  html_url?: string;
}

export interface Announcement {
  id: number;
  title: string;
  message?: string;
  posted_at?: string;
  author?: Record<string, unknown>;
  html_url?: string;
  read_state?: string;
}

export interface Discussion {
  id: number;
  title: string;
  message?: string;
  posted_at?: string;
  author?: Record<string, unknown>;
  html_url?: string;
  read_state?: string;
  discussion_type?: string;
  published?: boolean;
}

export interface CalendarEvent {
  id: number;
  title?: string;
  description?: string;
  start_at?: string;
  end_at?: string;
  location_name?: string;
  context_code?: string;
  workflow_state?: string;
  html_url?: string;
}

export interface Enrollment {
  id: number;
  course_id?: number;
  type?: string;
  enrollment_state?: string;
  grades?: Record<string, unknown>;
  html_url?: string;
}

export interface AssignmentGroup {
  id: number;
  name?: string;
  position?: number;
  group_weight?: number;
  rules?: Record<string, unknown>;
}

export interface Tab {
  id: string;
  label?: string;
  type?: string;
  html_url?: string;
  position?: number;
  visibility?: string;
}

export interface CanvasFile {
  id: number;
  name?: string;
  display_name?: string;
  filename?: string;
  folder_id?: number;
  url?: string;
  size?: number;
  content_type?: string;
  mime_class?: string;
  created_at?: string;
  updated_at?: string;
  modified_at?: string;
  hidden?: boolean;
  locked?: boolean;
  thumbnail_url?: string;
  uuid?: string;
}

export interface Plannable {
  id: number;
  title: string;
  read_status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PlannerItem {
  due_at?: string;
  course_id?: number;
  context_type: string;
  context_name?: string;
  plannable_type: string;
  plannable: Plannable;
  html_url?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  next_page?: string;
  previous_page?: string;
  page?: number;
  total_pages?: number;
  total_items?: number;
  items_per_page?: number;
}

export interface CanvasPluginConfig {
  canvasApiToken: string;
  canvasBaseUrl: string;
  scheduleIcsUrl?: string;
  keywordMap?: Array<[string, string]>;
}

export interface ToolResult {
  content: Array<{ type: string; text: string }>;
  details?: unknown;
}

export interface CanvasTool {
  name: string;
  label: string;
  description: string;
  parameters: unknown;
  execute: (_id: string, params: Record<string, unknown>) => Promise<ToolResult>;
}

export interface IcsEvent {
  start?: Date;
  end?: Date;
  summary?: string;
  location?: string;
  description?: string;
}
