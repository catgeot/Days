import { useState, useCallback } from 'react';
import { apiClient } from '../../../pages/Home/lib/apiClient';
import { invokeMooniChatToleratingChip } from '../../../pages/Home/lib/mooniChipEdgeFallback.js';
import { GeminiProxyError, getGeminiProxyErrorMessage } from '../../../pages/Home/lib/geminiProxyError';
import { resolveChatBookingActions } from '../../../utils/chatBookingResolver';
import { GEMINI_MODELS } from '../../../utils/geminiModels';
import { resolveMooniChatModel } from '../../../utils/mooniChatModel';
import { resolveChatCtaCode } from '../../../utils/chatCtaPromptHint';
import { mooniChatShowsPlannerHeaderButton } from '../../../shared/mooni/mooniChatPlannerHeaderPrompt';
import { resolveCatalogPlaceSlug } from '../../../pages/Home/lib/formatUrlName';
import { getMooniModelMarkdownForRender } from '../../../pages/Home/lib/mooniModelMessageText';
import { prepareMooniGeminiHistory } from '../../../utils/mooniGeminiHistoryPayload.js';
import {
  extractMooniTripFacts,
  mergeMooniTripSession,
} from '../../../pages/Home/lib/mooniTripSession.js';
import {
  ensureChatEssentialGuide,
  useChatEssentialGuide,
} from '../../../hooks/useChatEssentialGuide';
import { resolvePlaceChatKoreaFestivalHint } from '../../../pages/Home/lib/resolvePlaceChatKoreaFestivalHint.js';
import {
  buildMooniContinueUserText,
  buildMooniGeminiHistory,
  finalizeMooniContinuation,
  messageTextPlain,
} from '../../../pages/Home/lib/mooniChatContinue';

/**
 * Place Card AI 채팅 — 예약 CTA 포함 메시지 지원.
 *
 * @param {{ slug?: string, destinationName?: string, chatSource?: 'home' | 'place', locale?: string }} [options]
 */
