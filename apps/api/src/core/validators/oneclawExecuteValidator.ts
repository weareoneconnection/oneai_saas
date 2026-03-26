import oneclawExecuteSchema from "../../schemas/oneclaw-execute.schema.json" with { type: "json" };
import { createAjvValidator } from "./createAjvValidator.js";

export const oneclawExecuteValidator = createAjvValidator(oneclawExecuteSchema);