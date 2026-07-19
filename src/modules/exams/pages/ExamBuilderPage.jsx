import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import {
  fetchExamById, createExam, updateExam, publishExam, deleteExam,
  fetchQuestionsWithOptions, createQuestion, updateQuestion, deleteQuestion,
  createOption, updateOption, deleteOption, uploadQuestionImage, deleteQuestionImage
} from '../services/examService';
import { Plus, Save, Trash2, Send, AlertTriangle, ArrowLeft, HelpCircle, CheckSquare, Type, Upload } from 'lucide-react';

const ExamBuilderPage = ({ examId, onBack }) => {
  const { user } = useAuth();
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [canEditQuestions, setCanEditQuestions] = useState(true);
  const [updatingOptions, setUpdatingOptions] = useState(new Set());
  const [sampleAnswers, setSampleAnswers] = useState({});
  const [autoGradingSettings, setAutoGradingSettings] = useState({});
  const [uploadingImages, setUploadingImages] = useState(new Set());

  // Local form state for debounced updates
  const [localFormData, setLocalFormData] = useState({});
  const [updateTimers, setUpdateTimers] = useState({});
  const [optionUpdateTimers, setOptionUpdateTimers] = useState({});

  // Check if there are pending updates
  const hasPendingUpdates = useMemo(() =>
    Object.keys(updateTimers).length > 0 || Object.keys(optionUpdateTimers).length > 0,
    [updateTimers, optionUpdateTimers]
  );

  // Exam form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [passingScore, setPassingScore] = useState(50);

  useEffect(() => {
    if (examId) {
      loadExam();
    } else {
      setLoading(false);
    }
  }, [examId]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      // Clear all update timers
      Object.values(updateTimers).forEach(timer => clearTimeout(timer));
      Object.values(optionUpdateTimers).forEach(timer => clearTimeout(timer));
    };
  }, [updateTimers, optionUpdateTimers]);

  const loadExam = async () => {
    try {
      setLoading(true);
      const examData = await fetchExamById(examId);
      setExam(examData);
      setTitle(examData.title);
      setDescription(examData.description || '');
      setDurationMinutes(examData.duration_minutes);
      setPassingScore(examData.passing_score || 50);

      // Questions can only be edited if exam is in draft status
      setCanEditQuestions(examData.status === 'draft');

      const qs = await fetchQuestionsWithOptions(examId);
      setQuestions(qs);

      // Load sample answers and auto-grading settings
      const sampleAnswersMap = {};
      const autoGradingMap = {};
      qs.forEach(q => {
        if (q.sample_answer) {
          sampleAnswersMap[q.id] = q.sample_answer;
        }
        autoGradingMap[q.id] = {
          enableAutoGrading: q.enable_auto_grading || false,
          gradingKeywords: q.grading_keywords || []
        };
      });
      setSampleAnswers(sampleAnswersMap);
      setAutoGradingSettings(autoGradingMap);
    } catch (err) {
      console.error('Error loading exam:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveExam = async () => {
    if (!title.trim()) {
      alert('Judul ujian wajib diisi!');
      return;
    }
    try {
      setSaving(true);
      if (exam) {
        const updated = await updateExam(exam.id, {
          title: title.trim(),
          description: description.trim(),
          duration_minutes: parseInt(durationMinutes),
          passing_score: parseInt(passingScore)
        });
        setExam(updated);
      } else {
        const created = await createExam({
          title: title.trim(),
          description: description.trim(),
          duration_minutes: parseInt(durationMinutes),
          passing_score: parseInt(passingScore),
          status: 'draft',
          created_by: user.id
        });
        setExam(created);
      }
      alert('Ujian berhasil disimpan!');
    } catch (err) {
      alert('Gagal menyimpan: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!exam) {
      alert('Simpan ujian terlebih dahulu!');
      return;
    }
    if (questions.length === 0) {
      alert('Tambahkan minimal 1 soal!');
      return;
    }
    if (!window.confirm('Publikasi ujian? Murid akan bisa melihat dan mengerjakan ujian ini.')) return;
    try {
      await publishExam(exam.id);
      alert('Ujian berhasil dipublikasikan!');
      loadExam();
    } catch (err) {
      alert('Gagal publikasi: ' + err.message);
    }
  };

  const addQuestion = async () => {
    if (!exam) {
      alert('Simpan ujian terlebih dahulu!');
      return;
    }
    try {
      const q = await createQuestion({
        exam_id: exam.id,
        type: 'multiple_choice',
        question: '',
        points: 1,
        order_number: questions.length
      });
      // Add default options
      await createOption({ question_id: q.id, option_text: 'Opsi A', is_correct: false, order_number: 0 });
      await createOption({ question_id: q.id, option_text: 'Opsi B', is_correct: false, order_number: 1 });
      await createOption({ question_id: q.id, option_text: 'Opsi C', is_correct: false, order_number: 2 });
      await createOption({ question_id: q.id, option_text: 'Opsi D', is_correct: false, order_number: 3 });
      loadExam();
    } catch (err) {
      alert('Gagal menambah soal: ' + err.message);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm('Hapus soal ini?')) return;

    const question = questions.find(q => q.id === questionId);

    try {
      // Delete associated image if exists
      if (question?.image_url) {
        await deleteQuestionImage(question.image_url, user.id);
      }

      await deleteQuestion(questionId);
      loadExam();
    } catch (err) {
      alert('Gagal menghapus: ' + err.message);
    }
  };

  // Debounced update function
  const debouncedUpdateQuestion = useCallback(async (questionId, updates) => {
    try {
      await updateQuestion(questionId, updates);
      // Update local state optimistically
      setQuestions(prev => prev.map(q => q.id === questionId ? { ...q, ...updates } : q));
    } catch (err) {
      console.error('Error updating question:', err);
      // Revert local state on error
      setLocalFormData(prev => {
        const newData = { ...prev };
        delete newData[questionId];
        return newData;
      });
    }
  }, []);

  const handleUpdateQuestion = useCallback((questionId, updates, immediate = false) => {
    // Update local state immediately for instant UI feedback
    setQuestions(prev => prev.map(q => q.id === questionId ? { ...q, ...updates } : q));

    // Clear existing timer for this field
    if (updateTimers[questionId]) {
      clearTimeout(updateTimers[questionId]);
    }

    if (immediate) {
      // Immediate update for non-text fields (select, number inputs)
      debouncedUpdateQuestion(questionId, updates);
    } else {
      // Debounced update for text fields (textarea, text inputs)
      const timer = setTimeout(() => {
        debouncedUpdateQuestion(questionId, updates);
        setUpdateTimers(prev => {
          const newTimers = { ...prev };
          delete newTimers[questionId];
          return newTimers;
        });
      }, 1000); // 1 second delay

      setUpdateTimers(prev => ({ ...prev, [questionId]: timer }));
    }
  }, [updateTimers, debouncedUpdateQuestion]);

  const handleUpdateSampleAnswer = async (questionId, sampleAnswer) => {
    try {
      await updateQuestion(questionId, { sample_answer: sampleAnswer });
      setSampleAnswers(prev => ({ ...prev, [questionId]: sampleAnswer }));
      setQuestions(prev => prev.map(q =>
        q.id === questionId ? { ...q, sample_answer: sampleAnswer } : q
      ));
    } catch (err) {
      console.error('Error updating sample answer:', err);
    }
  };

  const handleUpdateAutoGrading = async (questionId, enableAutoGrading, gradingKeywords = []) => {
    try {
      await updateQuestion(questionId, {
        enable_auto_grading: enableAutoGrading,
        grading_keywords: gradingKeywords
      });

      setAutoGradingSettings(prev => ({
        ...prev,
        [questionId]: { enableAutoGrading, gradingKeywords }
      }));

      setQuestions(prev => prev.map(q =>
        q.id === questionId ? {
          ...q,
          enable_auto_grading: enableAutoGrading,
          grading_keywords: gradingKeywords
        } : q
      ));
    } catch (err) {
      console.error('Error updating auto-grading settings:', err);
    }
  };

  const debouncedUpdateOption = useCallback(async (optionId, updates) => {
    try {
      await updateOption(optionId, updates);
      // Update local state optimistically
      setQuestions(prev => prev.map(q => ({
        ...q,
        options: q.options?.map(opt =>
          opt.id === optionId ? { ...opt, ...updates } : opt
        ) || q.options
      })));
    } catch (err) {
      console.error('Error updating option:', err);
      // Revert local state on error - we would need to track original values
    }
  }, []);

  const handleUpdateOption = useCallback((optionId, updates, immediate = false) => {
    // Update local state immediately for instant UI feedback
    setQuestions(prev => prev.map(q => ({
      ...q,
      options: q.options?.map(opt =>
        opt.id === optionId ? { ...opt, ...updates } : opt
      ) || q.options
    })));

    // Clear existing timer for this option
    if (optionUpdateTimers[optionId]) {
      clearTimeout(optionUpdateTimers[optionId]);
    }

    if (immediate) {
      // Immediate update for non-text fields
      debouncedUpdateOption(optionId, updates);
    } else {
      // Debounced update for text fields
      const timer = setTimeout(() => {
        debouncedUpdateOption(optionId, updates);
        setOptionUpdateTimers(prev => {
          const newTimers = { ...prev };
          delete newTimers[optionId];
          return newTimers;
        });
      }, 1000); // 1 second delay

      setOptionUpdateTimers(prev => ({ ...prev, [optionId]: timer }));
    }
  }, [optionUpdateTimers, debouncedUpdateOption]);

  const handleImageUpload = async (questionId, file) => {
    if (!file) return;

    const currentQuestion = questions.find(q => q.id === questionId);
    const currentImageUrl = currentQuestion?.image_url;

    setUploadingImages(prev => new Set(prev).add(questionId));

    try {
      // Delete old image if exists
      if (currentImageUrl) {
        await deleteQuestionImage(currentImageUrl, user.id);
      }

      const imageUrl = await uploadQuestionImage(file, user.id);
      await handleUpdateQuestion(questionId, { image_url: imageUrl });
      alert('Gambar berhasil diupload!');
    } catch (err) {
      alert('Gagal upload gambar: ' + err.message);
    } finally {
      setUploadingImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(questionId);
        return newSet;
      });
    }
  };

  const handleImageDelete = async (questionId, currentImageUrl) => {
    if (!window.confirm('Hapus gambar soal ini?')) return;

    try {
      await deleteQuestionImage(currentImageUrl, user.id);
      await handleUpdateQuestion(questionId, { image_url: null });
      alert('Gambar berhasil dihapus!');
    } catch (err) {
      alert('Gagal menghapus gambar: ' + err.message);
    }
  };

  const addOption = async (questionId) => {
    try {
      const q = questions.find(q => q.id === questionId);
      const order = q?.options?.length || 0;
      await createOption({
        question_id: questionId,
        option_text: `Opsi ${String.fromCharCode(65 + order)}`,
        is_correct: false,
        order_number: order
      });
      loadExam();
    } catch (err) {
      alert('Gagal menambah opsi: ' + err.message);
    }
  };

  const handleDeleteOption = async (optionId) => {
    try {
      await deleteOption(optionId);
      loadExam();
    } catch (err) {
      alert('Gagal menghapus opsi: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="p-margin-mobile md:p-margin-desktop flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-md text-on-surface-variant">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-body-md">Memuat...</p>
        </div>
      </div>
    );
  }

  const questionTypeIcon = (type) => {
    switch (type) {
      case 'multiple_choice': return <HelpCircle size={16} />;
      case 'checkbox': return <CheckSquare size={16} />;
      case 'essay': return <Type size={16} />;
      default: return <HelpCircle size={16} />;
    }
  };

  const typeLabels = {
    multiple_choice: 'Pilihan Ganda',
    checkbox: 'Checkbox',
    essay: 'Essay'
  };

  return (
    <div className="p-margin-mobile md:p-margin-desktop max-w-5xl mx-auto space-y-xl">
      {/* Header */}
      <div className="flex items-center gap-md">
        <button onClick={onBack} className="flex items-center justify-center w-10 h-10 rounded-xl bg-surface border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-higher transition-all duration-200 shrink-0">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-md">
            <h1 className="text-title-md font-semibold text-on-surface m-0">{exam ? 'Edit Ujian' : 'Buat Ujian Baru'}</h1>
            {hasPendingUpdates && (
              <div className="inline-flex items-center gap-xs px-sm py-0.5 rounded-lg bg-warning-container text-on-warning-container text-label-xs border border-warning/30">
                <div className="w-2 h-2 rounded-full bg-warning animate-pulse" />
                Menyimpan...
              </div>
            )}
          </div>
          <p className="text-body-sm text-on-surface-variant mt-1">Buat soal ujian dengan mudah seperti Google Forms</p>
        </div>
      </div>

      <div className="space-y-xl">
        {/* Basic Info */}
        <div className="bg-surface rounded-2xl p-lg shadow-sm border border-outline-variant/30 animate-fadeIn space-y-md">
          <h3 className="text-title-sm font-semibold text-on-surface m-0">Informasi Ujian</h3>
          <div className="space-y-sm">
            <label className="text-label-sm font-medium text-on-surface">Judul Ujian <span className="text-error">*</span></label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Contoh: Ujian Tengah Semester Matematika" className="w-full px-lg py-3 rounded-xl border border-outline bg-surface text-body-md text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200" />
          </div>
          <div className="space-y-sm">
            <label className="text-label-sm font-medium text-on-surface">Deskripsi</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Deskripsi ujian (opsional)" rows="3" className="w-full px-lg py-3 rounded-xl border border-outline bg-surface text-body-md text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200 resize-vertical min-h-[80px]" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
            <div className="space-y-sm">
              <label className="text-label-sm font-medium text-on-surface">Durasi (menit)</label>
              <input type="number" value={durationMinutes} onChange={e => setDurationMinutes(e.target.value)} min="1" max="480" className="w-full px-lg py-3 rounded-xl border border-outline bg-surface text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
            </div>
            <div className="space-y-sm">
              <label className="text-label-sm font-medium text-on-surface">Nilai Kelulusan (%)</label>
              <input type="number" value={passingScore} onChange={e => setPassingScore(e.target.value)} min="0" max="100" className="w-full px-lg py-3 rounded-xl border border-outline bg-surface text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
            </div>
          </div>
          <div className="flex items-center gap-sm pt-sm">
            <button onClick={handleSaveExam} disabled={saving} className="inline-flex items-center gap-xs px-lg py-2.5 rounded-xl bg-primary text-on-primary text-label-sm font-medium hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200">
              {saving ? <><div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" /> Menyimpan...</> : <><Save size={18} /> Simpan Ujian</>}
            </button>
            {exam && exam.status === 'draft' && (
              <button onClick={handlePublish} className="inline-flex items-center gap-xs px-lg py-2.5 rounded-xl bg-success text-on-success text-label-sm font-medium hover:bg-success-hover transition-all duration-200">
                <Send size={18} />
                Publikasikan
              </button>
            )}
          </div>
        </div>

        {/* Questions Section */}
        {exam && (
          <>
            <div className="flex items-center justify-between">
              <h3 className="text-title-sm font-semibold text-on-surface m-0">Soal Ujian ({questions.length})</h3>
              {canEditQuestions && (
                <button onClick={addQuestion} className="inline-flex items-center gap-xs px-md py-2 rounded-xl bg-primary text-on-primary text-label-sm font-medium hover:bg-primary-hover transition-all duration-200">
                  <Plus size={18} />
                  Tambah Soal
                </button>
              )}
            </div>

            {exam.status !== 'draft' && (
              <div className="flex items-start gap-sm px-lg py-md rounded-xl bg-warning-container text-on-warning-container text-body-sm">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <span>Ujian sudah dipublikasikan. Soal tidak dapat diubah, hanya detail ujian yang dapat diedit.</span>
              </div>
            )}

            {questions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-3xl text-on-surface-variant">
                <div className="w-20 h-20 rounded-full bg-surface-container-high flex items-center justify-center mb-lg">
                  <HelpCircle size={40} className="text-outline" />
                </div>
                <p className="text-body-lg font-medium text-on-surface">Belum Ada Soal</p>
                <p className="text-body-sm text-on-surface-variant mt-1">Klik "Tambah Soal" untuk mulai membuat soal.</p>
              </div>
            ) : (
              questions.map((q, idx) => (
                <div key={q.id} className="bg-surface rounded-2xl p-lg shadow-sm border border-outline-variant/30 animate-fadeIn space-y-md" style={{ animationDelay: `${idx * 0.05}s` }}>
                  <div className="flex items-center justify-between gap-md flex-wrap">
                    <div className="flex items-center gap-md">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-secondary-container text-on-secondary-container text-label-xs font-semibold">Soal {idx + 1}</span>
                      <select value={localFormData[q.id]?.type ?? q.type} onChange={e => { const newValue = e.target.value; setLocalFormData(prev => ({...prev, [q.id]: {...prev[q.id], type: newValue}})); handleUpdateQuestion(q.id, { type: newValue }, true); }} disabled={!canEditQuestions} className="px-md py-1.5 rounded-lg border border-outline bg-surface text-label-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200">
                        <option value="multiple_choice">Pilihan Ganda</option>
                        <option value="checkbox">Checkbox</option>
                        <option value="essay">Essay</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-sm">
                      <div className="flex items-center gap-xs">
                        <span className="text-label-xs text-on-surface-variant">Poin:</span>
                        <input type="number" value={localFormData[q.id]?.points ?? q.points} onChange={e => { const newValue = parseInt(e.target.value) || 0; setLocalFormData(prev => ({...prev, [q.id]: {...prev[q.id], points: newValue}})); handleUpdateQuestion(q.id, { points: newValue }, true); }} min="0" disabled={!canEditQuestions} className="w-16 px-2 py-1 rounded-lg border border-outline bg-surface text-label-sm text-center text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:opacity-60 disabled:bg-surface-container-low disabled:cursor-not-allowed transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                      </div>
                      {exam.status === 'draft' && (
                        <button onClick={() => handleDeleteQuestion(q.id)} className="flex items-center justify-center w-8 h-8 rounded-lg bg-error-container text-on-error-container hover:bg-error hover:text-on-error transition-all duration-200"><Trash2 size={16} /></button>
                      )}
                    </div>
                  </div>

                  <textarea value={localFormData[q.id]?.question ?? q.question} onChange={e => { const newValue = e.target.value; setLocalFormData(prev => ({...prev, [q.id]: {...prev[q.id], question: newValue}})); handleUpdateQuestion(q.id, { question: newValue }); }} placeholder="Tulis pertanyaan di sini..." rows="2" disabled={!canEditQuestions} className="w-full px-lg py-3 rounded-xl border border-outline bg-surface text-body-md text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:opacity-60 disabled:bg-surface-container-low disabled:cursor-not-allowed transition-all duration-200 resize-vertical min-h-[60px]" />

                  {/* Question Image Section */}
                  <div className="space-y-sm">
                    <label className="text-label-sm font-medium text-on-surface">Gambar Soal (Opsional)</label>
                    <div className="flex items-center gap-sm flex-wrap">
                      <input type="url" value={localFormData[q.id]?.image_url ?? q.image_url ?? ''} onChange={e => { const newValue = e.target.value; setLocalFormData(prev => ({...prev, [q.id]: {...prev[q.id], image_url: newValue}})); handleUpdateQuestion(q.id, { image_url: newValue }); }} placeholder="Masukkan URL gambar..." disabled={!canEditQuestions || uploadingImages.has(q.id)} className="w-full md:flex-1 md:min-w-[200px] px-md py-2 rounded-lg border border-outline bg-surface text-body-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:opacity-60 disabled:bg-surface-container-low disabled:cursor-not-allowed transition-all duration-200" />
                      <div className="flex items-center gap-xs">
                        <input type="file" accept="image/*" onChange={(e) => { const file = e.target.files[0]; if (file) handleImageUpload(q.id, file); e.target.value = ''; }} disabled={!canEditQuestions || uploadingImages.has(q.id)} className="hidden" id={`image-upload-${q.id}`} />
                        <label htmlFor={`image-upload-${q.id}`} className={`inline-flex items-center gap-xs px-md py-2 rounded-lg text-label-sm font-medium cursor-pointer transition-all duration-200 ${canEditQuestions && !uploadingImages.has(q.id) ? 'bg-secondary text-on-secondary hover:bg-secondary-hover' : 'bg-surface-container-high text-on-surface-variant cursor-not-allowed'}`}>
                          {uploadingImages.has(q.id) ? <><div className="w-3.5 h-3.5 border-2 border-on-secondary border-t-transparent rounded-full animate-spin" /> Upload...</> : <><Upload size={16} /> Upload</>}
                        </label>
                        {q.image_url && (
                          <button onClick={() => handleImageDelete(q.id, q.image_url)} disabled={!canEditQuestions} className="inline-flex items-center gap-xs px-md py-2 rounded-lg bg-error text-on-error text-label-sm font-medium hover:bg-error-hover disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200">
                            <Trash2 size={14} /> Hapus
                          </button>
                        )}
                      </div>
                    </div>
                    {q.image_url && (
                      <div className="border border-outline-variant/20 rounded-xl p-sm bg-surface-container-low max-w-xs">
                        <img src={q.image_url} alt="Preview" className="w-full h-auto rounded-lg max-h-[200px] object-contain" onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling.classList.remove('hidden'); }} />
                        <div className="hidden text-center text-error text-label-sm p-md">Gagal memuat gambar</div>
                      </div>
                    )}
                  </div>

                  {(q.type === 'multiple_choice' || q.type === 'checkbox') && (
                    <div className="space-y-sm">
                      {(q.options || []).map((opt, optIdx) => (
                        <div key={opt.id} className={`flex items-center gap-sm p-sm rounded-xl border-2 transition-all duration-200 ${updatingOptions.has(opt.id) ? 'opacity-60 border-warning/50' : 'border-outline-variant/30'} ${opt.is_correct ? 'border-success/50 bg-success-container/20' : ''}`}>
                          <input
                            type={q.type === 'multiple_choice' ? 'radio' : 'checkbox'}
                            name={`correct-${q.id}`}
                            checked={opt.is_correct}
                            disabled={!canEditQuestions || updatingOptions.has(opt.id)}
                            onChange={() => {
                              // Prevent multiple clicks while updating
                              if (updatingOptions.has(opt.id)) return;

                              // Add to updating set
                              setUpdatingOptions(prev => new Set(prev).add(opt.id));


                              if (q.type === 'multiple_choice') {
                                // For radio buttons: only one option can be correct
                                // Update local state immediately for better UX
                                setQuestions(prev => prev.map(question =>
                                  question.id === q.id ? {
                                    ...question,
                                    options: question.options?.map(o => ({
                                      ...o,
                                      is_correct: o.id === opt.id
                                    })) || []
                                  } : question
                                ));

                                // Update all options via API (set others to false, selected to true)
                                const updates = q.options.map(o => ({
                                  id: o.id,
                                  is_correct: o.id === opt.id
                                }));

                                // Update via API asynchronously
                                Promise.all(updates.map(u =>
                                  updateOption(u.id, { is_correct: u.is_correct })
                                )).then(() => {
                                  console.log('Radio options updated successfully');
                                }).catch(err => {
                                  console.error('Failed to update radio options:', err);
                                  // Revert local state on error
                                  setQuestions(prev => prev.map(question =>
                                    question.id === q.id ? {
                                      ...question,
                                      options: question.options?.map(o => ({
                                        ...o,
                                        is_correct: o.id === opt.id ? false : o.is_correct
                                      })) || []
                                    } : question
                                  ));
                                }).finally(() => {
                                  // Remove from updating set
                                  setUpdatingOptions(prev => {
                                    const newSet = new Set(prev);
                                    newSet.delete(opt.id);
                                    return newSet;
                                  });
                                });

                              } else {
                                // For checkboxes: toggle individual option
                                const newCorrectState = !opt.is_correct;

                                // Update local state immediately
                                setQuestions(prev => prev.map(question =>
                                  question.id === q.id ? {
                                    ...question,
                                    options: question.options?.map(o => ({
                                      ...o,
                                      is_correct: o.id === opt.id ? newCorrectState : o.is_correct
                                    })) || []
                                  } : question
                                ));

                                // Update via API
                                updateOption(opt.id, { is_correct: newCorrectState }).then(() => {
                                  console.log('Checkbox option updated successfully');
                                }).catch(err => {
                                  console.error('Failed to update checkbox option:', err);
                                  // Revert local state on error
                                  setQuestions(prev => prev.map(question =>
                                    question.id === q.id ? {
                                      ...question,
                                      options: question.options?.map(o => ({
                                        ...o,
                                        is_correct: o.id === opt.id ? !newCorrectState : o.is_correct
                                      })) || []
                                    } : question
                                  ));
                                }).finally(() => {
                                  // Remove from updating set
                                  setUpdatingOptions(prev => {
                                    const newSet = new Set(prev);
                                    newSet.delete(opt.id);
                                    return newSet;
                                  });
                                });
                              }
                            }}
                          />
                          <input type="text" value={opt.option_text} onChange={e => { const newValue = e.target.value; setQuestions(prev => prev.map(q => ({...q, options: q.options?.map(o => o.id === opt.id ? {...o, option_text: newValue} : o) || q.options}))); handleUpdateOption(opt.id, { option_text: newValue }); }} placeholder={`Opsi ${String.fromCharCode(65 + optIdx)}`} disabled={!canEditQuestions} className={`flex-1 px-sm py-1.5 rounded-lg border border-outline/50 bg-surface text-body-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200 ${!canEditQuestions ? 'opacity-60 bg-surface-container-low cursor-not-allowed' : ''}`} />
                          {canEditQuestions && q.options.length > 2 && (
                            <button onClick={() => handleDeleteOption(opt.id)} className="flex items-center justify-center w-8 h-8 rounded-lg text-on-surface-variant hover:bg-error-container hover:text-error transition-all duration-200 shrink-0"><Trash2 size={14} /></button>
                          )}
                        </div>
                      ))}
                      {canEditQuestions && (
                        <button onClick={() => addOption(q.id)} className="w-full inline-flex items-center justify-center gap-xs px-md py-2 rounded-xl border-2 border-dashed border-outline-variant/50 text-label-sm text-on-surface-variant hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all duration-200">
                          <Plus size={16} /> Tambah Opsi
                        </button>
                      )}
                    </div>
                  )}

                  {q.type === 'essay' && (
                    <div className="space-y-md pt-sm">
                      <div className="p-md rounded-xl bg-surface-container-low space-y-sm">
                        <div className="flex items-center gap-sm">
                          <input type="checkbox" id={`auto-grade-${q.id}`} checked={autoGradingSettings[q.id]?.enableAutoGrading || false} onChange={(e) => handleUpdateAutoGrading(q.id, e.target.checked, autoGradingSettings[q.id]?.gradingKeywords || [])} disabled={!canEditQuestions} className="accent-primary" />
                          <label htmlFor={`auto-grade-${q.id}`} className="text-label-sm font-medium text-on-surface cursor-pointer">Aktifkan Penilaian Otomatis</label>
                        </div>
                        <p className="text-label-xs text-on-surface-variant m-0">{autoGradingSettings[q.id]?.enableAutoGrading ? 'Penilaian otomatis berdasarkan kata kunci dan kesamaan dengan jawaban contoh.' : 'Murid akan menulis jawaban teks bebas. Penilaian dilakukan manual oleh guru.'}</p>
                      </div>
                      {autoGradingSettings[q.id]?.enableAutoGrading && (
                        <>
                          <div className="space-y-sm">
                            <label className="text-label-sm font-medium text-on-surface">Kata Kunci untuk Penilaian (pisahkan dengan koma)</label>
                            <textarea value={(autoGradingSettings[q.id]?.gradingKeywords || []).join(', ')} onChange={(e) => { const keywords = e.target.value.split(',').map(k => k.trim()).filter(k => k); handleUpdateAutoGrading(q.id, true, keywords); }} placeholder="contoh: fotosintesis, klorofil, energi matahari" disabled={!canEditQuestions} rows="2" className="w-full px-lg py-3 rounded-xl border border-outline bg-surface text-body-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:opacity-60 disabled:bg-surface-container-low disabled:cursor-not-allowed transition-all duration-200 resize-vertical" />
                            <p className="text-label-xs text-on-surface-variant m-0">Siswa mendapat poin untuk setiap kata kunci yang ada di jawaban mereka.</p>
                          </div>
                          <div className="space-y-sm">
                            <label className="text-label-sm font-medium text-on-surface">Jawaban Contoh/Model (Opsional)</label>
                            <textarea value={sampleAnswers[q.id] || ''} onChange={(e) => handleUpdateSampleAnswer(q.id, e.target.value)} placeholder="Tuliskan jawaban contoh yang baik untuk membantu siswa memahami ekspektasi..." disabled={!canEditQuestions} rows="4" className="w-full px-lg py-3 rounded-xl border border-outline bg-surface text-body-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:opacity-60 disabled:bg-surface-container-low disabled:cursor-not-allowed transition-all duration-200 resize-vertical" />
                            <p className="text-label-xs text-on-surface-variant m-0">Jawaban contoh digunakan untuk perhitungan kesamaan teks (30% bobot penilaian).</p>
                          </div>
                        </>
                      )}
                      {!autoGradingSettings[q.id]?.enableAutoGrading && (
                        <div className="flex items-start gap-sm px-lg py-md rounded-xl bg-warning-container text-on-warning-container text-label-sm">
                          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                          <span>Penilaian Manual: Jawaban siswa perlu dinilai secara manual oleh guru setelah ujian selesai.</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ExamBuilderPage;