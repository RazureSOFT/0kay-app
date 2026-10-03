export interface SessionInfo {
  authenticated: boolean;
  method?: string;
  requires_auth?: boolean;
  core_id?: string;
  lan_enabled?: boolean;
}

export interface Health {
  status: string;
  plugins: number;
  healthy: number;
}

export interface Emotion {
  valence: number;
  arousal: number;
  connection: number;
  irritation: number;
}

export interface PlatformState {
  source?: string;
  emotion?: Emotion;
  mentalEnergy?: number;
  isSleeping?: boolean;
  activeTasks?: any[];
  onlineAgents?: number;
  totalAgents?: number;
  agentIds?: string[];
  pluginCount?: number;
  healthyPlugins?: number;
  updatedAt?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  requestId?: string;
  taskId?: string;
  images?: string[];
  files?: { name: string; url: string }[];
  emotion?: Emotion;
  mentalEnergy?: number;
  thinkSummary?: any;
  error?: string;
  createdAt?: number;
  streaming?: boolean;
}

export interface LifeNotification {
  id: string;
  text: string;
  session_id?: string;
  created_at?: string;
}

export interface ProviderModel {
  id: string;
  name?: string;
  type?: string;
}

export interface Provider {
  id: string;
  provider: string;
  name?: string;
  api_key?: string;
  api_key_masked?: string;
  base_url?: string;
  models?: (string | ProviderModel)[];
  disabled_models?: string[];
  default_model?: string;
  enabled?: boolean;
  format?: '' | 'openai' | 'anthropic';
}

export interface SettingsField {
  key: string;
  label?: string;
  type: 'bool' | 'number' | 'text' | 'select' | 'model' | 'models' | 'test' | string;
  options?: { value: string; label?: string; options?: { value: string; label?: string }[] }[];
  placeholder?: string;
  description?: string;
  default?: any;
  min?: number;
  max?: number;
}

export interface SettingsSection {
  id: string;
  label?: string;
  icon?: string;
  order?: number;
  description?: string;
  fields?: SettingsField[];
  plugin_id?: string;
  plugin_name?: string;
  values?: Record<string, any>;
}

export interface PluginRow {
  plugin_id?: string;
  name: string;
  version?: string;
  type?: string;
  capabilities?: string[];
  status?: string;
  active_tasks?: number;
  disabled?: boolean;
}

export interface AgentRow {
  plugin_id?: string;
  name: string;
  version?: string;
  address?: string;
  status?: string;
  active_tasks?: number;
  missing_dependencies?: string[];
  last_heartbeat_age_seconds?: number;
  host?: Record<string, any>;
}

export interface TaskRow {
  task_id: string;
  caller_id?: string;
  session_id?: string;
  parent_id?: string;
  kind?: string;
  prompt?: string;
  state?: string;
  result?: string;
  error?: string;
  created_at?: string;
  updated_at?: string;
  [k: string]: any;
}

export interface ApprovalRow {
  id: string;
  tool?: string;
  detail?: string;
  session_id?: string;
  created_at?: string;
  executor_id?: string;
  [k: string]: any;
}

export interface QuestionRow {
  id: string;
  question?: string;
  text?: string;
  options?: string[];
  session_id?: string;
  executor_id?: string;
  [k: string]: any;
}

export interface MemoryRow {
  id: string;
  text?: string;
  content?: string;
  tier?: string;
  importance?: number;
  created_at?: string;
  score?: number;
  [k: string]: any;
}

export interface Usage {
  total_tokens?: number;
  by_model?: Record<string, number>;
  by_day?: Record<string, number>;
  [k: string]: any;
}
