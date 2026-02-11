# Workflow Orchestration

### 1) Plan mode by default

* For non-trivial work (>=3 steps or design decisions), plan first.
* If implementation drifts or fails, stop and re-plan.
* Include verification steps in the plan (not only implementation).

### 2) Task tracking discipline

1. Create one run file per task in `tasks/runs/YYYY-MM-DD_<slug>.md`
2. Keep detailed plan/progress/review inside the run file.
3. Keep `tasks/todo.md` as a compact index only (Active/Backlog/Done latest 20).
4. Close completed runs properly.
5. After corrections/failures, add prevention rules in `tasks/lessons.md`.

### 3) Verification before completion

* Validate changed behavior.
* Confirm diffs are minimal.
* Ask: "Would this pass staff-level review?"

### 4) Elegance and pragmatism

* Prefer simple maintainable solutions.
* Refactor hacky solutions if impact is high.
* Avoid over-engineering.
