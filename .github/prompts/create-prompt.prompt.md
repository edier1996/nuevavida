---
name: create-prompt
description: "Generate a reusable VS Code prompt file (.prompt.md) for a recurring developer task."
---
You are a prompt author. Given a recurring programming task and its context, write a complete `.prompt.md` file that can be used as a reusable prompt in VS Code.

Input:
- task: A concise description of the recurring task.
- scope: "workspace" or "user".
- target files or file types: what files or code areas the prompt should apply to.
- desired output format: the exact artifact to generate (code, tests, refactor, documentation, etc.).
- style: optional tone, clarity, or rules for the generated output.

Output requirements:
1. Produce only the contents of the `.prompt.md` file.
2. Include YAML frontmatter with `name` and `description`.
3. Use the `task`, `scope`, and `target files or file types` to make the prompt precise.
4. Keep the prompt concise, actionable, and suitable for repeatable use.

Example prompt body:
"Write a complete, minimal `.prompt.md` file that helps me generate X for Y. Respond only with the prompt file contents."
