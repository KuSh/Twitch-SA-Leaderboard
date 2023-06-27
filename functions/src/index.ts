import { logger, region } from "firebase-functions";
import { Agent } from "https";
import fetch from "node-fetch";

type BaseEvent<T> = {
  type: T;
  timestamp: number;
  name: string;
  display_name: string;
};

export const BattleRoyaleVictoryType = "battleroyale:victory";
export const MarblesVictoryType = "marbles:victory";
export const BasketBallVictoryType = "basketball:victory";
export const DuelVictoryType = "duel:victory";

export type BattleRoyaleVictory = BaseEvent<typeof BattleRoyaleVictoryType>;
export type MarblesVictory = BaseEvent<typeof MarblesVictoryType>;
export type BasketBallVictory = BaseEvent<typeof BasketBallVictoryType>;
export type DuelVictory = BaseEvent<typeof DuelVictoryType>;

export type Event =
  | BattleRoyaleVictory
  | MarblesVictory
  | BasketBallVictory
  | DuelVictory;

const agent = new Agent({ keepAlive: true });

export const onCreateEvent = region("europe-west1")
  .runWith({ secrets: ["GITHUB_TOKEN"] })
  .firestore.document("events/{docId}")
  .onCreate(async (change) => {
    const { GITHUB_REPOSITORY, GITHUB_TOKEN, GITHUB_WORKFLOW } = process.env;
    const data = change.data();

    if ("type" in data === false || data["type"] !== "battleroyale:victory") {
      return;
    }

    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPOSITORY}/actions/workflows/${GITHUB_WORKFLOW}/dispatches`,
      {
        agent,
        body: JSON.stringify({ ref: "main" }),
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          "Content-Type": "application/json",
        },
        method: "POST",
      }
    );

    if (!response.ok) {
      logger.error(
        `Status ${response.url} on ${response.status}`,
        await response.json()
      );
      return false;
    }

    return true;
  });
