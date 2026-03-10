import { useState } from 'react';
import api from '../../lib/axios';
import toast from 'react-hot-toast';

export default function ElementRow({ element, activeRole, onUpdate }) {
  const [loading, setLoading] = useState(false);

  const handleAction = async (newStatus, customNotes = '') => {
    setLoading(true);
    try {
      await api.put(`/closure/${element.id}`, { status: newStatus, notes: customNotes });
      toast.success('تم تحديث الحالة');
      onUpdate();
    } catch (err) {
      toast.error(err.response?.data?.message || 'حدث خطأ');
    } finally {
      setLoading(false);
    }
  };

  const isEmployee = activeRole === 'EMPLOYEE';
  const isManager = activeRole === 'MANAGER';

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {isEmployee &&
        (element.status === 'NOT_STARTED' ||
          element.status === 'REJECTED' ||
          element.status === 'RETURNED') && (
          <button
            onClick={() => handleAction('PENDING_APPROVAL')}
            disabled={loading}
            className="rounded-xl bg-primary px-3 py-2 text-xs font-bold text-white transition hover:bg-primary-dark disabled:opacity-50"
          >
            تقديم
          </button>
        )}

      {isEmployee && element.status === 'PENDING_APPROVAL' && (
        <button
          onClick={() => handleAction('NOT_STARTED')}
          disabled={loading}
          className="rounded-xl bg-warning px-3 py-2 text-xs font-bold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          سحب التقديم
        </button>
      )}

      {isManager && element.status === 'PENDING_APPROVAL' && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => handleAction('APPROVED')}
            disabled={loading}
            className="rounded-xl bg-success px-3 py-2 text-xs font-bold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            اعتماد
          </button>

          <button
            onClick={() => {
              const reason = prompt('سبب الإعادة للمراجعة:');
              if (reason && reason.trim()) {
                handleAction('RETURNED', reason);
              }
            }}
            disabled={loading}
            className="rounded-xl bg-warning px-3 py-2 text-xs font-bold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            إعادة للموظف
          </button>

          <button
            onClick={() => {
              const reason = prompt('سبب الرفض:');
              if (reason && reason.trim()) {
                handleAction('REJECTED', reason);
              }
            }}
            disabled={loading}
            className="rounded-xl bg-danger px-3 py-2 text-xs font-bold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            رفض
          </button>
        </div>
      )}
    </div>
  );
}