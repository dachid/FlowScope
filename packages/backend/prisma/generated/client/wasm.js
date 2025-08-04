
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  email: 'email',
  username: 'username',
  name: 'name',
  company: 'company',
  passwordHash: 'passwordHash',
  role: 'role',
  isActive: 'isActive',
  isEmailVerified: 'isEmailVerified',
  emailVerificationToken: 'emailVerificationToken',
  passwordResetToken: 'passwordResetToken',
  passwordResetExpires: 'passwordResetExpires',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  lastActiveAt: 'lastActiveAt'
};

exports.Prisma.TeamScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  settings: 'settings',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TeamMemberScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  teamId: 'teamId',
  role: 'role',
  permissions: 'permissions',
  joinedAt: 'joinedAt',
  invitedBy: 'invitedBy'
};

exports.Prisma.ProjectScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  teamId: 'teamId',
  ownerId: 'ownerId',
  settings: 'settings',
  isPublic: 'isPublic',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ShareLinkScalarFieldEnum = {
  id: 'id',
  shareToken: 'shareToken',
  resourceType: 'resourceType',
  resourceId: 'resourceId',
  projectId: 'projectId',
  permissions: 'permissions',
  password: 'password',
  expiresAt: 'expiresAt',
  isActive: 'isActive',
  accessCount: 'accessCount',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  lastAccessedAt: 'lastAccessedAt'
};

exports.Prisma.CommentScalarFieldEnum = {
  id: 'id',
  content: 'content',
  resourceType: 'resourceType',
  resourceId: 'resourceId',
  projectId: 'projectId',
  authorId: 'authorId',
  parentId: 'parentId',
  isResolved: 'isResolved',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AnnotationScalarFieldEnum = {
  id: 'id',
  type: 'type',
  content: 'content',
  position: 'position',
  resourceType: 'resourceType',
  resourceId: 'resourceId',
  authorId: 'authorId',
  color: 'color',
  isVisible: 'isVisible',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PresenceRecordScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  resourceType: 'resourceType',
  resourceId: 'resourceId',
  status: 'status',
  cursor: 'cursor',
  selection: 'selection',
  lastSeen: 'lastSeen'
};

exports.Prisma.PromptScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  projectId: 'projectId',
  currentVersionId: 'currentVersionId',
  isPublic: 'isPublic',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PromptVersionScalarFieldEnum = {
  id: 'id',
  promptId: 'promptId',
  version: 'version',
  content: 'content',
  parentVersionId: 'parentVersionId',
  createdAt: 'createdAt',
  createdBy: 'createdBy',
  message: 'message',
  isActive: 'isActive',
  tags: 'tags'
};

exports.Prisma.SessionScalarFieldEnum = {
  id: 'id',
  name: 'name',
  startTime: 'startTime',
  endTime: 'endTime',
  status: 'status',
  metadata: 'metadata',
  userId: 'userId',
  projectId: 'projectId',
  isShared: 'isShared'
};

exports.Prisma.TraceDataScalarFieldEnum = {
  id: 'id',
  sessionId: 'sessionId',
  parentId: 'parentId',
  operation: 'operation',
  language: 'language',
  framework: 'framework',
  timestamp: 'timestamp',
  startTime: 'startTime',
  endTime: 'endTime',
  duration: 'duration',
  data: 'data',
  metadata: 'metadata',
  status: 'status',
  error: 'error',
  chainId: 'chainId',
  type: 'type'
};

exports.Prisma.ChainExecutionScalarFieldEnum = {
  id: 'id',
  sessionId: 'sessionId',
  promptId: 'promptId',
  promptVersionId: 'promptVersionId',
  startTime: 'startTime',
  endTime: 'endTime',
  status: 'status',
  input: 'input',
  output: 'output',
  error: 'error',
  metadata: 'metadata',
  tokenUsage: 'tokenUsage'
};

exports.Prisma.UserPreferencesScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  theme: 'theme',
  rightPanelTab: 'rightPanelTab',
  rightPanelCollapsed: 'rightPanelCollapsed',
  sidebarCollapsed: 'sidebarCollapsed',
  autoOpenPanelOnNodeClick: 'autoOpenPanelOnNodeClick',
  defaultSessionView: 'defaultSessionView',
  tracePageSize: 'tracePageSize',
  enableNotifications: 'enableNotifications',
  autoSave: 'autoSave',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.BookmarkScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  traceId: 'traceId',
  title: 'title',
  description: 'description',
  tags: 'tags',
  color: 'color',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.JsonNullValueInput = {
  JsonNull: Prisma.JsonNull
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};


exports.Prisma.ModelName = {
  User: 'User',
  Team: 'Team',
  TeamMember: 'TeamMember',
  Project: 'Project',
  ShareLink: 'ShareLink',
  Comment: 'Comment',
  Annotation: 'Annotation',
  PresenceRecord: 'PresenceRecord',
  Prompt: 'Prompt',
  PromptVersion: 'PromptVersion',
  Session: 'Session',
  TraceData: 'TraceData',
  ChainExecution: 'ChainExecution',
  UserPreferences: 'UserPreferences',
  Bookmark: 'Bookmark'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
