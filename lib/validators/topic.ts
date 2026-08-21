import { z } from "zod";
import { TOPIC_MAX_LENGTH } from "../constants";

const topicName = z
  .string()
  .trim()
  .min(1, "Topic name cannot be empty")
  .max(TOPIC_MAX_LENGTH, `Topic name cannot exceed ${TOPIC_MAX_LENGTH} characters`);

export const createTopicSchema = z.object({ name: topicName });
export const updateTopicSchema = z.object({ name: topicName });

export type CreateTopicInput = z.infer<typeof createTopicSchema>;
