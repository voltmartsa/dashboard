import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { SubtaskSuggestion } from "@/types";

let client: Anthropic | null = null;

function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to .env to use AI subtask breakdown.",
    );
  }
  client ??= new Anthropic();
  return client;
}

const SUBTASK_TOOL: Anthropic.Tool = {
  name: "propose_subtasks",
  description:
    "Propose a list of concrete, actionable subtasks that break down the given parent task into smaller, completable steps.",
  strict: true,
  input_schema: {
    type: "object",
    properties: {
      subtasks: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: {
              type: "string",
              description:
                "Short, actionable subtask title starting with an imperative verb",
            },
            description: {
              type: "string",
              description: "One sentence of extra context or an acceptance detail",
            },
            priority: {
              type: "string",
              enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
            },
          },
          required: ["title", "description", "priority"],
          additionalProperties: false,
        },
      },
    },
    required: ["subtasks"],
    additionalProperties: false,
  },
};

export async function generateSubtaskSuggestions(input: {
  title: string;
  description?: string | null;
}): Promise<SubtaskSuggestion[]> {
  const anthropic = getClient();

  const message = await anthropic.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 2048,
    output_config: { effort: "low" },
    tools: [SUBTASK_TOOL],
    tool_choice: { type: "tool", name: "propose_subtasks" },
    messages: [
      {
        role: "user",
        content: `Break this task down into 3-8 concrete, actionable subtasks a person could complete one at a time.\n\nTitle: ${input.title}\nDescription: ${input.description || "(no additional description provided)"}`,
      },
    ],
  });

  const toolUse = message.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
  );
  if (!toolUse || toolUse.name !== "propose_subtasks") {
    throw new Error("Anthropic did not return structured subtasks");
  }

  const parsed = toolUse.input as { subtasks: SubtaskSuggestion[] };
  return parsed.subtasks;
}
