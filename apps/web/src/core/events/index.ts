import "server-only";
import type { SignupContext } from "@/core/tracking/request";

/**
 * In-process event bus. Modules publish domain events here and other
 * modules subscribe, so modules never import each other's internals.
 *
 * Handlers run sequentially and a failing handler is logged, never
 * re-thrown: one module's bug must not break sign-in for everyone.
 */
export type DomainEvents = {
  "user.registered": { userId: string; email: string | null; context: SignupContext };
  "discord.linked": { userId: string; discordId: string; accessToken: string | null };
  "discord.joined": { userId: string; discordId: string };
  "points.awarded": { userId: string; amount: number; reason: string };
};

type EventName = keyof DomainEvents;
type Handler<E extends EventName> = (payload: DomainEvents[E]) => Promise<void> | void;

const globalForBus = globalThis as unknown as {
  __pandoraHandlers?: Map<EventName, Handler<EventName>[]>;
};
const handlers = (globalForBus.__pandoraHandlers ??= new Map());

export function on<E extends EventName>(event: E, handler: Handler<E>) {
  const list = handlers.get(event) ?? [];
  list.push(handler as Handler<EventName>);
  handlers.set(event, list);
}

export async function emit<E extends EventName>(event: E, payload: DomainEvents[E]) {
  for (const handler of handlers.get(event) ?? []) {
    try {
      await handler(payload);
    } catch (err) {
      console.error(`[events] handler for "${event}" failed`, err);
    }
  }
}
