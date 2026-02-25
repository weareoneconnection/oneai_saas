import tweetSchema from "../../schemas/tweet.schema.json" with { type: "json" };
import { createAjvValidator } from "./createAjvValidator.js";

export const tweetValidator = createAjvValidator(tweetSchema);