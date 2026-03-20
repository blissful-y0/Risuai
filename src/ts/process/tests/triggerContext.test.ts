import { describe, expect, test } from "vitest";
import { get } from "svelte/store";
import { CurrentTriggerIdStore } from "src/ts/stores.svelte";
import { deriveTriggerIdFromOrigin, withTemporaryTriggerId } from "../triggerContext";

describe("deriveTriggerIdFromOrigin", () => {
    test("prefers explicit risu-id on clicked element", () => {
        const wrapper = document.createElement("div");
        wrapper.setAttribute("data-chat-index", "8");

        const button = document.createElement("button");
        button.setAttribute("risu-id", "custom-id");
        wrapper.appendChild(button);

        expect(deriveTriggerIdFromOrigin(button)).toBe("custom-id");
    });

    test("falls back to closest message data-chat-index", () => {
        const wrapper = document.createElement("div");
        wrapper.setAttribute("data-chat-index", "12");

        const button = document.createElement("button");
        wrapper.appendChild(button);

        expect(deriveTriggerIdFromOrigin(button)).toBe("12");
    });

    test("falls back to closest message data-chat-id when index is unavailable", () => {
        const wrapper = document.createElement("div");
        wrapper.setAttribute("data-chat-id", "chat-123");

        const button = document.createElement("button");
        wrapper.appendChild(button);

        expect(deriveTriggerIdFromOrigin(button)).toBe("chat-123");
    });
});

describe("withTemporaryTriggerId", () => {
    test("sets and restores CurrentTriggerIdStore around async execution", async () => {
        CurrentTriggerIdStore.set("previous-id");

        const observed = await withTemporaryTriggerId("clicked-id", async () => {
            return get(CurrentTriggerIdStore);
        });

        expect(observed).toBe("clicked-id");
        expect(get(CurrentTriggerIdStore)).toBe("previous-id");
    });
});
