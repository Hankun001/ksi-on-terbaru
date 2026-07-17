import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import {
  fetchExamById, createExam, updateExam, publishExam, deleteExam,
  fetchQuestionsWithOptions, createQuestion, updateQuestion, deleteQuestion,
  createOption, updateOption, deleteOption, uploadQuestionImage, deleteQuestionImage
} from '../services/examService';
import { Plus, Save, Trash2, Send, Clock, AlertTriangle, ArrowLeft, HelpCircle, CheckSquare, Type } from 'lucide-react';
import '../styles/examStyles.css';

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
    return <div className="dashboard-container"><div className="loading">Memuat...</div></div>;
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
    <div className="dashboard-container">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <button onClick={onBack} className="btn btn-secondary" style={{ padding: '0.5rem' }}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h1 style={{ margin: 0, fontSize: '1.25rem' }}>{exam ? 'Edit Ujian' : 'Buat Ujian Baru'}</h1>
            {hasPendingUpdates && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.75rem',
                color: '#f59e0b',
                background: '#fef3c7',
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                border: '1px solid #fcd34d'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  background: '#f59e0b',
                  borderRadius: '50%',
                  animation: 'pulse 1.5s ease-in-out infinite'
                }} />
                Menyimpan...
              </div>
            )}
          </div>
          <p style={{ margin: '0.25rem 0 0', color: '#6b7280', fontSize: '0.85rem' }}>
            Buat soal ujian dengan mudah seperti Google Forms
          </p>
        </div>
      </div>

      <div className="exam-builder-container">
        {/* Basic Info */}
        <div className="exam-basic-info slide-up">
          <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', color: '#1f2937' }}>Informasi Ujian</h3>
          <div className="form-group">
            <label>Judul Ujian <span style={{ color: 'red' }}>*</span></label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Contoh: Ujian Tengah Semester Matematika"
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontSize: '1rem',
                minHeight: '44px',
                boxSizing: 'border-box'
              }}
            />
          </div>
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label>Deskripsi</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Deskripsi ujian (opsional)"
              rows="3"
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontSize: '0.95rem',
                fontFamily: 'inherit',
                minHeight: '80px',
                boxSizing: 'border-box'
              }}
            />
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '1rem',
            marginTop: '1rem'
          }}>
            <div className="form-group">
              <label>Durasi (menit)</label>
              <input
                type="number"
                value={durationMinutes}
                onChange={e => setDurationMinutes(e.target.value)}
                min="1"
                max="480"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontSize: '1rem',
                  minHeight: '44px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div className="form-group">
              <label>Nilai Kelulusan (%)</label>
              <input
                type="number"
                value={passingScore}
                onChange={e => setPassingScore(e.target.value)}
                min="0"
                max="100"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontSize: '1rem',
                  minHeight: '44px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
            <button onClick={handleSaveExam} className="btn btn-primary" disabled={saving}>
              <Save size={18} style={{ marginRight: '8px' }} />
              {saving ? 'Menyimpan...' : 'Simpan Ujian'}
            </button>
            {exam && exam.status === 'draft' && (
              <button onClick={handlePublish} className="btn btn-success" style={{ background: '#059669', color: 'white', border: 'none', padding: '0.75rem 1.25rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Send size={18} />
                Publikasikan
              </button>
            )}
          </div>
        </div>

        {/* Questions Section */}
        {exam && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1f2937' }}>
                Soal Ujian ({questions.length})
              </h3>
              {canEditQuestions && (
                <button onClick={addQuestion} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Plus size={18} />
                  Tambah Soal
                </button>
              )}
            </div>

            {exam.status !== 'draft' && (
              <div style={{ background: '#fef3c7', color: '#92400e', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
                <AlertTriangle size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                Ujian sudah dipublikasikan. Soal tidak dapat diubah, hanya detail ujian yang dapat diedit.
              </div>
            )}

            {questions.length === 0 ? (
              <div className="empty-state" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                <HelpCircle size={48} style={{ color: '#d1d5db', marginBottom: '1rem' }} />
                <p style={{ color: '#6b7280' }}>Belum ada soal. Klik "Tambah Soal" untuk mulai membuat soal.</p>
              </div>
            ) : (
              questions.map((q, idx) => (
                <div key={q.id} className="question-card slide-up" style={{ animationDelay: `${idx * 0.05}s` }}>
                  <div className="question-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span className="question-number">Soal {idx + 1}</span>
                      <select
                        value={localFormData[q.id]?.type ?? q.type}
                        onChange={e => {
                          const newValue = e.target.value;
                          // Update local state immediately
                          setLocalFormData(prev => ({
                            ...prev,
                            [q.id]: { ...prev[q.id], type: newValue }
                          }));
                          // Immediate update for select inputs
                          handleUpdateQuestion(q.id, { type: newValue }, true);
                        }}
                        className="question-type-select"
                        disabled={!canEditQuestions}
                      >
                        <option value="multiple_choice">Pilihan Ganda</option>
                        <option value="checkbox">Checkbox</option>
                        <option value="essay">Essay</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Poin:</span>
                        <input
                          type="number"
                          value={localFormData[q.id]?.points ?? q.points}
                          onChange={e => {
                            const newValue = parseInt(e.target.value) || 0;
                            // Update local state immediately
                            setLocalFormData(prev => ({
                              ...prev,
                              [q.id]: { ...prev[q.id], points: newValue }
                            }));
                            // Immediate update for number inputs
                            handleUpdateQuestion(q.id, { points: newValue }, true);
                          }}
                          min="0"
                          disabled={!canEditQuestions}
                          style={{
                            width: '60px',
                            padding: '0.25rem 0.5rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '0.85rem',
                            textAlign: 'center',
                            background: canEditQuestions ? 'white' : '#f9fafb',
                            color: canEditQuestions ? 'inherit' : '#6b7280'
                          }}
                        />
                      </div>
                      {exam.status === 'draft' && (
                        <button onClick={() => handleDeleteQuestion(q.id)} className="btn btn-danger btn-sm" style={{ padding: '0.35rem' }}>
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  <textarea
                    value={localFormData[q.id]?.question ?? q.question}
                    onChange={e => {
                      const newValue = e.target.value;
                      // Update local state immediately
                      setLocalFormData(prev => ({
                        ...prev,
                        [q.id]: { ...prev[q.id], question: newValue }
                      }));
                      // Debounced update to database
                      handleUpdateQuestion(q.id, { question: newValue });
                    }}
                    placeholder="Tulis pertanyaan di sini..."
                    rows="2"
                    disabled={!canEditQuestions}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      fontSize: '0.95rem',
                      fontFamily: 'inherit',
                      marginBottom: '1rem',
                      minHeight: '60px',
                      boxSizing: 'border-box',
                      background: canEditQuestions ? 'white' : '#f9fafb',
                      color: canEditQuestions ? 'inherit' : '#6b7280'
                    }}
                  />

                  {/* Question Image Section */}
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '0.85rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Gambar Soal (Opsional)
                    </label>

                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                      <input
                        type="url"
                        value={localFormData[q.id]?.image_url ?? q.image_url ?? ''}
                        onChange={e => {
                          const newValue = e.target.value;
                          // Update local state immediately
                          setLocalFormData(prev => ({
                            ...prev,
                            [q.id]: { ...prev[q.id], image_url: newValue }
                          }));
                          // Debounced update to database
                          handleUpdateQuestion(q.id, { image_url: newValue });
                        }}
                        placeholder="Masukkan URL gambar..."
                        disabled={!canEditQuestions || uploadingImages.has(q.id)}
                        style={{
                          flex: 1,
                          minWidth: '200px',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '6px',
                          border: '1px solid #d1d5db',
                          fontSize: '0.9rem',
                          boxSizing: 'border-box',
                          background: canEditQuestions ? 'white' : '#f9fafb',
                          color: canEditQuestions ? 'inherit' : '#6b7280'
                        }}
                      />

                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) handleImageUpload(q.id, file);
                            e.target.value = ''; // Reset input
                          }}
                          disabled={!canEditQuestions || uploadingImages.has(q.id)}
                          style={{ display: 'none' }}
                          id={`image-upload-${q.id}`}
                        />
                        <label
                          htmlFor={`image-upload-${q.id}`}
                          style={{
                            padding: '0.5rem 0.75rem',
                            background: canEditQuestions && !uploadingImages.has(q.id) ? '#8b5cf6' : '#e5e7eb',
                            color: canEditQuestions && !uploadingImages.has(q.id) ? 'white' : '#9ca3af',
                            borderRadius: '6px',
                            cursor: canEditQuestions && !uploadingImages.has(q.id) ? 'pointer' : 'not-allowed',
                            fontSize: '0.85rem',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          {uploadingImages.has(q.id) ? (
                            <>
                              <div style={{
                                width: '14px',
                                height: '14px',
                                border: '2px solid #e5e7eb',
                                borderTop: '2px solid #8b5cf6',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite'
                              }} />
                              Upload...
                            </>
                          ) : (
                            <>
                              📁 Upload
                            </>
                          )}
                        </label>

                        {q.image_url && (
                          <button
                            onClick={() => handleImageDelete(q.id, q.image_url)}
                            disabled={!canEditQuestions}
                            style={{
                              padding: '0.5rem 0.75rem',
                              background: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: canEditQuestions ? 'pointer' : 'not-allowed',
                              fontSize: '0.85rem',
                              fontWeight: '500',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}
                          >
                            🗑️ Hapus
                          </button>
                        )}
                      </div>
                    </div>

                    {q.image_url && (
                      <div style={{
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '0.5rem',
                        background: '#f9fafb',
                        maxWidth: '300px'
                      }}>
                        <img
                          src={q.image_url}
                          alt="Preview gambar soal"
                          style={{
                            width: '100%',
                            height: 'auto',
                            borderRadius: '4px',
                            maxHeight: '200px',
                            objectFit: 'contain'
                          }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                          }}
                        />
                        <div style={{
                          display: 'none',
                          textAlign: 'center',
                          color: '#ef4444',
                          fontSize: '0.8rem',
                          padding: '1rem'
                        }}>
                          Gagal memuat gambar
                        </div>
                      </div>
                    )}
                  </div>

                  {(q.type === 'multiple_choice' || q.type === 'checkbox') && (
                    <div>
                      {(q.options || []).map((opt, optIdx) => (
                        <div key={opt.id} className={`option-row ${updatingOptions.has(opt.id) ? 'updating' : ''}`}>
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
                          <input
                            type="text"
                            value={opt.option_text}
                            onChange={e => {
                              const newValue = e.target.value;
                              // Update local state immediately
                              setQuestions(prev => prev.map(q => ({
                                ...q,
                                options: q.options?.map(o =>
                                  o.id === opt.id ? { ...o, option_text: newValue } : o
                                ) || q.options
                              })));
                              // Debounced update to database
                              handleUpdateOption(opt.id, { option_text: newValue });
                            }}
                            placeholder={`Opsi ${String.fromCharCode(65 + optIdx)}`}
                            disabled={!canEditQuestions}
                            style={{
                              background: canEditQuestions ? 'white' : '#f9fafb',
                              color: canEditQuestions ? 'inherit' : '#6b7280'
                            }}
                          />
                          {canEditQuestions && q.options.length > 2 && (
                            <button onClick={() => handleDeleteOption(opt.id)} className="btn btn-danger btn-sm" style={{ padding: '0.25rem', minWidth: '32px', minHeight: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                      {canEditQuestions && (
                        <button onClick={() => addOption(q.id)} className="add-option-btn">
                          <Plus size={16} />
                          Tambah Opsi
                        </button>
                      )}
                    </div>
                  )}

                  {q.type === 'essay' && (
                    <div style={{ marginTop: '1rem' }}>
                      <div style={{ padding: '1rem', background: '#f9fafb', borderRadius: '8px', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <input
                            type="checkbox"
                            id={`auto-grade-${q.id}`}
                            checked={autoGradingSettings[q.id]?.enableAutoGrading || false}
                            onChange={(e) => handleUpdateAutoGrading(q.id, e.target.checked, autoGradingSettings[q.id]?.gradingKeywords || [])}
                            disabled={!canEditQuestions}
                          />
                          <label htmlFor={`auto-grade-${q.id}`} style={{ fontSize: '0.85rem', fontWeight: '500', color: '#374151' }}>
                            Aktifkan Penilaian Otomatis
                          </label>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: '0.5rem 0' }}>
                          {autoGradingSettings[q.id]?.enableAutoGrading
                            ? 'Penilaian otomatis berdasarkan kata kunci dan kesamaan dengan jawaban contoh.'
                            : 'Murid akan menulis jawaban teks bebas. Penilaian dilakukan manual oleh guru.'
                          }
                        </p>
                      </div>

                      {autoGradingSettings[q.id]?.enableAutoGrading && (
                        <>
                          <div style={{ marginBottom: '1rem' }}>
                            <label style={{
                              display: 'block',
                              fontSize: '0.85rem',
                              fontWeight: '500',
                              color: '#374151',
                              marginBottom: '0.5rem'
                            }}>
                              Kata Kunci untuk Penilaian (pisahkan dengan koma)
                            </label>
                            <textarea
                              value={(autoGradingSettings[q.id]?.gradingKeywords || []).join(', ')}
                              onChange={(e) => {
                                const keywords = e.target.value.split(',').map(k => k.trim()).filter(k => k);
                                handleUpdateAutoGrading(q.id, true, keywords);
                              }}
                              placeholder="contoh: fotosintesis, klorofil, energi matahari"
                              disabled={!canEditQuestions}
                              rows="2"
                              style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: '8px',
                                border: '1px solid #d1d5db',
                                fontSize: '0.9rem',
                                fontFamily: 'inherit',
                                resize: 'vertical'
                              }}
                            />
                            <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                              Siswa mendapat poin untuk setiap kata kunci yang ada di jawaban mereka.
                            </small>
                          </div>

                          <div style={{ marginBottom: '1rem' }}>
                            <label style={{
                              display: 'block',
                              fontSize: '0.85rem',
                              fontWeight: '500',
                              color: '#374151',
                              marginBottom: '0.5rem'
                            }}>
                              Jawaban Contoh/Model (Opsional)
                            </label>
                            <textarea
                              value={sampleAnswers[q.id] || ''}
                              onChange={(e) => handleUpdateSampleAnswer(q.id, e.target.value)}
                              placeholder="Tuliskan jawaban contoh yang baik untuk membantu siswa memahami ekspektasi..."
                              disabled={!canEditQuestions}
                              rows="4"
                              style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: '8px',
                                border: '1px solid #d1d5db',
                                fontSize: '0.9rem',
                                fontFamily: 'inherit',
                                resize: 'vertical'
                              }}
                            />
                            <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                              Jawaban contoh digunakan untuk perhitungan kesamaan teks (30% bobot penilaian).
                            </small>
                          </div>
                        </>
                      )}

                      {!autoGradingSettings[q.id]?.enableAutoGrading && (
                        <div style={{ padding: '1rem', background: '#fef3c7', borderRadius: '8px', color: '#92400e', fontSize: '0.85rem' }}>
                          ⚠️ Penilaian Manual: Jawaban siswa perlu dinilai secara manual oleh guru setelah ujian selesai.
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