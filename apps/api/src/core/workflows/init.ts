// 只要 import 进来就会触发各 workflow 的 registerWorkflow()
import "./missionWorkflow.js";
import "./tweetWorkflow.js";
import "./waocChatWorkflow.js";   // ✅ 新增
import "./waocSocialPostWorkflow.js"; // ✅ 新增
import "./missionEnhancerWorkflow.js";
import "./dailyVibeWorkflow.js";
import "./waocNarrativeWorkflow.js";
import "./waocBrainWorkflow.js";
import "./missionOsWorkflow.js";
import "./identityWorkflow.js";
// 未来加：
// import "./identityWorkflow.js";