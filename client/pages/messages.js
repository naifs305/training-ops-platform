import React, { useEffect, useMemo, useState } from 'react';
import MainLayout from '../components/layout/MainLayout';
import useAuth from '../context/AuthContext';
import api from '../lib/axios';

export default function MessagesPage() {
  const { activeRole } = useAuth();

  const [tab, setTab] = useState('inbox');
  const [composeOpen, setComposeOpen] = useState(false);

  const [users, setUsers] = useState([]);
  const [inboxMessages, setInboxMessages] = useState([]);
  const [sentMessages, setSentMessages] = useState([]);

  const [selectedMessageId, setSelectedMessageId] = useState(null);

  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingInbox, setLoadingInbox] = useState(false);
  const [loadingSent, setLoadingSent] = useState(false);
  const [sending, setSending] = useState(false);

  const [error, setError] = useState('');

  const [form, setForm] = useState({
    recipientIds: [],
    subject: '',
    message: '',
  });

  const getDisplayName = (person) => {
    if (!person) return '-';
    const fullName = `${person.firstName || ''} ${person.lastName || ''}`.trim();
    return fullName || person.email || '-';
  };

  const getRoleLabel = (roles = []) => {
    if (roles.includes('MANAGER')) return 'مدير';
    if (roles.includes('EMPLOYEE')) return 'موظف';
    return 'مستخدم';
  };

  const getUserOptionLabel = (user) => {
    const name = getDisplayName(user);
    const role = getRoleLabel(user.roles || []);
    const project = user.operationalProject?.name ? ` - ${user.operationalProject.name}` : '';
    const email = user.email ? ` - ${user.email}` : '';
    return `${name} (${role})${project}${email}`;
  };

  const normalizeInbox = (items) => {
    return (items || []).map((item) => ({
      id: item.message?.id,
      recipientRecordId: item.id,
      subject: item.message?.subject || '',
      body: item.message?.body || '',
      createdAt: item.message?.createdAt || null,
      isRead: item.isRead,
      fromUser: item.message?.sender || null,
      course: item.message?.course || null,
      folder: 'inbox',
    }));
  };

  const normalizeSent = (items) => {
    return (items || []).map((item) => ({
      id: item.id,
      subject: item.subject || '',
      body: item.body || '',
      createdAt: item.createdAt || null,
      recipients: item.recipients || [],
      course: item.course || null,
      folder: 'sent',
    }));
  };

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await api.get('/messages/users');
      setUsers(res.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'فشل تحميل المستخدمين');
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadInbox = async (silent = false) => {
    try {
      if (!silent) setLoadingInbox(true);
      const res = await api.get('/messages/inbox');
      const normalized = normalizeInbox(res.data);
      setInboxMessages(normalized);

      setSelectedMessageId((prev) => {
        if (tab !== 'inbox') return prev;
        if (!normalized.length) return null;
        const stillExists = normalized.some((m) => m.id === prev);
        return stillExists ? prev : normalized[0].id;
      });
    } catch (err) {
      if (!silent) {
        setError(err?.response?.data?.message || 'فشل تحميل الرسائل الواردة');
      }
    } finally {
      if (!silent) setLoadingInbox(false);
    }
  };

  const loadSent = async (silent = false) => {
    try {
      if (!silent) setLoadingSent(true);
      const res = await api.get('/messages/sent');
      const normalized = normalizeSent(res.data);
      setSentMessages(normalized);

      setSelectedMessageId((prev) => {
        if (tab !== 'sent') return prev;
        if (!normalized.length) return null;
        const stillExists = normalized.some((m) => m.id === prev);
        return stillExists ? prev : normalized[0].id;
      });
    } catch (err) {
      if (!silent) {
        setError(err?.response?.data?.message || 'فشل تحميل الرسائل المرسلة');
      }
    } finally {
      if (!silent) setLoadingSent(false);
    }
  };

  const loadAll = async () => {
    setError('');
    await Promise.all([loadUsers(), loadInbox(), loadSent()]);
  };

  useEffect(() => {
    if (!activeRole) return;
    if (activeRole !== 'MANAGER' && activeRole !== 'EMPLOYEE') return;
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRole]);

  useEffect(() => {
    if (!activeRole) return;
    if (activeRole !== 'MANAGER' && activeRole !== 'EMPLOYEE') return;

    const interval = setInterval(() => {
      loadInbox(true);
      loadSent(true);
    }, 10000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRole, tab]);

  const currentMessages = useMemo(() => {
    return tab === 'inbox' ? inboxMessages : sentMessages;
  }, [tab, inboxMessages, sentMessages]);

  const selectedMessage = useMemo(() => {
    return currentMessages.find((message) => message.id === selectedMessageId) || null;
  }, [currentMessages, selectedMessageId]);

  const unreadInboxCount = useMemo(() => {
    return inboxMessages.filter((message) => !message.isRead).length;
  }, [inboxMessages]);

  const handleOpenTab = (nextTab) => {
    setTab(nextTab);
    const source = nextTab === 'inbox' ? inboxMessages : sentMessages;
    setSelectedMessageId(source[0]?.id || null);
  };

  const handleComposeChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRecipientChange = (e) => {
    const value = e.target.value;
    setForm((prev) => ({
      ...prev,
      recipientIds: value ? [value] : [],
    }));
  };

  const markMessageAsRead = async (messageId) => {
    try {
      await api.put(`/messages/${messageId}/read`);
      setInboxMessages((prev) =>
        prev.map((message) =>
          message.id === messageId ? { ...message, isRead: true } : message,
        ),
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectMessage = async (message) => {
    setSelectedMessageId(message.id);

    if (tab === 'inbox' && !message.isRead) {
      await markMessageAsRead(message.id);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();

    if (!form.recipientIds.length || !form.subject.trim() || !form.message.trim()) {
      return;
    }

    try {
      setSending(true);
      setError('');

      const res = await api.post('/messages', {
        recipientIds: form.recipientIds,
        subject: form.subject,
        message: form.message,
      });

      const data = res.data;

      const normalizedSentItem = {
        id: data.id,
        subject: data.subject || '',
        body: data.body || '',
        createdAt: data.createdAt || null,
        recipients: data.recipients || [],
        course: data.course || null,
        folder: 'sent',
      };

      setSentMessages((prev) => [normalizedSentItem, ...prev]);
      setComposeOpen(false);
      setForm({
        recipientIds: [],
        subject: '',
        message: '',
      });
      setTab('sent');
      setSelectedMessageId(normalizedSentItem.id);

      await loadInbox(true);
      await loadSent(true);
    } catch (err) {
      setError(err?.response?.data?.message || 'فشل إرسال الرسالة');
    } finally {
      setSending(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('ar-SA');
  };

  const renderSentRecipients = (message) => {
    const names = (message?.recipients || []).map((item) => {
      const name = getDisplayName(item.recipient);
      const role = getRoleLabel(item.recipient?.roles || []);
      return `${name} (${role})`;
    });
    return names.length ? names.join('، ') : '-';
  };

  if (activeRole !== 'MANAGER' && activeRole !== 'EMPLOYEE') {
    return (
      <MainLayout>
        <div className="rounded-3xl border border-danger/20 bg-white p-6 text-danger shadow-card">
          غير مصرح لك بالدخول إلى هذه الصفحة.
        </div>
      </MainLayout>
    );
  }

  const inputClass =
    'w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-text-main outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10';

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="rounded-3xl border border-border bg-white p-6 shadow-card">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-extrabold text-primary">المراسلات</h1>
              <p className="mt-1 text-sm text-text-soft">نظام المراسلات الداخلي</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={loadAll}
                className="rounded-2xl border border-border bg-white px-5 py-2.5 text-sm font-bold text-text-main transition hover:bg-background"
              >
                تحديث
              </button>

              <button
                onClick={() => setComposeOpen(true)}
                className="rounded-2xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-soft transition hover:bg-primary-dark"
              >
                رسالة جديدة
              </button>
            </div>
          </div>
        </div>

        {error ? (
          <div className="rounded-3xl border border-danger/20 bg-red-50 px-4 py-3 text-sm text-danger">
            {error}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-3xl border border-border bg-white shadow-card">
          <div className="flex gap-2 border-b border-border p-4">
            <button
              onClick={() => handleOpenTab('inbox')}
              className={`rounded-2xl px-5 py-2.5 text-sm font-bold transition ${
                tab === 'inbox'
                  ? 'bg-primary text-white'
                  : 'bg-background text-text-main hover:bg-primary-light hover:text-primary'
              }`}
            >
              الوارد {unreadInboxCount > 0 ? `(${unreadInboxCount})` : ''}
            </button>

            <button
              onClick={() => handleOpenTab('sent')}
              className={`rounded-2xl px-5 py-2.5 text-sm font-bold transition ${
                tab === 'sent'
                  ? 'bg-primary text-white'
                  : 'bg-background text-text-main hover:bg-primary-light hover:text-primary'
              }`}
            >
              المرسل
            </button>
          </div>

          <div className="grid min-h-[560px] grid-cols-1 md:grid-cols-3">
            <div className="border-l border-border bg-background/40">
              {(tab === 'inbox' && loadingInbox) || (tab === 'sent' && loadingSent) ? (
                <div className="p-6 text-sm text-text-soft">جاري التحميل...</div>
              ) : currentMessages.length === 0 ? (
                <div className="p-6 text-sm text-text-soft">لا توجد رسائل</div>
              ) : (
                currentMessages.map((message) => (
                  <button
                    key={message.id}
                    onClick={() => handleSelectMessage(message)}
                    className={`w-full border-b border-border p-4 text-right transition ${
                      selectedMessageId === message.id
                        ? 'bg-primary-light/50'
                        : 'bg-white hover:bg-background'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="truncate text-sm font-bold text-text-main">
                        {tab === 'inbox'
                          ? getDisplayName(message.fromUser)
                          : renderSentRecipients(message)}
                      </div>

                      {tab === 'inbox' && !message.isRead ? (
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-danger"></span>
                      ) : null}
                    </div>

                    <div className="mt-1 truncate text-sm text-text-main">
                      {message.subject}
                    </div>

                    <div className="mt-1 truncate text-xs text-text-soft">
                      {formatDate(message.createdAt)}
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="p-6 md:col-span-2 md:p-8">
              {selectedMessage ? (
                <div className="space-y-5">
                  <div className="border-b border-border pb-5">
                    <h2 className="text-2xl font-extrabold text-primary">
                      {selectedMessage.subject}
                    </h2>

                    <div className="mt-3 text-sm text-text-main">
                      {tab === 'inbox'
                        ? `من: ${getDisplayName(selectedMessage.fromUser)}`
                        : `إلى: ${renderSentRecipients(selectedMessage)}`}
                    </div>

                    <div className="mt-1 text-sm text-text-soft">
                      {formatDate(selectedMessage.createdAt)}
                    </div>

                    {selectedMessage.course ? (
                      <div className="mt-3 inline-flex items-center rounded-full bg-primary-light px-3 py-1 text-xs font-bold text-primary">
                        الدورة المرتبطة: {selectedMessage.course.name}
                      </div>
                    ) : null}
                  </div>

                  <div className="whitespace-pre-wrap text-[15px] leading-8 text-text-main">
                    {selectedMessage.body}
                  </div>
                </div>
              ) : (
                <div className="flex h-full items-center justify-center text-lg text-text-soft">
                  اختر رسالة لعرضها
                </div>
              )}
            </div>
          </div>
        </div>

        {composeOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2F3437]/45 p-4 backdrop-blur-sm">
            <div className="w-full max-w-3xl overflow-hidden rounded-3xl border border-border bg-white shadow-[0_24px_60px_rgba(0,0,0,0.18)]">
              <div className="flex items-center justify-between border-b border-border px-6 py-5">
                <h2 className="text-2xl font-extrabold text-primary">رسالة جديدة</h2>
                <button
                  onClick={() => setComposeOpen(false)}
                  className="text-sm font-bold text-text-soft transition hover:text-primary"
                >
                  إغلاق
                </button>
              </div>

              <form onSubmit={handleSend} className="space-y-5 p-6">
                <div>
                  <label className="mb-2 block text-sm font-bold text-text-main">
                    إلى
                  </label>

                  <select
                    value={form.recipientIds[0] || ''}
                    onChange={handleRecipientChange}
                    className={inputClass}
                    required
                  >
                    <option value="">
                      {loadingUsers ? 'جاري تحميل المستخدمين...' : 'اختر المستلم'}
                    </option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {getUserOptionLabel(u)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-text-main">
                    الموضوع
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={form.subject}
                    onChange={handleComposeChange}
                    className={inputClass}
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-text-main">
                    نص الرسالة
                  </label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleComposeChange}
                    rows="8"
                    className={`${inputClass} resize-none py-3`}
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setComposeOpen(false)}
                    className="rounded-2xl border border-border bg-white px-5 py-2.5 font-bold text-text-main transition hover:bg-background"
                  >
                    إلغاء
                  </button>

                  <button
                    type="submit"
                    disabled={sending}
                    className="rounded-2xl bg-primary px-6 py-2.5 font-bold text-white transition hover:bg-primary-dark disabled:opacity-60"
                  >
                    {sending ? 'جاري الإرسال...' : 'إرسال'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}
      </div>
    </MainLayout>
  );
}