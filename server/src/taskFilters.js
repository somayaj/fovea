/** SQL fragment — append after `type = 'task'` in WHERE clauses. */
export const ACTIVE_TASK_AND = "AND completed_at IS NULL AND archived = 0";

/** SQL fragment — append after node filters for ideas and other node types. */
export const ACTIVE_NODE_AND = "AND archived = 0";
