import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Header } from '../components/Header'
import { Window, WindowHeader, WindowContent } from '../components/Window'
import { LoadingCenter } from '../components/Loading'
import { EmptyState } from '../components/EmptyState'
import { ErrorDisplay } from '../components/ErrorDisplay'
import { PageShell, PageHeader, SectionIntro } from '../components/PageShell'
import { StatCard } from '../components/StatCard'
import { useApiAuth, useApiResource } from '../utils/hooks'
import { fetchDiscussions, fetchDiscussionMessages, markDiscussionRead, sendDiscussionMessage } from '../services/api'
import { useApp } from '../context/AppContext'
import { FileList } from '../components/FileList'
import { IconArrowLeft, IconSend, IconSearch, IconRefresh, IconInbox, IconMail } from '../components/Icons'
import { formatRelative, formatDateTime } from '../utils/format'

export default function Messaging() {
  useApiAuth()
  const navigate = useNavigate()
  const { token, logout, addToast } = useApp()
  const [selectedId, setSelectedId] = useState(null)
  const [search, setSearch] = useState('')
  const [readIds, setReadIds] = useState(() => new Set())

  useEffect(() => {
    if (!token) navigate('/login', { replace: true })
  }, [token, navigate])

  const { data: discussionsRaw, loading, error, refetch } = useApiResource(
    () => fetchDiscussions(),
    { deps: [token], skip: !token }
  )

  // Le backend renvoie un array direct. Tolère aussi l'ancien format {discussions:[]} pour rétrocompat.
  const discussions = useMemo(() => {
    if (Array.isArray(discussionsRaw)) return discussionsRaw
    if (discussionsRaw && Array.isArray(discussionsRaw.discussions)) return discussionsRaw.discussions
    return []
  }, [discussionsRaw])

  const filtered = useMemo(() => {
    const list = discussions || []
    if (!search.trim()) return list
    const q = search.toLowerCase()
    return list.filter((d) =>
      (d.subject || '').toLowerCase().includes(q) ||
      (d.participants || []).some((p) => (p.name || '').toLowerCase().includes(q))
    )
  }, [discussions, search])

  useEffect(() => {
    if (!selectedId && filtered.length > 0) {
      setSelectedId(filtered[0].id)
    }
  }, [filtered, selectedId])

  const selectedDiscussion = useMemo(
    () => (discussions || []).find((d) => d.id === selectedId) || null,
    [discussions, selectedId]
  )

  const [lastSync, setLastSync] = useState(null)
  async function handleRefresh() {
    await refetch()
    setLastSync(new Date().toISOString())
    addToast({ type: 'success', title: 'Messagerie synchronisée' })
  }
  useEffect(() => { if (discussions) setLastSync(new Date().toISOString()) }, [discussions])

  function handleSelect(id) {
    setSelectedId(id)
    if (!readIds.has(id)) {
      const newRead = new Set(readIds)
      newRead.add(id)
      setReadIds(newRead)
      try { markDiscussionRead(id).catch(() => {}) } catch {}
    }
  }

  const unreadCount = (discussions || []).filter((d) => d.unread && !readIds.has(d.id)).length

  return (
    <PageShell style={{ minHeight: '100vh' }}>
      <Header onRefresh={handleRefresh} lastSync={lastSync} loading={loading} />

      <PageHeader
        title="Messagerie"
        description="Accède aux conversations importantes, repère les messages non lus et réponds sans quitter le contexte."
        meta={<span className="section-eyebrow">Communication</span>}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <StatCard label="Discussions" value={discussions.length} sublabel="Synchronisées" icon={<IconInbox size={18} />} />
          <StatCard label="Non lues" value={unreadCount} sublabel="À consulter" icon={<IconMail size={18} />} color={unreadCount > 0 ? 'rgb(var(--color-average))' : 'rgb(var(--color-good))'} />
          <StatCard label="Sélection" value={selectedDiscussion ? 1 : 0} sublabel={selectedDiscussion ? getDiscussionTitle(selectedDiscussion) : 'Aucune'} icon={<IconArrowLeft size={18} />} color="rgb(var(--border-color-0))" />
        </div>
      </PageHeader>

      {loading && <LoadingCenter message="Chargement de la messagerie..." />}

      {error && !loading && (
        <Window>
          <WindowContent>
            <ErrorDisplay error={error} onRetry={handleRefresh} onLogout={logout} />
          </WindowContent>
        </Window>
      )}

      {!loading && !error && (
        <div
          className="windows-layout messaging-grid animate-fade-in"
          data-selected={!!selectedId}
          style={{
            flex: 1, minHeight: 0,
            display: 'grid',
            gridTemplateColumns: 'minmax(280px, 360px) 1fr',
            gap: 'clamp(12px, 2vw, 20px)',
          }}
        >
          <Window style={{ minHeight: 0 }}>
            <WindowHeader>
              <h2><IconInbox size={18} /> Discussions</h2>
            </WindowHeader>
            <div style={{ padding: '0 14px 10px' }}>
              <SectionIntro
                eyebrow="Boîte de réception"
                title="Filtrer sans perdre le fil"
                description="La liste met en avant la dernière activité et les non-lus pour aller plus vite."
                align="start"
              />
              <div className="search-field" style={{ marginTop: 14 }}>
                <IconSearch size={14} />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher..."
                />
              </div>
            </div>
            <WindowContent>
              {filtered.length === 0 ? (
                <EmptyState
                  icon="📭"
                  title="Aucune discussion"
                  description={search ? "Aucun résultat pour cette recherche." : "Tu n'as aucune discussion pour le moment."}
                />
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {filtered.map((d) => (
                    <DiscussionListItem
                      key={d.id}
                      discussion={d}
                      active={d.id === selectedId}
                      onSelect={() => handleSelect(d.id)}
                      read={readIds.has(d.id)}
                    />
                  ))}
                </ul>
              )}
            </WindowContent>
          </Window>

          <Window style={{ minHeight: 0 }}>
            {selectedDiscussion ? (
              <DiscussionView
                discussion={selectedDiscussion}
                onRefresh={refetch}
                onReplySent={refetch}
                onBack={() => setSelectedId(null)}
              />
            ) : (
              <>
                <WindowHeader><h2><IconMail size={18} /> Conversation</h2></WindowHeader>
                <WindowContent>
                  <EmptyState
                    icon="•"
                    title="Sélectionne une discussion"
                    description="Choisis une discussion pour lire les messages et répondre depuis Pronote+."
                  />
                </WindowContent>
              </>
            )}
          </Window>
        </div>
      )}
    </PageShell>
  )
}

