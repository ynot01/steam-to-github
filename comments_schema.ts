// Generated with https://transform.tools/json-schema-to-typescript
// Schema from https://docs.github.com/en/rest/issues/comments?apiVersion=2022-11-28#list-issue-comments-for-a-repository
/**
 * How the author is associated with the repository.
 */
export type AuthorAssociation =
  | "COLLABORATOR"
  | "CONTRIBUTOR"
  | "FIRST_TIMER"
  | "FIRST_TIME_CONTRIBUTOR"
  | "MANNEQUIN"
  | "MEMBER"
  | "NONE"
  | "OWNER"
/**
 * GitHub apps are a new way to extend GitHub. They can be installed directly on organizations and user accounts and granted access to specific repositories. They come with granular permissions and built-in webhooks. GitHub apps are first class actors within GitHub.
 */
export type GitHubApp = {
  /**
   * Unique identifier of the GitHub app
   */
  id: number
  /**
   * The slug name of the GitHub app
   */
  slug?: string
  node_id: string
  client_id?: string
  owner: SimpleUser1 | Enterprise
  /**
   * The name of the GitHub app
   */
  name: string
  description: string | null
  external_url: string
  html_url: string
  created_at: string
  updated_at: string
  /**
   * The set of permissions for the GitHub app
   */
  permissions: {
    issues?: string
    checks?: string
    metadata?: string
    contents?: string
    deployments?: string
  }
  /**
   * The list of events for the GitHub app. Note that the `installation_target`, `security_advisory`, and `meta` events are not included because they are global events and not specific to an installation.
   */
  events: string[]
  /**
   * The number of installations associated with the GitHub app. Only returned when the integration is requesting details about itself.
   */
  installations_count?: number
  [k: string]: unknown
} | null
export type MySchema = IssueComment[]

/**
 * Comments provide a way for people to collaborate on an issue.
 */
export interface IssueComment {
  /**
   * Unique identifier of the issue comment
   */
  id: number
  node_id: string
  /**
   * URL for the issue comment
   */
  url: string
  /**
   * Contents of the issue comment
   */
  body?: string
  body_text?: string
  body_html?: string
  html_url: string
  user: null | SimpleUser
  created_at: string
  updated_at: string
  issue_url: string
  author_association: AuthorAssociation
  performed_via_github_app?: null | GitHubApp
  reactions?: ReactionRollup
  [k: string]: unknown
}
/**
 * A GitHub user.
 */
export interface SimpleUser {
  name?: string | null
  email?: string | null
  login: string
  id: number
  node_id: string
  avatar_url: string
  gravatar_id: string | null
  url: string
  html_url: string
  followers_url: string
  following_url: string
  gists_url: string
  starred_url: string
  subscriptions_url: string
  organizations_url: string
  repos_url: string
  events_url: string
  received_events_url: string
  type: string
  site_admin: boolean
  starred_at?: string
  user_view_type?: string
  [k: string]: unknown
}
/**
 * A GitHub user.
 */
export interface SimpleUser1 {
  name?: string | null
  email?: string | null
  login: string
  id: number
  node_id: string
  avatar_url: string
  gravatar_id: string | null
  url: string
  html_url: string
  followers_url: string
  following_url: string
  gists_url: string
  starred_url: string
  subscriptions_url: string
  organizations_url: string
  repos_url: string
  events_url: string
  received_events_url: string
  type: string
  site_admin: boolean
  starred_at?: string
  user_view_type?: string
  [k: string]: unknown
}
/**
 * An enterprise on GitHub.
 */
export interface Enterprise {
  /**
   * A short description of the enterprise.
   */
  description?: string | null
  html_url: string
  /**
   * The enterprise's website URL.
   */
  website_url?: string | null
  /**
   * Unique identifier of the enterprise
   */
  id: number
  node_id: string
  /**
   * The name of the enterprise.
   */
  name: string
  /**
   * The slug url identifier for the enterprise.
   */
  slug: string
  created_at: string | null
  updated_at: string | null
  avatar_url: string
  [k: string]: unknown
}
export interface ReactionRollup {
  url: string
  total_count: number
  "+1": number
  "-1": number
  laugh: number
  confused: number
  heart: number
  hooray: number
  eyes: number
  rocket: number
  [k: string]: unknown
}
