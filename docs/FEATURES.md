# Features

Everything the app does, page by page. Each feature is also covered by the API (see [API.md](API.md)).

## Todo fields

| Field | Required | Details |
|---|---|---|
| Title | Yes | 1 to 200 characters. Leading and trailing spaces are trimmed. |
| Description | No | Up to 2000 characters. |
| Priority | No | Low, Medium (default) or High. |
| Due date | No | A calendar date. Can be cleared. |
| Completed | No | Starts as not completed. |

Each todo also gets a unique id, a created time and a last-updated time automatically.

## List page (`/`)

### Add a todo
- Form with title, description, priority and due date.
- The form clears after a successful add.
- If the server rejects the input (for example, a blank title), the reason is shown in a red box above the button and nothing is added.

### Complete and uncomplete
- Tick the checkbox next to a todo to mark it done. Completed todos have their title struck through.
- Untick it to mark it active again.

### Delete
- The **Delete** button asks for confirmation, then removes the todo.

### Search
- The search box matches against both title and description, ignoring upper/lower case.
- Results update about 300 ms after you stop typing.

### Filter
- **Status tabs:** All, Active, Completed.
- **Priority dropdown:** All priorities, High, Medium, Low.
- Search, status and priority filters can be combined.

### Sort
| Option | Behaviour |
|---|---|
| Newest first (default) | By creation time, newest at the top |
| Oldest first | By creation time, oldest at the top |
| Due date (soonest) | Earliest due date first; todos without a due date are listed last |
| Priority (high first) | High, then Medium, then Low |
| Title (A-Z) | Alphabetical, ignoring case |

### Overdue highlight
- A todo that is not completed and whose due date is before today is shown with a red **Overdue** label. Completed todos are never marked overdue.

### Result count and empty states
- The number of todos currently shown is displayed above the list.
- With no todos at all, a prompt to add the first one is shown.
- If filters hide every todo, a "No todos match your filters" message appears with a **Clear filters** button.

### Loading and errors
- A loading message is shown while todos are fetched.
- If the API cannot be reached, a red banner explains that the backend may not be running.

### Open a todo
- Each title is a link to the detail page for that todo.

## Detail page (`/todo.html?id=<todo id>`)

The page reads the `id` query parameter, loads that todo and shows:
- title and an **Active** / **Completed** status label
- priority badge and due date (with the Overdue label when it applies)
- description, or "No description."
- created time, last-updated time and the todo's id

### Actions
- **Mark as done / Mark as not done** toggles completion.
- **Edit** replaces the view with a form (title, description, priority, due date). **Save changes** updates the todo; **Cancel** discards the edit. Clearing the due date field removes the due date.
- **Delete** asks for confirmation, deletes the todo and returns to the list page.
- **Back to all todos** returns to the list page.

### Edge cases
| Situation | What the page shows |
|---|---|
| No `id` in the URL | "No todo id was provided in the URL." |
| `id` that does not exist (for example, already deleted) | "Todo not found" |
| API unreachable | A red error message |

The browser tab title is set to the todo's title once it has loaded.