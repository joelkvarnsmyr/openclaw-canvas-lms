# openclaw-canvas-lms

Canvas LMS integration plugin for [OpenClaw](https://openclaw.com). Provides 23 tools for accessing courses, assignments, grades, schedules, and more from any Canvas LMS instance. Includes optional TimeEdit cross-referencing for implicit deadline detection.

## Installation

```bash
openclaw plugins install @joelkvarnsmyr/openclaw-canvas-lms
```

Or from local path:
```bash
openclaw plugins install /path/to/openclaw-canvas-lms
```

## Configuration

Add to your `openclaw.json`:

```json
{
  "plugins": {
    "entries": {
      "canvas-lms": {
        "enabled": true,
        "config": {
          "canvasApiToken": "YOUR_CANVAS_API_TOKEN",
          "canvasBaseUrl": "https://canvas.instructure.com",
          "timeeditUrl": "https://cloud.timeedit.net/your/ics/url.ics"
        }
      }
    }
  }
}
```

### Getting a Canvas API Token

1. Log in to your Canvas instance
2. Go to Account > Settings
3. Scroll to "Approved Integrations"
4. Click "+ New Access Token"
5. Copy the token and add it to your config

### TimeEdit (Optional)

If your institution uses TimeEdit for scheduling, provide the ICS URL to enable the `canvas_timeedit_crossref` tool. This tool matches Canvas assignments to scheduled events and finds implicit deadlines for undated assignments.

## Tools

23 tools are registered:

- **Courses**: list_courses, get_course, get_course_syllabus, get_course_modules, get_module_items
- **Assignments**: list_assignments, get_assignment, list_assignment_groups
- **Content**: get_page, list_submissions, list_announcements
- **Discussions**: list_discussions, get_discussion_view
- **Calendar**: list_calendar_events, list_planner_items, timeedit_crossref
- **Enrollment**: get_enrollments, get_tabs, list_favorites
- **Files**: list_files, get_file, list_quizzes, get_quiz

## Development

```bash
npm install
npm run build
```

## License

MIT