function DiscussionListItem({ discussion, active, onSelect, read }) {
  const isUnread = discussion.unread && !read
  const lastDate = discussion.lastMessageDate || discussion.date
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        style={{
          width: '100%',
          textAlign: 'left',
          background: active ? 'rgba(var(--border-color-0), 0.3)' : 'transparent',
          border: 'none',
          padding: '10px 12px',
          borderRadius: 10,
          cursor: 'pointer',
          color: 'rgb(var(--text-color-main))',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontFamily: 'inherit',
          transition: 'background 0.15s',
        }}
      >
        <span style={{
          width: 36, height: 36, borderRadius: 10,
          background: isUnread ? 'rgb(var(--border-color-0))' : 'rgb(var(--background-color-3))',
          color: 'rgb(var(--text-color-main))',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, fontWeight: 800, fontSize: 'var(--font-size-14)',
        }}>
          {getInitial(discussion)}
        </span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
            <span style={{
              fontSize: 'var(--font-size-14)',
              fontWeight: isUnread ? 'var(--font-weight-extra-bold)' : 'var(--font-weight-semi-bold)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {getDiscussionTitle(discussion)}
            </span>
            <span style={{ fontSize: 'var(--font-size-12)', color: 'rgb(var(--text-color-alt))', flexShrink: 0 }}>
              {lastDate ? formatRelative(lastDate) : ''}
            </span>
          </div>
          <div style={{
            fontSize: 'var(--font-size-12)', color: 'rgb(var(--text-color-alt))',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            marginTop: 2,
          }}>
            {discussion.preview || 'Pas de message'}
          </div>
        </div>
        {isUnread && (
          <span style={{
            width: 8, height: 8, borderRadius: 99, background: 'rgb(var(--border-color-0))',
            flexShrink: 0,
          }} />
        )}
      </button>
    </li>
  )
}

function getDiscussionTitle(d) {
  if (d.subject) return d.subject
  if (d.participants?.length === 1) return d.participants[0].name || 'Discussion'
  if (d.participants?.length > 1) return d.participants.map((p) => p.name).filter(Boolean).join(', ')
  return 'Discussion'
}

function getInitial(d) {
  const title = getDiscussionTitle(d)
  return title.charAt(0).toUpperCase()
}

function DiscussionView({ discussion, onRefresh, onReplySent, onBack }) {
  const { addToast } = useApp()
  const { data: messagesData, loading, error, refetch } = useApiResource(
    () => fetchDiscussionMessages(discussion.id),
    { deps: [discussion.id] }
  )
  // Tolère array direct OU {messages:[]}
  const messages = useMemo(() => {
    if (Array.isArray(messagesData)) return messagesData
    if (messagesData && Array.isArray(messagesData.messages)) return messagesData.messages
    return []
  }, [messagesData])
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [messages])

  async function sendReply() {
    if (!reply.trim() || sending) return
    setSending(true)
    try {
      // sendDiscussionMessage(id, content) — le token est géré par request() via getTokenFn()
      await sendDiscussionMessage(discussion.id, reply.trim())
      setReply('')
      addToast({ type: 'success', title: 'Message envoyé' })
      await Promise.all([refetch(), onReplySent?.()])
    } catch (e) {
      addToast({ type: 'error', title: 'Envoi impossible', description: e.message })
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <WindowHeader>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, width: '100%' }}>
          <button
            type="button"
            className="edp-btn-icon mobile-only"
            onClick={onBack}
            aria-label="Retour aux discussions"
            style={{ display: 'none', flexShrink: 0 }}
          >
            <IconArrowLeft size={16} />
          </button>
          <h2 style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {getDiscussionTitle(discussion)}
          </h2>
          <button
            type="button"
            className="edp-btn-icon"
            onClick={refetch}
            disabled={loading}
            title="Rafraîchir la conversation"
            aria-label="Rafraîchir"
          >
            <span style={{ display: 'inline-block', animation: loading ? 'spin 0.8s linear infinite' : 'none' }}>
              <IconRefresh size={16} />
            </span>
          </button>
        </div>
      </WindowHeader>
      <WindowContent>
        {loading && !messagesData && <LoadingCenter message="Chargement des messages..." />}
        {error && !loading && <ErrorDisplay error={error} onRetry={refetch} />}
        {!error && messagesData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>
            {messages.length === 0 && (
              <EmptyState icon="✉️" title="Aucun message" description="Cette discussion est vide." />
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {messages.map((m, i) => <MessageBubble key={m.id || i} message={m} />)}
              <div ref={messagesEndRef} />
            </div>
            <div className="message-composer" style={{
              marginTop: 12,
              display: 'flex',
              gap: 8,
              alignItems: 'flex-end',
              padding: 8,
            }}>
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Écris ta réponse..."
                rows={2}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault()
                    sendReply()
                  }
                }}
                style={{
                  flex: 1, resize: 'vertical', minHeight: 36, maxHeight: 200,
                  background: 'transparent', border: 'none', outline: 'none',
                  color: 'rgb(var(--text-color-main))',
                  fontFamily: 'inherit', fontSize: 'var(--font-size-14)',
                  padding: 8,
                }}
              />
              <button
                type="button"
                className="edp-btn"
                onClick={sendReply}
                disabled={!reply.trim() || sending}
                aria-label="Envoyer"
                style={{ padding: '8px 12px' }}
              >
                <IconSend size={16} />
                <span style={{ display: 'none' }}>Envoyer</span>
              </button>
            </div>
            <div style={{ fontSize: 'var(--font-size-12)', color: 'rgb(var(--text-color-alt))', textAlign: 'right' }}>
              ⌘/Ctrl + ⏎ pour envoyer
            </div>
          </div>
        )}
      </WindowContent>
    </>
  )
}

function MessageBubble({ message }) {
  const fromMe = !!message.fromMe
  const content = message.content || message.body || ''
  return (
    <div className={`message-row ${fromMe ? 'from-me' : ''}`} style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: fromMe ? 'flex-end' : 'flex-start',
      gap: 4,
    }}>
      {!fromMe && (
        <span style={{ fontSize: 'var(--font-size-12)', color: 'rgb(var(--text-color-alt))', marginLeft: 6 }}>
          {message.author || message.senderName || '—'}
        </span>
      )}
      <div className={`message-bubble ${fromMe ? 'from-me' : ''}`} style={{
        maxWidth: '85%',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}>
        {content}
        <FileList files={message.files} compact />
      </div>
      <span style={{ fontSize: 'var(--font-size-12)', color: 'rgb(var(--text-color-alt))', marginLeft: 6, marginRight: 6 }}>
        {message.date ? formatDateTime(message.date) : ''}
      </span>
    </div>
  )
}
