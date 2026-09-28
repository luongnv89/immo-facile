/**
 * useFormPage — shared state engine for the hash-routed create/edit form
 * pages (#113). Owns form data, a loaded-snapshot for dirty tracking, the
 * fetch-by-id load in edit mode, and change handling. The page supplies
 * stable module-level inputs (emptyForm / mapRecord / fetchById) so the
 * load effect never re-fires on re-render.
 */
import { useEffect, useState } from 'react';

export const useFormPage = ({ id, fetchById, mapRecord, emptyForm, loadError }) => {
  const isEdit = Boolean(id);
  const [formData, setFormData] = useState(emptyForm);
  const [initialData, setInitialData] = useState(emptyForm);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isEdit) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData(emptyForm);
      setInitialData(emptyForm);
      setLoading(false);
      return;
    }
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchById(id);
        const record = res.data?.data || res.data;
        if (!cancelled && record) {
          const loaded = mapRecord(record);
          setFormData(loaded);
          setInitialData(loaded);
        }
      } catch (e) {
        if (!cancelled) setError(e.response?.data?.error || e.message || loadError);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [id, isEdit, fetchById, mapRecord, emptyForm, loadError]);

  const isDirty = JSON.stringify(formData) !== JSON.stringify(initialData);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return { isEdit, formData, loading, saving, error, isDirty, setSaving, handleChange };
};

export default useFormPage;
