'use client';

import type {
  Article,
  ArticleContentPayload,
  ArticleStatusChange,
  Category,
  ContentComment,
  ContentStatus,
  EditorialReviewStatus,
  Tag,
} from '@/lib/domain';
import type { ContentVersion } from '@/lib/domain';
import { getAuthHeaders } from '@/lib/http';
import {
  getEditorialStatusLabel,
  getEditorialStatusStyle,
  EDITORIAL_STATUS_LABELS,
} from '@/lib/utils/editorialStatus';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuthClient } from '@/lib/useAuthClient';
import { useCurrentOrg } from '@/lib/useCurrentOrg';

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

const STATUS_STYLES: Record<ContentStatus, string> = {
  draft: 'bg-slate-600/80 text-slate-200',
  preview: 'bg-amber-600/80 text-white',
  published: 'bg-emerald-600/80 text-white',
  archived: 'bg-slate-700/80 text-slate-400',
};

const STATUS_LABELS: Record<ContentStatus, string> = {
  draft: 'Brouillon',
  preview: 'Preview interne',
  published: 'Publié',
  archived: 'Archivé',
};

export default function ArticleEditPage({
  params,
}: {
  params: { articleId: string };
}) {
  const router = useRouter();
  const [article, setArticle] = useState<Article | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [metaCategoryId, setMetaCategoryId] = useState<string | null>(null);
  const [metaTagIds, setMetaTagIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingMeta, setSavingMeta] = useState(false);
  const [statusChanges, setStatusChanges] = useState<ArticleStatusChange[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [contentVersions, setContentVersions] = useState<ContentVersion<ArticleContentPayload>[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [compareVersion, setCompareVersion] = useState<ContentVersion<ArticleContentPayload> | null>(null);
  const [rollbackingVersion, setRollbackingVersion] = useState<number | null>(null);
  const [lastAutoSave, setLastAutoSave] = useState<string | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [publishAt, setPublishAt] = useState<string | null>(null);
  const [unpublishAt, setUnpublishAt] = useState<string | null>(null);
  const [creatingTranslation, setCreatingTranslation] = useState(false);
  const [comments, setComments] = useState<ContentComment[]>([]);
  const [commentBody, setCommentBody] = useState('');
  const [savingCollaboration, setSavingCollaboration] = useState(false);
  const [resolvingCommentId, setResolvingCommentId] = useState<string | null>(null);
  const { org: currentOrg } = useCurrentOrg();
  const { user: currentUser } = useAuthClient();

  const isSaving = savingStatus || savingMeta || isAutoSaving;
  const isNew = params.articleId === 'new';

  useEffect(() => {
    if (isNew) {
      router.replace('/articles');
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/orgs/current/articles/${params.articleId}`, {
          headers: { ...headers },
          credentials: 'include',
        });
        if (!cancelled && res.ok) {
          const data = (await res.json()) as Article;
          setArticle(data);
          setMetaCategoryId(data.categoryId ?? null);
          setMetaTagIds(data.tagIds ?? []);
          setPublishAt(data.publishAt ?? null);
          setUnpublishAt(data.unpublishAt ?? null);
        }
        if (!cancelled && res.ok && params.articleId) {
          const chRes = await fetch(
            `/api/orgs/current/articles/${params.articleId}/status-changes`,
            { headers: { ...(await getAuthHeaders()) }, credentials: 'include' }
          );
          if (chRes.ok) setStatusChanges((await chRes.json()) as ArticleStatusChange[]);
        }
        if (!cancelled && !res.ok) {
          if (res.status === 401 || res.status === 403) {
            setMessage({ type: 'error', text: 'Non autorisé.' });
          } else if (res.status === 404) {
            setArticle(null);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params.articleId, isNew, router]);

  useEffect(() => {
    if (!params.articleId || params.articleId === 'new') return;
    let cancelled = false;
    setVersionsLoading(true);
    (async () => {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch(
          `/api/orgs/current/articles/${params.articleId}/versions`,
          { headers: { ...headers }, credentials: 'include' }
        );
        if (!cancelled && res.ok) {
          const list = (await res.json()) as ContentVersion<ArticleContentPayload>[];
          setContentVersions(list);
        }
      } catch {
        if (!cancelled) setMessage({ type: 'error', text: 'Impossible de charger l’historique des versions.' });
      } finally {
        if (!cancelled) setVersionsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params.articleId]);

  useEffect(() => {
    if (isNew) return;
    let cancelled = false;
    (async () => {
      const headers = await getAuthHeaders();
      try {
        const [catRes, tagRes] = await Promise.all([
          fetch('/api/orgs/current/categories', { headers: { ...headers }, credentials: 'include' }),
          fetch('/api/orgs/current/tags', { headers: { ...headers }, credentials: 'include' }),
        ]);
        if (!cancelled && catRes.ok) setCategories((await catRes.json()) as Category[]);
        if (!cancelled && tagRes.ok) setTags((await tagRes.json()) as Tag[]);
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isNew]);

  useEffect(() => {
    if (!article?.id) return;
    let cancelled = false;
    (async () => {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch(
          `/api/orgs/current/articles/${article.id}/comments`,
          { headers: { ...headers }, credentials: 'include' }
        );
        if (!cancelled && res.ok) {
          const list = (await res.json()) as ContentComment[];
          setComments(list);
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [article?.id]);

  const articleRef = useRef(article);
  articleRef.current = article;
  const metaRef = useRef({ metaCategoryId, metaTagIds });
  metaRef.current = { metaCategoryId, metaTagIds };

  useEffect(() => {
    if (!article?.id || isNew || !['draft', 'preview'].includes(article?.status ?? '')) return;
    const interval = setInterval(async () => {
      const a = articleRef.current;
      const { metaCategoryId: cat, metaTagIds: tagIds } = metaRef.current;
      if (!a?.id) return;
      setIsAutoSaving(true);
      try {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/orgs/current/articles/${a.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...headers },
          credentials: 'include',
          body: JSON.stringify({
            payload: a.current,
            status: a.status,
            categoryId: cat,
            tagIds,
          }),
        });
        if (res.ok) {
          const updated = (await res.json()) as Article;
          setArticle(updated);
          setLastAutoSave(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
        }
      } catch {
        // ignore
      } finally {
        setIsAutoSaving(false);
      }
    }, 10_000);
    return () => clearInterval(interval);
  }, [article?.id, article?.status, isNew]);

  const updateStatus = useCallback(
    async (newStatus: ContentStatus) => {
      if (!article?.orgId || !article?.id) return;
      if (
        article.status === 'published' &&
        (newStatus === 'draft' || newStatus === 'archived')
      ) {
        const msg =
          newStatus === 'archived'
            ? 'Archiver cet article ? Il ne sera plus visible sur le blog.'
            : 'Repasser en brouillon ? L’article ne sera plus visible sur le blog.';
        if (!window.confirm(msg)) return;
      }
      setMessage(null);
      setSavingStatus(true);
      try {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/orgs/current/articles/${article.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...headers },
          credentials: 'include',
          body: JSON.stringify({
            payload: article.current,
            status: newStatus,
            categoryId: metaCategoryId,
            tagIds: metaTagIds,
            publishAt: publishAt ?? undefined,
            unpublishAt: unpublishAt ?? undefined,
          }),
        });
        if (!res.ok) {
          const err = (await res.json().catch(() => ({}))) as { error?: string };
          setMessage({ type: 'error', text: err.error ?? 'Erreur' });
          return;
        }
        const updated = (await res.json()) as Article;
        setArticle(updated);
        setPublishAt(updated.publishAt ?? null);
        setUnpublishAt(updated.unpublishAt ?? null);
        setMessage({ type: 'success', text: 'Statut mis à jour.' });
        const chRes = await fetch(
          `/api/orgs/current/articles/${article.id}/status-changes`,
          { headers: { ...(await getAuthHeaders()) }, credentials: 'include' }
        );
        if (chRes.ok) setStatusChanges((await chRes.json()) as ArticleStatusChange[]);
      } catch {
        setMessage({ type: 'error', text: 'Erreur réseau.' });
      } finally {
        setSavingStatus(false);
      }
    },
    [article, metaCategoryId, metaTagIds, publishAt, unpublishAt]
  );

  const handleRollback = useCallback(
    async (versionNumber: number) => {
      if (!article?.id) return;
      const confirmed = window.confirm(
        'Vous allez restaurer une ancienne version. Cette opération créera une nouvelle version et écrasera les modifications non sauvegardées. Continuer ?'
      );
      if (!confirmed) return;
      setMessage(null);
      setRollbackingVersion(versionNumber);
      try {
        const headers = await getAuthHeaders();
        const res = await fetch(
          `/api/orgs/current/articles/${article.id}/versions/rollback`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...headers },
            credentials: 'include',
            body: JSON.stringify({ versionNumber }),
          }
        );
        if (!res.ok) {
          const err = (await res.json().catch(() => ({}))) as { error?: string };
          setMessage({ type: 'error', text: err.error ?? 'Erreur lors de la restauration.' });
          return;
        }
        const updated = (await res.json()) as Article;
        setArticle(updated);
        setMetaCategoryId(updated.categoryId ?? null);
        setMetaTagIds(updated.tagIds ?? []);
        setCompareVersion(null);
        setMessage({ type: 'success', text: 'Version restaurée.' });
        const vRes = await fetch(
          `/api/orgs/current/articles/${article.id}/versions`,
          { headers: { ...(await getAuthHeaders()) }, credentials: 'include' }
        );
        if (vRes.ok) setContentVersions((await vRes.json()) as ContentVersion<ArticleContentPayload>[]);
      } catch {
        setMessage({ type: 'error', text: 'Erreur réseau.' });
      } finally {
        setRollbackingVersion(null);
      }
    },
    [article]
  );

  const saveMetadata = useCallback(async () => {
    if (!article?.id) return;
    setMessage(null);
    setSavingMeta(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/orgs/current/articles/${article.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...headers },
        credentials: 'include',
        body: JSON.stringify({
          payload: article.current,
          status: article.status,
          categoryId: metaCategoryId,
          tagIds: metaTagIds,
          publishAt: publishAt ?? undefined,
          unpublishAt: unpublishAt ?? undefined,
        }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        setMessage({ type: 'error', text: err.error ?? 'Erreur' });
        return;
      }
      const updated = (await res.json()) as Article;
      setArticle(updated);
      setPublishAt(updated.publishAt ?? null);
      setUnpublishAt(updated.unpublishAt ?? null);
      setMessage({ type: 'success', text: 'Métadonnées enregistrées.' });
    } catch {
      setMessage({ type: 'error', text: 'Erreur réseau.' });
    } finally {
      setSavingMeta(false);
    }
  }, [article, metaCategoryId, metaTagIds, publishAt, unpublishAt]);

  const updateCollaboration = useCallback(
    async (updates: { editorialStatus?: EditorialReviewStatus | null; assignment?: { assigneeUserId: string | null; assigneeUserName: string | null } | null }) => {
      if (!article?.id) return;
      setSavingCollaboration(true);
      setMessage(null);
      try {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/orgs/current/articles/${article.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...headers },
          credentials: 'include',
          body: JSON.stringify({
            payload: article.current,
            status: article.status,
            categoryId: metaCategoryId,
            tagIds: metaTagIds,
            publishAt: publishAt ?? undefined,
            unpublishAt: unpublishAt ?? undefined,
            editorialStatus: updates.editorialStatus !== undefined ? updates.editorialStatus : article.editorialStatus,
            assignment: updates.assignment !== undefined ? updates.assignment : article.assignment,
          }),
        });
        if (!res.ok) {
          const err = (await res.json().catch(() => ({}))) as { error?: string };
          setMessage({ type: 'error', text: err.error ?? 'Erreur' });
          return;
        }
        const updated = (await res.json()) as Article;
        setArticle(updated);
        setMessage({ type: 'success', text: 'Mis à jour.' });
      } catch {
        setMessage({ type: 'error', text: 'Erreur réseau.' });
      } finally {
        setSavingCollaboration(false);
      }
    },
    [article, metaCategoryId, metaTagIds, publishAt, unpublishAt]
  );

  if (isNew) return null;
  if (loading) {
    return (
      <div className="layout-container py-12">
        <p className="text-webit-fg-muted">Chargement…</p>
      </div>
    );
  }
  if (!article) {
    return (
      <div className="layout-container py-8">
        <p className="text-webit-fg-muted">Article introuvable.</p>
        <button
          type="button"
          className="btn-secondary mt-4"
          onClick={() => router.push('/articles')}
        >
          Retour aux articles
        </button>
      </div>
    );
  }

  const status = article.status;

  return (
    <div className="layout-container py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-3xl font-semibold text-white">
          Éditer l’article
        </h1>
          {article.editorialStatus && (
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getEditorialStatusStyle(article.editorialStatus)}`}
            >
              {getEditorialStatusLabel(article.editorialStatus)}
            </span>
          )}
        </div>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => router.push('/articles')}
        >
          Retour aux articles
        </button>
      </div>

      {message && (
        <p
          className={
            message.type === 'error'
              ? 'mb-4 text-webit-accent-rose'
              : 'mb-4 text-emerald-400'
          }
        >
          {message.text}
        </p>
      )}
      {lastAutoSave && (
        <p className="mb-4 text-xs text-webit-fg-muted">
          Brouillon enregistré automatiquement à {lastAutoSave}.
        </p>
      )}

      <div className="panel max-w-xl space-y-4">
        <p className="text-webit-fg-muted">
          Éditeur complet à venir (blocs, SEO, etc.). En attendant, vous pouvez
          gérer le statut de publication ci-dessous.
        </p>

        {/* Locale et traductions */}
        <div className="rounded-lg border border-webit-panel-border bg-slate-900/40 p-4">
          <p className="mb-2 text-sm font-medium text-white">Langue & traductions</p>
          <p className="mb-2 text-xs text-webit-fg-muted">
            Locale : <span className="font-mono text-white">{article.locale ?? 'fr-CA'}</span>
          </p>
          <div>
            <p className="mb-1 text-xs text-webit-fg-muted">Traductions liées</p>
            <ul className="mb-2 space-y-1 text-sm">
              {(article.translations ?? []).length === 0 ? (
                <li className="text-webit-fg-muted">Aucune autre locale</li>
              ) : (
                (article.translations ?? []).map((t) => (
                  <li key={t.id} className="flex items-center gap-2">
                    <span className="font-mono text-white">{t.locale}</span>
                    <a href={`/articles/${t.id}/edit`} className="text-webit-accent hover:underline">
                      Ouvrir
                    </a>
                  </li>
                ))
              )}
            </ul>
            {currentOrg?.supportedLocales && currentOrg.supportedLocales.length > 1 && (
              <div className="flex flex-wrap items-center gap-2">
                <select
                  id="new-translation-locale-article"
                  className="rounded border border-webit-panel-border bg-slate-900 px-2 py-1 text-sm text-white"
                  defaultValue=""
                >
                  <option value="">Choisir une locale</option>
                  {currentOrg.supportedLocales
                    .filter((l) => l !== article.locale && !(article.translations ?? []).some((t) => t.locale === l))
                    .map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                </select>
                <button
                  type="button"
                  className="btn-secondary text-sm"
                  disabled={creatingTranslation}
                  onClick={async () => {
                    const sel = document.getElementById('new-translation-locale-article') as HTMLSelectElement | null;
                    const targetLocale = sel?.value?.trim();
                    if (!targetLocale) return;
                    setCreatingTranslation(true);
                    try {
                      const headers = await getAuthHeaders();
                      const res = await fetch(`/api/orgs/current/articles/${article.id}/translations`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', ...headers },
                        credentials: 'include',
                        body: JSON.stringify({ targetLocale }),
                      });
                      if (!res.ok) {
                        const err = (await res.json().catch(() => ({}))) as { error?: string };
                        setMessage({ type: 'error', text: err.error ?? 'Erreur à la création de la traduction.' });
                        return;
                      }
                      const { article: newArticle } = (await res.json()) as { article: Article };
                      setArticle((prev) =>
                        prev
                          ? { ...prev, translations: [...(prev.translations ?? []), { id: newArticle.id, locale: targetLocale }] }
                          : prev
                      );
                      setMessage({ type: 'success', text: 'Traduction créée.' });
                      window.location.href = `/articles/${newArticle.id}/edit`;
                    } catch {
                      setMessage({ type: 'error', text: 'Erreur réseau.' });
                    } finally {
                      setCreatingTranslation(false);
                    }
                  }}
                >
                  {creatingTranslation ? 'Création…' : 'Créer une traduction'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Collaboration */}
        <div className="rounded-lg border border-webit-panel-border bg-slate-900/40 p-4">
          <p className="mb-3 text-sm font-medium text-white">Collaboration</p>
          <div className="mb-4">
            <p className="mb-1 text-xs text-webit-fg-muted">Assigné à</p>
            <p className="text-sm text-white">
              {article.assignment?.assigneeUserName ?? 'Personne'}
            </p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                className="btn-secondary text-sm"
                disabled={savingCollaboration || !currentUser}
                onClick={() =>
                  updateCollaboration({
                    assignment: {
                      assigneeUserId: currentUser?.uid ?? null,
                      assigneeUserName: currentUser?.displayName ?? currentUser?.email ?? null,
                    },
                  })
                }
              >
                M'assigner
              </button>
              <button
                type="button"
                className="btn-secondary text-sm"
                disabled={savingCollaboration}
                onClick={() => updateCollaboration({ assignment: null })}
              >
                Retirer l'assignation
              </button>
            </div>
          </div>
          <div className="mb-4">
            <label className="mb-1 block text-xs text-webit-fg-muted">Statut de revue éditoriale</label>
            <select
              className="w-full rounded border border-webit-panel-border bg-slate-900 px-2 py-1.5 text-sm text-white"
              value={article.editorialStatus ?? 'not_needed'}
              onChange={(e) =>
                updateCollaboration({
                  editorialStatus: (e.target.value || 'not_needed') as EditorialReviewStatus,
                })
              }
              disabled={savingCollaboration}
            >
              {(Object.keys(EDITORIAL_STATUS_LABELS) as EditorialReviewStatus[]).map((s) => (
                <option key={s} value={s}>
                  {EDITORIAL_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <p className="mb-2 text-xs text-webit-fg-muted">Commentaires</p>
            <ul className="mb-3 space-y-2">
              {comments.map((c) => (
                <li
                  key={c.id}
                  className={`rounded border border-webit-panel-border/60 bg-slate-800/40 px-3 py-2 text-sm ${c.resolved ? 'opacity-75' : ''}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <span className="font-medium text-white">{c.authorUserName ?? 'Anonyme'}</span>
                    <span className="text-xs text-webit-fg-muted">
                      {new Date(c.createdAt).toLocaleString('fr-FR')}
                      {c.resolved && (
                        <span className="ml-2 rounded bg-emerald-600/80 px-1.5 py-0.5 text-white">Résolu</span>
                      )}
                    </span>
                  </div>
                  <p className="mt-1 text-webit-fg-muted">{c.body}</p>
                  {!c.resolved && (
                    <button
                      type="button"
                      className="mt-2 text-xs text-webit-accent hover:underline disabled:opacity-50"
                      disabled={resolvingCommentId !== null}
                      onClick={async () => {
                        setResolvingCommentId(c.id);
                        try {
                          const headers = await getAuthHeaders();
                          const res = await fetch(
                            `/api/orgs/current/articles/${article.id}/comments/${c.id}`,
                            {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json', ...headers },
                              credentials: 'include',
                              body: JSON.stringify({ resolved: true }),
                            }
                          );
                          if (res.ok) {
                            const list = await fetch(
                              `/api/orgs/current/articles/${article.id}/comments`,
                              { headers: { ...(await getAuthHeaders()) }, credentials: 'include' }
                            ).then((r) => r.json() as Promise<ContentComment[]>);
                            setComments(list);
                          }
                        } finally {
                          setResolvingCommentId(null);
                        }
                      }}
                    >
                      {resolvingCommentId === c.id ? '…' : 'Marquer comme résolu'}
                    </button>
                  )}
                </li>
              ))}
            </ul>
            <div>
              <textarea
                className="mb-2 w-full rounded border border-webit-panel-border bg-slate-900 px-2 py-1.5 text-sm text-white"
                rows={2}
                placeholder="Ajouter un commentaire…"
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
              />
              <button
                type="button"
                className="btn-secondary text-sm"
                disabled={!commentBody.trim()}
                onClick={async () => {
                  const body = commentBody.trim();
                  if (!body) return;
                  const headers = await getAuthHeaders();
                  const res = await fetch(
                    `/api/orgs/current/articles/${article.id}/comments`,
                    {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', ...headers },
                      credentials: 'include',
                      body: JSON.stringify({ body }),
                    }
                  );
                  if (!res.ok) {
                    const err = (await res.json().catch(() => ({}))) as { error?: string };
                    setMessage({ type: 'error', text: err.error ?? 'Erreur.' });
                    return;
                  }
                  const newComment = (await res.json()) as ContentComment;
                  setComments((prev) => [...prev, newComment]);
                  setCommentBody('');
                }}
              >
                Commenter
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-webit-panel-border bg-slate-900/40 p-4">
          <p className="mb-2 text-sm font-medium text-white">Publication</p>
          <div className="mb-3 flex items-center gap-2">
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
            >
              {STATUS_LABELS[status]}
            </span>
          </div>

          <div className="mb-4 grid gap-2 text-sm">
            <div>
              <label className="mb-0.5 block text-xs text-webit-fg-muted">Publier à partir de</label>
              <input
                type="datetime-local"
                className="w-full rounded border border-webit-panel-border bg-slate-900 px-2 py-1.5 text-white"
                value={publishAt ? publishAt.slice(0, 16) : ''}
                onChange={(e) => setPublishAt(e.target.value ? new Date(e.target.value).toISOString() : null)}
              />
            </div>
            <div>
              <label className="mb-0.5 block text-xs text-webit-fg-muted">Dépublier à</label>
              <input
                type="datetime-local"
                className="w-full rounded border border-webit-panel-border bg-slate-900 px-2 py-1.5 text-white"
                value={unpublishAt ? unpublishAt.slice(0, 16) : ''}
                onChange={(e) => setUnpublishAt(e.target.value ? new Date(e.target.value).toISOString() : null)}
              />
            </div>
            {publishAt && new Date(publishAt) > new Date() && (
              <p className="text-xs text-amber-400">Publication planifiée le {new Date(publishAt).toLocaleString('fr-FR')}</p>
            )}
            {unpublishAt && (
              <p className="text-xs text-webit-fg-muted">Sera dépublié le {new Date(unpublishAt).toLocaleString('fr-FR')}</p>
            )}
          </div>

          <div className="mb-4 space-y-1 text-xs text-webit-fg-muted">
            {article.current.publishedAt && (
              <p>Publié le : {formatDate(article.current.publishedAt)}</p>
            )}
            <p>Dernière mise à jour : {formatDate(article.updatedAt)}</p>
          </div>

          {statusChanges.length > 0 && (
            <div className="mb-4">
              <p className="mb-2 text-xs font-medium text-webit-fg-muted">
                Historique des statuts
              </p>
              <ul className="space-y-1 text-xs text-webit-fg-muted">
                {statusChanges.map((ch) => (
                  <li key={ch.id}>
                    {formatDate(ch.changedAt)} –{' '}
                    {(ch.fromStatus && STATUS_LABELS[ch.fromStatus]) || '—'} →{' '}
                    {STATUS_LABELS[ch.toStatus]}
                    {ch.changedByUserName && ` par ${ch.changedByUserName}`}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {status === 'draft' && (
              <>
                <button
                  type="button"
                  className="btn-secondary text-sm"
                  onClick={() => updateStatus('preview')}
                  disabled={isSaving}
                >
                  Passer en preview
                </button>
                <button
                  type="button"
                  className="btn-primary text-sm"
                  onClick={() => updateStatus('published')}
                  disabled={isSaving}
                >
                  Publier
                </button>
              </>
            )}
            {status === 'preview' && (
              <>
                <button
                  type="button"
                  className="btn-secondary text-sm"
                  onClick={() => updateStatus('draft')}
                  disabled={isSaving}
                >
                  Repasser en brouillon
                </button>
                <button
                  type="button"
                  className="btn-primary text-sm"
                  onClick={() => updateStatus('published')}
                  disabled={isSaving}
                >
                  Publier
                </button>
              </>
            )}
            {status === 'published' && (
              <>
                <button
                  type="button"
                  className="btn-secondary text-sm"
                  onClick={() => updateStatus('draft')}
                  disabled={isSaving}
                >
                  Repasser en brouillon
                </button>
                <button
                  type="button"
                  className="btn-secondary text-sm"
                  onClick={() => updateStatus('archived')}
                  disabled={isSaving}
                >
                  Archiver
                </button>
              </>
            )}
            {status === 'archived' && (
              <button
                type="button"
                className="btn-secondary text-sm"
                onClick={() => updateStatus('draft')}
                disabled={isSaving}
              >
                Repasser en brouillon
              </button>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-webit-panel-border bg-slate-900/40 p-4">
          <p className="mb-3 text-sm font-medium text-white">Historique des versions</p>
          {versionsLoading ? (
            <p className="text-xs text-webit-fg-muted">Chargement…</p>
          ) : contentVersions.length === 0 ? (
            <p className="text-xs text-webit-fg-muted">Aucune version enregistrée.</p>
          ) : (
            <ul className="mb-4 space-y-2">
              {contentVersions.map((v) => (
                <li
                  key={v.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded border border-webit-panel-border/60 bg-slate-800/40 px-3 py-2 text-sm"
                >
                  <span className="text-white">
                    Version {v.versionNumber} · {formatDate(v.createdAt)}
                    {v.createdByUserName && ` · ${v.createdByUserName}`}
                  </span>
                  <span className="flex gap-2">
                    <button
                      type="button"
                      className="text-webit-accent hover:underline"
                      onClick={() => setCompareVersion(compareVersion?.id === v.id ? null : v)}
                    >
                      {compareVersion?.id === v.id ? 'Masquer la comparaison' : 'Comparer à actuel'}
                    </button>
                    <button
                      type="button"
                      className="text-webit-accent-rose hover:underline disabled:opacity-50"
                      onClick={() => handleRollback(v.versionNumber)}
                      disabled={rollbackingVersion !== null}
                    >
                      {rollbackingVersion === v.versionNumber ? 'Restauration…' : 'Restaurer cette version'}
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
          {compareVersion && article && (
            <div className="rounded border border-webit-panel-border bg-slate-950/60 p-3 text-xs">
              <p className="mb-2 font-medium text-webit-fg-muted">Diff (version {compareVersion.versionNumber} vs actuel)</p>
              <dl className="space-y-1">
                {compareVersion.payload.title !== article.current.title && (
                  <>
                    <dt className="text-webit-fg-muted">Titre</dt>
                    <dd className="ml-4">
                      <span className="line-through text-red-300">{compareVersion.payload.title || '—'}</span>
                      {' → '}
                      <span className="text-emerald-300">{article.current.title || '—'}</span>
                    </dd>
                  </>
                )}
                {compareVersion.payload.slug !== article.current.slug && (
                  <>
                    <dt className="text-webit-fg-muted">Slug</dt>
                    <dd className="ml-4">
                      <span className="line-through text-red-300">{compareVersion.payload.slug || '—'}</span>
                      {' → '}
                      <span className="text-emerald-300">{article.current.slug || '—'}</span>
                    </dd>
                  </>
                )}
                {(compareVersion.payload.seoTitle ?? '') !== (article.current.seoTitle ?? '') && (
                  <>
                    <dt className="text-webit-fg-muted">SEO Title</dt>
                    <dd className="ml-4">
                      <span className="line-through text-red-300">{compareVersion.payload.seoTitle || '—'}</span>
                      {' → '}
                      <span className="text-emerald-300">{article.current.seoTitle || '—'}</span>
                    </dd>
                  </>
                )}
                {(compareVersion.payload.seoDescription ?? '') !== (article.current.seoDescription ?? '') && (
                  <>
                    <dt className="text-webit-fg-muted">SEO Description</dt>
                    <dd className="ml-4 truncate">
                      <span className="line-through text-red-300">{compareVersion.payload.seoDescription || '—'}</span>
                      {' → '}
                      <span className="text-emerald-300">{article.current.seoDescription || '—'}</span>
                    </dd>
                  </>
                )}
                {JSON.stringify(compareVersion.payload.blocks ?? []) !== JSON.stringify(article.current.blocks ?? []) && (
                  <>
                    <dt className="text-webit-fg-muted">Blocs</dt>
                    <dd className="ml-4 text-webit-fg-muted">Contenu modifié</dd>
                  </>
                )}
              </dl>
              {/* TODO: diff visuel plus riche (par bloc). */}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-webit-panel-border bg-slate-900/40 p-4">
          <p className="mb-3 text-sm font-medium text-white">Métadonnées</p>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-webit-fg-muted">Catégorie</label>
              <select
                className="w-full rounded border border-webit-panel-border bg-slate-900 px-3 py-2 text-sm text-white"
                value={metaCategoryId ?? ''}
                onChange={(e) => setMetaCategoryId(e.target.value || null)}
              >
                <option value="">Aucune</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs text-webit-fg-muted">Tags</label>
              <div className="flex flex-wrap gap-2">
                {tags.map((t) => (
                  <label key={t.id} className="flex cursor-pointer items-center gap-1.5 text-sm text-white">
                    <input
                      type="checkbox"
                      checked={metaTagIds.includes(t.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setMetaTagIds((prev) => [...prev, t.id]);
                        } else {
                          setMetaTagIds((prev) => prev.filter((id) => id !== t.id));
                        }
                      }}
                      className="rounded border-webit-panel-border"
                    />
                    {t.name}
                  </label>
                ))}
                {tags.length === 0 && (
                  <span className="text-xs text-webit-fg-muted">Aucun tag créé.</span>
                )}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs text-webit-fg-muted">Auteur</label>
              <p className="text-sm text-white">
                {article.authorName || article.authorId || '—'}
              </p>
              {/* TODO: permettre de changer l'auteur via un select quand la gestion avancée des auteurs sera en place. */}
            </div>
          </div>
          <button
            type="button"
            className="btn-primary mt-3 text-sm"
            onClick={saveMetadata}
            disabled={savingMeta}
          >
            {savingMeta ? 'Enregistrement…' : 'Enregistrer les métadonnées'}
          </button>
        </div>
      </div>
    </div>
  );
}
