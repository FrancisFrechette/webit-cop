// Types de base

export type ID = string;

export interface BaseMetadata {
  id: ID;
  orgId: ID;          // toujours aligné avec le path Firestore
  createdAt: string;  // ISO string ou sérialisation Timestamp
  createdBy: ID;
  updatedAt: string;
  updatedBy: ID;
  version: number;    // version courante de la ressource
}

export interface VersionSnapshot<TPayload> {
  version: number;
  createdAt: string;
  createdBy: ID;
  comment?: string;
  payload: TPayload;
}

// Multi-langue v1

export type LocaleCode = 'fr-CA' | 'en-US' | 'fr-FR' | string;

export interface LocalizedContentRef {
  id: string;
  locale: LocaleCode;
}

// Organizations & Users

/** NOTE: RBAC multi-tenant: les rôles sont définis par org, pas globalement. */
export type OrgRole =
  | 'owner'
  | 'admin'
  | 'editor'
  | 'author'
  | 'viewer';

export interface OrgMember {
  userId: string;
  userEmail: string;
  userDisplayName?: string | null;
  role: OrgRole;
  // TODO plus tard: locales autorisées, scopes plus fins, etc.
}

export interface Organization extends BaseMetadata {
  name: string;
  slug: string;
  plan: 'free' | 'pro' | 'enterprise';
  isActive: boolean;
  defaultLocale: LocaleCode;
  supportedLocales: LocaleCode[];
  /** Membres de l'organisation avec leur rôle (RBAC v10). */
  members?: OrgMember[];
}

export type UserRole = 'owner' | 'admin' | 'editor' | 'viewer';

export interface User extends BaseMetadata {
  email: string;
  displayName: string;
  photoURL?: string;
  // map orgId -> rôle dans cette organisation
  rolesByOrg: Record<ID, UserRole>;
}

// Blocs de contenu (éditeur de blocs)

export type BlockType = 'hero' | 'richText' | 'faq' | 'cta';

export interface BaseBlock {
  id: ID;
  type: BlockType;
}

export interface HeroBlock extends BaseBlock {
  type: 'hero';
  title: string;
  subtitle?: string;
  backgroundImageUrl?: string;
}

export interface RichTextBlock extends BaseBlock {
  type: 'richText';
  html: string; // ou markdown si besoin
}

export interface FAQBlock extends BaseBlock {
  type: 'faq';
  items: {
    question: string;
    answer: string;
  }[];
}

export interface CtaBlock extends BaseBlock {
  type: 'cta';
  label: string;
  url: string;
}

export type ContentBlock = HeroBlock | RichTextBlock | FAQBlock | CtaBlock;

// Pages & Articles avec versioning

export interface PageContentPayload {
  title: string;
  slug: string;
  blocks: ContentBlock[];
  seoTitle?: string;
  seoDescription?: string;
  seoCanonicalUrl?: string;
}

export type ContentStatus = 'draft' | 'preview' | 'published' | 'archived';

/** NOTE: editorialStatus complète le status de publication, il ne le remplace pas. */
export type EditorialReviewStatus =
  | 'not_needed'
  | 'in_review'
  | 'changes_requested'
  | 'approved';

export interface ContentAssignment {
  assigneeUserId?: string | null;
  assigneeUserName?: string | null;
}

export interface ContentComment {
  id: string;
  orgId: string;
  type: 'page' | 'article';
  contentId: string;
  authorUserId?: string | null;
  authorUserName?: string | null;
  createdAt: string;
  updatedAt: string;
  body: string;
  resolved: boolean;
  resolvedAt?: string | null;
  resolvedByUserId?: string | null;
  resolvedByUserName?: string | null;
}

export interface Page extends BaseMetadata {
  type: 'page';
  orgId: ID;
  status: ContentStatus;
  current: PageContentPayload;
  history?: VersionSnapshot<PageContentPayload>[];
  locale: LocaleCode;
  /** NOTE: translationGroupId permet de lier les versions multi-langues d'un même contenu. */
  translationGroupId?: string | null;
  translations?: LocalizedContentRef[];
  /** NOTE: publishAt/unpublishAt contrôlent l'état publié dans le temps, sans remplacer le status. */
  publishAt?: string | null;
  unpublishAt?: string | null;
  editorialStatus?: EditorialReviewStatus | null;
  assignment?: ContentAssignment | null;
}

export interface ArticleContentPayload extends PageContentPayload {
  /** Résumé court pour listing / SEO. */
  excerpt?: string;
  publishedAt?: string;
  authorId?: ID;
  /** Noms de tags (legacy / fallback). Préférer tagIds sur Article. */
  tags?: string[];
}

/** TODO: unique (orgId, slug) sur Category. */
export interface Category {
  id: ID;
  orgId: ID;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryInput {
  name: string;
  slug: string;
}

/** TODO: unique (orgId, slug) sur Tag. */
export interface Tag {
  id: ID;
  orgId: ID;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export interface TagInput {
  name: string;
  slug: string;
}

export interface Article extends BaseMetadata {
  type: 'article';
  orgId: ID;
  status: ContentStatus;
  current: ArticleContentPayload;
  history?: VersionSnapshot<ArticleContentPayload>[];
  locale: LocaleCode;
  translationGroupId?: string | null;
  translations?: LocalizedContentRef[];
  publishAt?: string | null;
  unpublishAt?: string | null;
  editorialStatus?: EditorialReviewStatus | null;
  assignment?: ContentAssignment | null;
  categoryId?: string | null;
  /** Liste d’IDs de tags. */
  tagIds?: string[];
  /** Auteur (pointe vers User si besoin). TODO: normaliser les auteurs dans une collection dédiée si besoin (multi-auteurs, bios, avatars). */
  authorId?: string | null;
  /** Snapshot du nom au moment de la publication. */
  authorName?: string | null;
}

export interface ArticleStatusChange {
  id: string;
  articleId: string;
  orgId: string;
  fromStatus?: ContentStatus | null;
  toStatus: ContentStatus;
  changedAt: string;
  changedByUserId?: string | null;
  changedByUserName?: string | null;
}

// Versions de contenu (pages & articles) pour comparaison et rollback

export type PageVersionPayload = PageContentPayload;
export type ArticleVersionPayload = ArticleContentPayload;

export interface ContentVersion<TContent = PageContentPayload | ArticleContentPayload> {
  id: string;
  orgId: string;
  type: 'page' | 'article';
  contentId: string;
  versionNumber: number;
  createdAt: string;
  createdByUserId?: string | null;
  createdByUserName?: string | null;
  payload: TContent;
}