export const usePlaceChat = (options = {}) => {
  const { slug = null, destinationName = '', chatSource = 'place', locale = 'ko' } = options;
  const cachedGuide = useChatEssentialGuide(slug, destinationName);

  const [chatHistory, setChatHistory] = useState([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [continuingIdx, setContinuingIdx] = useState(null);
  const [error, setError] = useState(null);

  const sendMessage = useCallback(async (userText, taskParams = {}) => {
    if (!userText.trim() || isAiLoading) return;

    setIsAiLoading(true);
    setError(null);

    const priorHistory = chatHistory;
    const newHistory = [...priorHistory, { role: 'user', text: userText }];
    setChatHistory(newHistory);

    try {
      const chatModelId = resolveMooniChatModel({
        userText,
        chatHistory: priorHistory,
      });
      const params = taskParams && typeof taskParams === 'object' ? taskParams : {};
      const history = prepareMooniGeminiHistory(
        priorHistory
          .filter((turn) => turn.role === 'user' || turn.role === 'model')
          .map((turn) => ({
            role: turn.role,
            text: String(turn.mooniRawReply ?? turn.text ?? ''),
          })),
      );

      const essentialGuide =
        (await ensureChatEssentialGuide(slug, destinationName)) ?? cachedGuide;

      const cta = resolveChatCtaCode({
        userText,
        slug,
        destinationName,
        chatHistory: priorHistory,
        essentialGuide,
      });

      let koreaFestivalHint = '';
      try {
        const festHint = await resolvePlaceChatKoreaFestivalHint({
          userText,
          festivalContext: params.festivalContext ?? null,
          boundPlaceName: params.boundPlaceName || destinationName || '',
          locale: params.locale || locale,
        });
        koreaFestivalHint = festHint.hint;
      } catch {
        koreaFestivalHint = '';
      }

      const catalogSlug = resolveCatalogPlaceSlug(slug);
      const showPlannerHeader = mooniChatShowsPlannerHeaderButton(catalogSlug);

      const geminiParams = {
        locale: params.locale || locale,
        persona: params.persona || 'GENERAL',
        tier: chatModelId === GEMINI_MODELS.QUALITY ? 'quality' : 'fast',
        locationName: params.locationName || destinationName || '',
        boundPlaceName: params.boundPlaceName || destinationName || '',
        isMooni: params.isMooni !== false,
        chipId: params.chipId ?? null,
        facts: params.facts ?? null,
        tripSession: params.tripSession ?? null,
        cta: cta.code,
        ctaPlace: cta.place || destinationName || '',
        koreaFestivalHint,
        showPlannerHeader,
      };

      const geminiResult = await invokeMooniChatToleratingChip(
        (chatParams) => apiClient.invokeGeminiTask('mooni_chat', chatParams),
        {
          ...geminiParams,
          history,
          userText,
        },
      );
      const aiReply = geminiResult.text;

      const tripSession = mergeMooniTripSession(params.tripSession, extractMooniTripFacts(userText, {
        destinationName,
        slug,
      }));

      const booking = resolveChatBookingActions({
        userText,
        destinationName,
        slug,
        chatHistory: priorHistory,
        chatSource,
        aiReplyText: aiReply,
        essentialGuide,
        tripSession,
        domesticKoreaFestival: Boolean(params.festivalContext?.contentId || koreaFestivalHint),
      });

      const hasTransportCta = (booking.actions ?? []).some((a) =>
        ['trip_com', 'twelve_go', 'direct', 'direct_ferries', 'klook_ferry'].includes(
          a.provider,
        ),
      );
      const stripPhantomTicketMention = !hasTransportCta;
      const displayReply = getMooniModelMarkdownForRender(aiReply, {
        stripPhantomTicketMention,
      });

      setChatHistory((prev) => [
        ...prev,
        {
          role: 'model',
          text: displayReply,
          mooniRawReply: aiReply,
          frozenBookingActions: booking.show ? booking.actions : null,
          truncated: geminiResult.truncated,
          finishReason: geminiResult.finishReason,
          continueAttempts: 0,
          mooniTurnContext: {
            geminiParams,
            stripPhantomTicketMention,
          },
          bookingActions: booking.show ? booking.actions : null,
          bookingMeta: booking.show
            ? {
                slug: booking.slug,
                plannerUrl: booking.plannerUrl,
                itineraryBookingCompact: Boolean(booking.itineraryBookingCompact),
              }
            : null,
        },
      ]);
    } catch (err) {
      const message = getGeminiProxyErrorMessage(err);
      const role = err instanceof GeminiProxyError && err.kind === 'budget' ? 'model' : 'error';
      setError(message);
      setChatHistory((prev) => [...prev, { role, text: message }]);
    } finally {
      setIsAiLoading(false);
    }
  }, [chatHistory, isAiLoading, slug, destinationName, chatSource, cachedGuide, locale]);

  const continueTruncatedReply = useCallback(
    async (modelIdx) => {
      const msg = chatHistory[modelIdx];
      const ctx = msg?.mooniTurnContext;
      if (!ctx?.geminiParams || continuingIdx != null) return;

      setContinuingIdx(modelIdx);
      setError(null);
      try {
        const history = buildMooniGeminiHistory(chatHistory, modelIdx);
        const priorRaw = String(msg.mooniRawReply ?? messageTextPlain(msg));
        const geminiResult = await invokeMooniChatToleratingChip(
          (chatParams) => apiClient.invokeGeminiTask('mooni_chat', chatParams),
          {
            ...ctx.geminiParams,
            history,
            userText: buildMooniContinueUserText(ctx.geminiParams.locale || locale),
          },
        );
        const { mergedRaw, displayText } = finalizeMooniContinuation({
          priorRaw,
          continuationText: geminiResult.text,
          stripPhantomTicketMention: ctx.stripPhantomTicketMention,
        });
        setChatHistory((prev) =>
          prev.map((m, i) =>
            i === modelIdx
              ? {
                  ...m,
                  text: displayText,
                  mooniRawReply: mergedRaw,
                  truncated: geminiResult.truncated,
                  finishReason: geminiResult.finishReason,
                  continueAttempts: (m.continueAttempts ?? 0) + 1,
                }
              : m,
          ),
        );
      } catch (err) {
        const message = getGeminiProxyErrorMessage(err);
        setError(message);
      } finally {
        setContinuingIdx(null);
      }
    },
    [chatHistory, continuingIdx, locale],
  );

  const clearChat = useCallback(() => {
    setChatHistory([]);
    setError(null);
    setIsAiLoading(false);
    setContinuingIdx(null);
  }, []);

  return {
    chatHistory,
    isAiLoading,
    continuingIdx,
    error,
    sendMessage,
    continueTruncatedReply,
    clearChat,
  };
};
