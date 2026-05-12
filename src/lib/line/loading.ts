import "server-only";
import { getMessagingClient } from "./client";

/**
 * Show LINE's "typing..." loading animation while `fn` is running.
 *
 * LINE auto-dismisses the indicator when:
 *  - any message is delivered to the user, OR
 *  - `loadingSeconds` elapses with no message
 *
 * To keep it visible for slow bot turns we refresh the indicator
 * up to `maxRounds` times. The animation always vanishes once the
 * bot sends its reply (so we don't need an explicit "stop" API).
 *
 * loadingSeconds must be a multiple of 5 between 5 and 60.
 */
export async function withLoadingAnimation<T>(
  lineUserId: string,
  fn: () => Promise<T>,
  options: { loadingSeconds?: number; maxRounds?: number } = {},
): Promise<T> {
  const loadingSeconds = options.loadingSeconds ?? 20;
  const maxRounds = options.maxRounds ?? 5;
  const client = getMessagingClient();

  let rounds = 0;
  let stopped = false;

  const fire = () => {
    if (stopped || rounds >= maxRounds) return;
    rounds += 1;
    client
      .showLoadingAnimation({ chatId: lineUserId, loadingSeconds })
      .catch((err) =>
        console.error("[loading] showLoadingAnimation failed", err),
      );
  };

  fire();

  const refreshMs = Math.floor(loadingSeconds * 1000 * 0.9);
  const timer = setInterval(() => {
    if (stopped || rounds >= maxRounds) {
      clearInterval(timer);
      return;
    }
    fire();
  }, refreshMs);

  try {
    return await fn();
  } finally {
    stopped = true;
    clearInterval(timer);
  }
}
