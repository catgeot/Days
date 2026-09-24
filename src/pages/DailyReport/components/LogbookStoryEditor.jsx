import React, { useCallback, useRef, useState } from 'react';
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  Link2,
  Minus,
  ImagePlus,
  Eye,
  Pencil,
  Loader2,
  Images,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  MOBILE_TEXTAREA_CLASS,
} from '../../../shared/hooks/useMobileInputViewport';
import LogbookBody from './LogbookBody';
import {
  applyMarkdownWrap,
  buildLogbookMomentPlaceholder,
  insertAtCursor,
  toggleLineHeading,
} from '../utils/logbookEditorMarkdown.js';
import { uploadLogbookStorageImage } from '../utils/uploadLogbookStorageImage.js';

function ToolbarButton({ onClick, disabled, active, title, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={`p-2 rounded-lg border text-gray-600 transition-all disabled:opacity-40 ${
        active
          ? 'bg-blue-100 border-blue-300 text-blue-700'
          : 'bg-white border-gray-200 hover:bg-gray-100 hover:border-gray-300'
      }`}
    >
      {children}
    </button>
  );
}

export default function LogbookStoryEditor({
  content,
  onChange,
  disabled = false,
  onBlur,
  galleryImages = [],
  aiToolbar,
}) {
  const { t } = useTranslation();
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const [mode, setMode] = useState('edit');
  const [bodyUploading, setBodyUploading] = useState(false);
  const [showMomentMenu, setShowMomentMenu] = useState(false);

  const applyEdit = useCallback(
    (nextValue, selectionStart, selectionEnd) => {
      onChange(nextValue);
      requestAnimationFrame(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.focus();
        el.setSelectionRange(selectionStart, selectionEnd);
      });
    },
    [onChange],
  );

  const withSelection = useCallback((fn) => {
    const el = textareaRef.current;
    if (!el || disabled) return;
    const { selectionStart, selectionEnd } = el;
    const result = fn(content, selectionStart, selectionEnd);
    applyEdit(result.value, result.selectionStart, result.selectionEnd);
  }, [applyEdit, content, disabled]);

  const handleBold = () => withSelection((text, s, e) => applyMarkdownWrap(text, s, e, '**'));
  const handleItalic = () => withSelection((text, s, e) => applyMarkdownWrap(text, s, e, '*'));
  const handleH2 = () => withSelection((text, s, e) => toggleLineHeading(text, s, e, 2));
  const handleH3 = () => withSelection((text, s, e) => toggleLineHeading(text, s, e, 3));
  const handleHr = () =>
    withSelection((text, s, e) => insertAtCursor(text, s, e, '---', { block: true }));

  const handleLink = () => {
    const el = textareaRef.current;
    if (!el || disabled) return;
    const { selectionStart, selectionEnd } = el;
    const selected = content.slice(selectionStart, selectionEnd) || t('logbook.write.editor.linkLabel');
    const url = window.prompt(t('logbook.write.editor.linkUrlPrompt'), 'https://');
    if (!url || url === 'https://') return;
    const snippet = `[${selected}](${url.trim()})`;
    const result = insertAtCursor(content, selectionStart, selectionEnd, snippet);
    applyEdit(result.value, result.selectionStart, result.selectionEnd);
  };

  const handleInsertMoment = (index) => {
    const snippet = buildLogbookMomentPlaceholder(index);
    withSelection((text, s, e) => insertAtCursor(text, s, e, snippet, { block: true }));
    setShowMomentMenu(false);
  };

  const handleBodyImagePick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || disabled || bodyUploading) return;

    setBodyUploading(true);
    try {
      const url = await uploadLogbookStorageImage(file);
      const alt = t('logbook.write.editor.bodyImageAlt');
      const snippet = `![${alt}](${url})`;
      const el = textareaRef.current;
      const start = el?.selectionStart ?? content.length;
      const end = el?.selectionEnd ?? content.length;
      const result = insertAtCursor(content, start, end, snippet, { block: true });
      applyEdit(result.value, result.selectionStart, result.selectionEnd);
    } catch (err) {
      console.error(err);
      alert(t('logbook.write.editor.bodyImageFail'));
    } finally {
      setBodyUploading(false);
    }
  };

  const editorDisabled = disabled || bodyUploading;

  return (
    <div className="flex flex-col flex-1 min-h-[400px]">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-4 border-b border-gray-200">
        <div className="flex flex-wrap items-center gap-1.5">
          <ToolbarButton
            onClick={() => setMode('edit')}
            active={mode === 'edit'}
            disabled={editorDisabled}
            title={t('logbook.write.editor.modeEdit')}
          >
            <Pencil size={14} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => setMode('preview')}
            active={mode === 'preview'}
            disabled={editorDisabled}
            title={t('logbook.write.editor.modePreview')}
          >
            <Eye size={14} />
          </ToolbarButton>
          <span className="w-px h-6 bg-gray-200 mx-1 hidden sm:block" aria-hidden />
          <ToolbarButton onClick={handleBold} disabled={editorDisabled || mode === 'preview'} title={t('logbook.write.editor.bold')}>
            <Bold size={14} />
          </ToolbarButton>
          <ToolbarButton onClick={handleItalic} disabled={editorDisabled || mode === 'preview'} title={t('logbook.write.editor.italic')}>
            <Italic size={14} />
          </ToolbarButton>
          <ToolbarButton onClick={handleH2} disabled={editorDisabled || mode === 'preview'} title={t('logbook.write.editor.heading2')}>
            <Heading2 size={14} />
          </ToolbarButton>
          <ToolbarButton onClick={handleH3} disabled={editorDisabled || mode === 'preview'} title={t('logbook.write.editor.heading3')}>
            <Heading3 size={14} />
          </ToolbarButton>
          <ToolbarButton onClick={handleLink} disabled={editorDisabled || mode === 'preview'} title={t('logbook.write.editor.link')}>
            <Link2 size={14} />
          </ToolbarButton>
          <ToolbarButton onClick={handleHr} disabled={editorDisabled || mode === 'preview'} title={t('logbook.write.editor.divider')}>
            <Minus size={14} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => fileInputRef.current?.click()}
            disabled={editorDisabled || mode === 'preview'}
            title={t('logbook.write.editor.insertBodyImage')}
          >
            {bodyUploading ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />}
          </ToolbarButton>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleBodyImagePick} />
          {galleryImages.length > 0 && (
            <div className="relative">
              <ToolbarButton
                onClick={() => setShowMomentMenu((v) => !v)}
                disabled={editorDisabled || mode === 'preview'}
                title={t('logbook.write.editor.insertMoment')}
              >
                <Images size={14} />
              </ToolbarButton>
              {showMomentMenu && (
                <div className="absolute left-0 top-full mt-1 z-30 min-w-[140px] bg-white border border-gray-200 rounded-xl shadow-lg py-1">
                  {galleryImages.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100"
                      onClick={() => handleInsertMoment(idx)}
                    >
                      {t('logbook.write.editor.momentSlot', { n: idx + 1 })}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        {aiToolbar}
      </div>

      <p className="text-[10px] text-gray-400 mb-3 leading-relaxed">
        {t('logbook.write.editor.hint')}
      </p>

      {mode === 'preview' ? (
        <div className="flex-1 min-h-[400px] rounded-2xl border border-dashed border-gray-200 bg-white/80 p-4 sm:p-6 overflow-y-auto">
          {content.trim() ? (
            <LogbookBody
              content={content}
              images={galleryImages}
              imageFrameClass="my-8 rounded-2xl overflow-hidden border border-gray-200 shadow-sm"
              imageClass="w-full h-auto object-cover"
              showImageOverlay={false}
            />
          ) : (
            <p className="text-gray-400 text-sm">{t('logbook.write.editor.previewEmpty')}</p>
          )}
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          className={`w-full bg-transparent border-none resize-none outline-none text-lg leading-[2] text-gray-800 placeholder-gray-400 flex-1 min-h-[400px] ${MOBILE_TEXTAREA_CLASS}`}
          value={content}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          disabled={editorDisabled}
          placeholder={t('logbook.write.contentPlaceholder')}
        />
      )}
    </div>
  );
}
