import { requireAuth } from "@/lib/auth";
import {
  type Article,
  type ArticleContentPayload,
  type Category,
  type CategoryInput,
  type ID,
  type Organization,
  type Page,
  type PageContentPayload,
  type Tag,
  type TagInput,
  type VersionSnapshot
} from "@/lib/domain";
import {
  type ArticleListResult,
  type ListArticlesOptions,
  createArticle,
  getArticle,
  listArticlesAll,
  listArticlesPaginated,
  saveArticle
} from "@/lib/firestore/articles";
import {
  createCategory,
  getCategoryById,
  listCategories
} from "@/lib/firestore/categories";
import { getOrganization } from "@/lib/firestore/organizations";
import {
  createPage,
  getPage,
  listPages,
  savePage
} from "@/lib/firestore/pages";
import {
  createTag,
  getTagById,
  getTagsByIds,
  listTags
} from "@/lib/firestore/tags";

export interface OrgRepositories {
  orgId: ID;
  organization: {
    get: () => Promise<Organization | null>;
  };
  pages: {
    get: (pageId: ID) => Promise<Page | null>;
    list: () => Promise<Page[]>;
    save: (page: Page) => Promise<void>;
    create: (params: {
      createdBy: ID;
      payload: PageContentPayload;
      status: Page["status"];
      history?: VersionSnapshot<PageContentPayload>[];
    }) => Promise<Page>;
  };
  articles: {
    get: (articleId: ID) => Promise<Article | null>;
    list: () => Promise<Article[]>;
    listPaginated: (options?: ListArticlesOptions) => Promise<ArticleListResult>;
    save: (article: Article) => Promise<void>;
    create: (params: {
      createdBy: ID;
      payload: ArticleContentPayload;
      status: Article["status"];
      history?: VersionSnapshot<ArticleContentPayload>[];
      categoryId?: string | null;
      tagIds?: string[];
      authorId?: string | null;
      authorName?: string | null;
    }) => Promise<Article>;
  };
  categories: {
    list: () => Promise<Category[]>;
    get: (categoryId: ID) => Promise<Category | null>;
    create: (input: CategoryInput) => Promise<Category>;
  };
  tags: {
    list: () => Promise<Tag[]>;
    get: (tagId: ID) => Promise<Tag | null>;
    getByIds: (tagIds: string[]) => Promise<Tag[]>;
    create: (input: TagInput) => Promise<Tag>;
  };
}

export const repositories = {
  /**
   * Point d'entrée bas niveau : orgs/{orgId}
   * Correspond physiquement à /organizations/{orgId}/... dans Firestore.
   */
  orgs(orgId: ID): OrgRepositories {
    return {
      orgId,
      organization: {
        get: () => getOrganization(orgId),
      },
      pages: {
        get: (pageId) => getPage(orgId, pageId),
        list: () => listPages(orgId),
        save: (page) => savePage({ ...page, orgId }),
        create: (params) =>
          createPage({
            orgId,
            createdBy: params.createdBy,
            payload: params.payload,
            status: params.status,
            history: params.history
          })
      },
      articles: {
        get: (articleId) => getArticle(orgId, articleId),
        list: () => listArticlesAll(orgId),
        listPaginated: (options) => listArticlesPaginated(orgId, options),
        save: (article) => saveArticle({ ...article, orgId }),
        create: (params) =>
          createArticle({
            orgId,
            createdBy: params.createdBy,
            payload: params.payload,
            status: params.status,
            history: params.history,
            categoryId: params.categoryId,
            tagIds: params.tagIds,
            authorId: params.authorId,
            authorName: params.authorName,
          })
      },
      categories: {
        list: () => listCategories(orgId),
        get: (categoryId) => getCategoryById(orgId, categoryId),
        create: (input) => createCategory(orgId, input),
      },
      tags: {
        list: () => listTags(orgId),
        get: (tagId) => getTagById(orgId, tagId),
        getByIds: (tagIds) => getTagsByIds(orgId, tagIds),
        create: (input) => createTag(orgId, input),
      },
    };
  },

  /**
   * Helpers tenant-aware basés sur le contexte courant (Custom Claims Firebase).
   * Usage typique côté route Next :
   *
   *   const repo = await repositories.currentOrg();
   *   const pages = await repo.pages.list();
   */
  async currentOrg(): Promise<OrgRepositories> {
    const { orgId } = await requireAuth();
    return this.orgs(orgId);
  },

  async currentOrgPages() {
    const repo = await this.currentOrg();
    return repo.pages;
  },

  async currentOrgArticles() {
    const repo = await this.currentOrg();
    return repo.articles;
  }
};

