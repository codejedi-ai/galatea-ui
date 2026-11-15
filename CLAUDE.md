## Chain of command

Large goals run as a campaign (`/campaign <goal>`) with three levels:

1. **General manager (GM):** the main session, on Claude Fable. Owns the grand plan, splits work into workstreams, resolves conflicts, checks integration, and is the only level that talks to the user.
2. **Lead** (`.claude/agents/lead.md`, Opus): owns one workstream's tactics. Plans, then reviews the builder's work. Never edits files.
3. **Scout** (`.claude/agents/scout.md`, Haiku): read-only search. **Builder** (`.claude/agents/builder.md`, Sonnet): writes code and tests.

**Who may spawn whom:** GM → lead → scout/builder only. Leads never spawn leads; scouts and builders spawn nothing.

**File ownership:** each workstream owns its own file areas, and no two workstreams share one. Anyone who needs to touch files outside their area stops and reports to the level above.

**Fix limit:** a lead sends its builder at most 2 rounds of fixes, then reports APPROVED or BLOCKED.

**Small questions** can be answered directly, without a campaign.
