import { get } from "svelte/store";
import { CurrentTriggerIdStore } from "../stores.svelte";

export function deriveTriggerIdFromOrigin(origin: HTMLElement): string | undefined {
    const explicitId = origin.getAttribute("risu-id");
    if (explicitId) {
        return explicitId;
    }

    const messageRoot = origin.closest<HTMLElement>("[data-chat-index], [data-chat-id]");
    if (!messageRoot) {
        return undefined;
    }

    return messageRoot.getAttribute("data-chat-index")
        || messageRoot.getAttribute("data-chat-id")
        || undefined;
}

export async function withTemporaryTriggerId<T>(
    triggerId: string | undefined,
    fn: () => Promise<T>
): Promise<T> {
    const previousTriggerId = get(CurrentTriggerIdStore);
    CurrentTriggerIdStore.set(triggerId || null);
    try {
        return await fn();
    } finally {
        CurrentTriggerIdStore.set(previousTriggerId);
    }
}
