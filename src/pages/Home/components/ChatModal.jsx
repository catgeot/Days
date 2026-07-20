import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Send, Loader2, MessageSquare, Trash2, Sparkles, ChevronLeft } from 'lucide-react';
import { getSystemPrompt, PERSONA_TYPES } from '../lib/prompts';
import { apiClient } from '../lib/apiClient';
import { getGeminiProxyErrorMessage } from '../lib/geminiProxyError';
import { tripHasPersistedDialogue } from '../lib/tripChatUtils';
import {
  fetchPlaceChatIntroSummary,
  generatePlaceChatIntroWithAi,
  persistPlaceChatIntroSummary,
  formatPlaceChatLabel,
} from '../lib/placeChatIntro';
import { resolveCatalogPlaceSlug } from '../lib/formatUrlName';
import {
  shouldUsePlannerPersona,
  resolveSlugFromDestination,
} from '../../../utils/bookingIntentResolver';
import { resolveChatBookingActions, refreshStoredBookingActionLabels } from '../../../utils/chatBookingResolver';
import {
  resolveDestinationFromChat,
  isAccessRouteQuery,
  isFerryRouteQuery,
  resolveDepartureLabelFromChat,
  resolveSessionBoundSpot,
  normalizeAccessDepartureUserText,
} from '../../../utils/resolveDestinationFromChat';
import BookingActionCards from '../../../components/chat/BookingActionCards';
import DestinationResolutionChips from '../../../components/chat/DestinationResolutionChips';
import MooniPlannerFollowUp from '../../../components/chat/MooniPlannerFollowUp';
import MooniQuickReplyChips from '../../../components/chat/MooniQuickReplyChips';
import {
  sanitizeMooniModelReply,
  shouldShowMooniPlannerFollowUp,
} from '../../../utils/mooniReplySanitizer';
import { buildPlacePlannerPath } from '../../../utils/placePlannerPath';
import {
  buildPlacePlannerPathWithFocus,
  resolvePlannerFocusFromUserText,
} from '../../../utils/placePlannerFocus';
import { getChatCtaPromptHint } from '../../../utils/chatCtaPromptHint';
import {
  ensureChatEssentialGuide,
  useChatEssentialGuide,
} from '../../../hooks/useChatEssentialGuide';
import {
  buildMooniIntroWithHint,
  getMooniQuickReplies,
  getMooniL1ChipLabel,
  ACCESS_DEPARTURE_INPUT_PLACEHOLDER,
  buildAccessRouteAskText,
} from '../lib/mooniQuickReplies';
import { resolveMooniChatModel } from '../../../utils/mooniChatModel';
import { getMooniChipPromptHint, MOONI_CHIP_IDS } from '../lib/mooniChipPrompts';
import { TripcomFlightSearchProvider } from '../../../components/PlaceCard/tabs/planner/TripcomFlightSearchContext';
import FlightOriginSelector from './FlightOriginSelector';
import { getFlightCinemaOriginOption } from '../lib/flightCinemaOriginOptions';
import {
  persistFlightOriginIata,
  resolveDefaultFlightOriginIata,
} from '../lib/flightOriginPreference';

const ChatModal = ({
  isOpen,
  overlaySuppressed = false,
  onClose,
  mooniEntry = false,
  mooniPlaceContext = null,
  initialQuery,
  chatHistory = [],
  chatDraft = null,
  onCreateTripOnFirstUserMessage,
  onUpdateChat,
  onUpdateTripDestination,
  onUpdateChatDraft,
  activeChatId,
  onSwitchChat,
  onDeleteChat
}) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentPersona, setCurrentPersona] = useState(PERSONA_TYPES.GENERAL);
  const [loadingStatus, setLoadingStatus] = useState("AI가 답변을 준비 중입니다...");
  const [placeIntro, setPlaceIntro] = useState(null);
  const [placeIntroLoading, setPlaceIntroLoading] = useState(false);
  const [placeIntroError, setPlaceIntroError] = useState(null);
  const [topicDockParent, setTopicDockParent] = useState(null);
  /** 모바일 주제 독: 입력 포커스·타이핑 시 칩 숨기고 검색바 확장 */
  const [mobileDockInputFocused, setMobileDockInputFocused] = useState(false);
  const [accessOriginIata, setAccessOriginIata] = useState(() => resolveDefaultFlightOriginIata());
  const [accessOriginSearchOpen, setAccessOriginSearchOpen] = useState(false);
  const [accessOriginSearchActive, setAccessOriginSearchActive] = useState(false);

  const navigate = useNavigate();
  const lastQuestionRef = useRef(null);
  const messagesEndRef = useRef(null);
  const chatInputRef = useRef(null);
  const mobileDockInputRef = useRef(null);
  const hasSentInitialRef = useRef(false);
  const mobileDockBlurTimerRef = useRef(null);

  const collapseMobileDockInput = useCallback(() => {
    if (mobileDockBlurTimerRef.current) {
      clearTimeout(mobileDockBlurTimerRef.current);
      mobileDockBlurTimerRef.current = null;
    }
    setMobileDockInputFocused(false);
    mobileDockInputRef.current?.blur();
  }, []);

  const handleClose = useCallback(() => {
    chatInputRef.current?.blur();
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    onClose();
  }, [onClose]);

  const handlePlannerNavigate = useCallback(
    (plannerPath) => {
      handleClose();
      navigate(plannerPath);
    },
    [handleClose, navigate]
  );

  const introDestinationRaw = useMemo(() => {
    if (!isOpen) return '';
    const fromDraft = (chatDraft?.destination || '').trim();
    if (fromDraft) return fromDraft;
    if (activeChatId && Array.isArray(chatHistory)) {
      const trip = chatHistory.find((t) => String(t.id) === String(activeChatId));
      return (trip?.destination || '').trim();
    }
    return '';
  }, [isOpen, chatDraft?.destination, activeChatId, chatHistory]);

  const isMooniSession = introDestinationRaw === 'MOONi';
  const isMooniUi = mooniEntry || isMooniSession;

  /** Place-bound session: SSOT slug when catalogued; uiPlace uses name/country seed. */
  const activeSessionPlace = useMemo(() => {
    if (!isOpen) return null;

    const entryLabel = formatPlaceChatLabel(mooniPlaceContext);
    const entrySeed = entryLabel
      ? {
          slug: resolveCatalogPlaceSlug(mooniPlaceContext?.slug) || null,
          name: entryLabel,
          country: mooniPlaceContext?.country ?? null,
          lat: mooniPlaceContext?.lat ?? null,
          lng: mooniPlaceContext?.lng ?? null,
        }
      : null;

    if (chatDraft && !activeChatId) {
      const fromDraft = resolveSessionBoundSpot(chatDraft.destination || '', []);
      if (fromDraft) {
        return {
          slug: fromDraft.slug,
          name: formatPlaceChatLabel(fromDraft) || fromDraft.name,
          country: fromDraft.country ?? null,
          lat: fromDraft.lat ?? null,
          lng: fromDraft.lng ?? null,
        };
      }
      // Draft destination may already be 「국가 지명」 (uiPlace) — keep it over empty seed
      const draftLabel = String(chatDraft.destination || '').trim();
      if (draftLabel && draftLabel !== 'MOONi') {
        return {
          slug: entrySeed?.slug ?? null,
          name: draftLabel,
          country: entrySeed?.country ?? null,
          lat: entrySeed?.lat ?? chatDraft.lat ?? null,
          lng: entrySeed?.lng ?? chatDraft.lng ?? null,
        };
      }
      return entrySeed;
    }

    if (activeChatId && Array.isArray(chatHistory)) {
      const trip = chatHistory.find((t) => String(t.id) === String(activeChatId));
      if (trip) {
        // Prefer trip.messages (not local messages) to avoid one-frame stale
        // place after sidebar switch before the messages sync effect runs.
        const fromTrip = resolveSessionBoundSpot(
          trip.destination || '',
          trip.messages || []
        );
        if (fromTrip) {
          return {
            slug: fromTrip.slug,
            name: formatPlaceChatLabel(fromTrip) || fromTrip.name,
            country: fromTrip.country ?? null,
            lat: fromTrip.lat ?? null,
            lng: fromTrip.lng ?? null,
          };
        }
        const tripDest = String(trip.destination || '').trim();
        if (tripDest && tripDest !== 'MOONi') {
          return {
            slug: entrySeed?.slug ?? null,
            name: tripDest,
            country: entrySeed?.country ?? trip.curation_data?.country ?? null,
            lat: entrySeed?.lat ?? trip.lat ?? null,
            lng: entrySeed?.lng ?? trip.lng ?? null,
          };
        }
      }
    }

    return entrySeed;
  }, [isOpen, chatDraft, activeChatId, chatHistory, mooniPlaceContext]);

  const boundDestinationSlug = resolveCatalogPlaceSlug(activeSessionPlace?.slug) || null;
  /** 지명만 있는 uiPlace도 주제 칩 허용 (플래너·카탈로그 연동은 slug 있을 때만) */
  const hasPlaceBoundName = Boolean(String(activeSessionPlace?.name || '').trim());
  const allowNameBoundChips = hasPlaceBoundName && !boundDestinationSlug;

  const mooniHeaderLabel = useMemo(() => {
    if (!isMooniUi) return introDestinationRaw || 'MOONi';
    const placeName = activeSessionPlace?.name ?? null;
    return placeName ? `${placeName} · MOONi` : 'MOONi';
  }, [isMooniUi, activeSessionPlace?.name, introDestinationRaw]);

  const placeIntroTarget = useMemo(() => {
    if (!isOpen) return '';
    if (activeSessionPlace?.name) return activeSessionPlace.name.trim();
    if (isMooniUi) return '';
    return introDestinationRaw;
  }, [isOpen, activeSessionPlace?.name, isMooniUi, introDestinationRaw]);

  const effectiveQuickReplySlug = boundDestinationSlug;

  const topicDockDestName = activeSessionPlace?.name ?? '';

  const topicEssentialGuide = useChatEssentialGuide(
    effectiveQuickReplySlug,
    topicDockDestName
  );

  const quickReplies = useMemo(
    () =>
      getMooniQuickReplies(
        effectiveQuickReplySlug,
        topicDockParent ? 2 : 1,
        topicDockParent,
        {
          essentialGuide: topicEssentialGuide,
          omitPlanner: !topicDockParent || !boundDestinationSlug,
          allowNameBound: allowNameBoundChips,
        }
      ),
    [
      effectiveQuickReplySlug,
      topicDockParent,
      topicEssentialGuide,
      boundDestinationSlug,
      allowNameBoundChips,
    ]
  );

  const showBoundTopicDock =
    isMooniUi && hasPlaceBoundName && quickReplies.length > 0;

  const showAccessOriginDock =
    isMooniUi && topicDockParent === 'access' && hasPlaceBoundName;

  const mobileDockInputExpanded =
    showBoundTopicDock &&
    !showAccessOriginDock &&
    (mobileDockInputFocused || Boolean(input.trim()));

  const topicDockPrompt =
    !topicDockParent && messages.length === 0 ? '무엇부터 도와드릴까요?' : null;

  const showTopicDockPrompt = Boolean(topicDockPrompt);

  const chatInputPlaceholder = useMemo(() => {
    if (topicDockParent === 'access') return ACCESS_DEPARTURE_INPUT_PLACEHOLDER;
    if (effectiveQuickReplySlug) return '또는 직접 입력…';
    return '메시지 입력...';
  }, [topicDockParent, effectiveQuickReplySlug]);

  useEffect(() => {
    setTopicDockParent(null);
    setAccessOriginSearchOpen(false);
    setAccessOriginSearchActive(false);
  }, [effectiveQuickReplySlug]);

  useEffect(() => {
    setTopicDockParent(null);
    setAccessOriginSearchOpen(false);
    setAccessOriginSearchActive(false);
  }, [activeChatId]);

  useEffect(() => {
    if (!isOpen) {
      setTopicDockParent(null);
      setMobileDockInputFocused(false);
      setAccessOriginSearchOpen(false);
      setAccessOriginSearchActive(false);
      if (mobileDockBlurTimerRef.current) {
        clearTimeout(mobileDockBlurTimerRef.current);
        mobileDockBlurTimerRef.current = null;
      }
    } else {
      setAccessOriginIata(resolveDefaultFlightOriginIata());
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (mobileDockBlurTimerRef.current) {
        clearTimeout(mobileDockBlurTimerRef.current);
      }
    };
  }, []);

  /** 키보드만 닫히고 blur가 안 오는 경우(iOS 등) — 빈 입력이면 칩 복귀 */
  useEffect(() => {
    if (!isOpen || !mobileDockInputFocused) return undefined;
    const vv = window.visualViewport;
    if (!vv) return undefined;
    let prevHeight = vv.height;
    const onResize = () => {
      const nextHeight = vv.height;
      const grew = nextHeight - prevHeight;
      prevHeight = nextHeight;
      if (grew < 100) return;
      if (mobileDockInputRef.current?.value?.trim()) return;
      setMobileDockInputFocused(false);
      mobileDockInputRef.current?.blur();
    };
    vv.addEventListener('resize', onResize);
    return () => vv.removeEventListener('resize', onResize);
  }, [isOpen, mobileDockInputFocused]);

  useEffect(() => {
    if (topicDockParent && topicDockParent !== 'access' && quickReplies.length === 0) {
      setTopicDockParent(null);
    }
  }, [topicDockParent, quickReplies.length]);

  useEffect(() => {
    if (topicDockParent !== 'access') {
      setAccessOriginSearchOpen(false);
      setAccessOriginSearchActive(false);
    }
  }, [topicDockParent]);

  useEffect(() => {
    if (!isOpen || !placeIntroTarget) {
      setPlaceIntro(null);
      setPlaceIntroError(null);
      setPlaceIntroLoading(false);
      return;
    }

    let cancelled = false;
    setPlaceIntro(null);
    setPlaceIntroError(null);
    setPlaceIntroLoading(true);

    (async () => {
      try {
        let text = await fetchPlaceChatIntroSummary(placeIntroTarget);
        if (cancelled) return;
        if (text) {
          setPlaceIntro(text);
          return;
        }
        text = await generatePlaceChatIntroWithAi(placeIntroTarget);
        if (cancelled) return;
        setPlaceIntro(text);
        await persistPlaceChatIntroSummary(placeIntroTarget, text);
      } catch (e) {
        if (!cancelled) {
          setPlaceIntroError(e?.message || '여행지 요약을 불러오지 못했습니다.');
        }
      } finally {
        if (!cancelled) setPlaceIntroLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, placeIntroTarget]);

  // 🚨 보안 수정: 클라이언트에서 API 키를 가져오지 않습니다. 서버 프록시 사용.
  // const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  useEffect(() => {
    let interval;
    if (isLoading) {
      const statuses = [
        "새로운 여행지 정보를 스캔하고 있습니다...",
        "숨겨진 로컬 맛집과 명소를 찾는 중...",
        "🗺️ 여행 계획을 정리하고 있습니다...",
        "✈️ 답변을 생성 중입니다..."
      ];
      let i = 0;
      setLoadingStatus(statuses[0]);
      interval = setInterval(() => {
        i = (i + 1) % statuses.length;
        setLoadingStatus(statuses[i]);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  useEffect(() => {
    if (!isOpen) return undefined;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        if (lastQuestionRef.current) {
          lastQuestionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (!isOpen) {
      setMessages([]);
      return;
    }
    if (activeChatId) {
      const targetTrip = chatHistory.find(
        (t) => String(t.id) === String(activeChatId)
      );
      if (targetTrip) {
        setMessages(targetTrip.messages || []);
        if (targetTrip.persona) setCurrentPersona(targetTrip.persona);
      }
      return;
    }
    if (chatDraft) {
      setMessages([]);
      if (chatDraft.persona) setCurrentPersona(chatDraft.persona);
    }
  }, [activeChatId, isOpen, chatHistory, chatDraft]);

  const applyDestinationBinding = useCallback(async (chatId, draft, candidate) => {
    if (!candidate?.name) return;
    const patch = {
      destination: candidate.name,
      lat: candidate.lat ?? draft?.lat ?? 0,
      lng: candidate.lng ?? draft?.lng ?? 0,
    };
    if (chatId && onUpdateTripDestination) {
      await onUpdateTripDestination(chatId, patch);
    } else if (draft && onUpdateChatDraft) {
      onUpdateChatDraft(patch);
    }
  }, [onUpdateTripDestination, onUpdateChatDraft]);

  const handleSelectDestinationCandidate = useCallback(async (candidate, messageIndex) => {
    if (!candidate?.slug || !candidate?.name || isLoading) return;

    await applyDestinationBinding(activeChatId, chatDraft, candidate);

    let introText = await fetchPlaceChatIntroSummary(candidate.name);
    if (!introText) {
      try {
        introText = await generatePlaceChatIntroWithAi(candidate.name);
        await persistPlaceChatIntroSummary(candidate.name, introText);
      } catch {
        introText = '';
      }
    }

    const confirmed = { slug: candidate.slug, name: candidate.name };
    const modelText = buildMooniIntroWithHint(introText, candidate.name);

    const baseMessages = messages.map((m, i) =>
      i === messageIndex
        ? {
            ...m,
            destinationCandidates: null,
            confirmedDestination: confirmed,
          }
        : m
    );

    let effectiveChatId = activeChatId;
    if (!effectiveChatId && chatDraft) {
      const userText = baseMessages[messageIndex]?.text ?? '';
      const created = await onCreateTripOnFirstUserMessage({
        destination: candidate.name,
        lat: candidate.lat ?? chatDraft.lat ?? 0,
        lng: candidate.lng ?? chatDraft.lng ?? 0,
        persona: currentPersona,
        firstUserText: typeof userText === 'string' ? userText : userText?.text ?? '',
      });
      if (created?.id) effectiveChatId = created.id;
    }

    const finalMessages = [
      ...baseMessages,
      {
        role: 'model',
        text: modelText,
        confirmedDestination: confirmed,
        showQuickReplies: true,
      },
    ];

    setMessages(finalMessages);
    if (effectiveChatId) onUpdateChat(effectiveChatId, finalMessages);
  }, [
    isLoading,
    activeChatId,
    chatDraft,
    messages,
    currentPersona,
    applyDestinationBinding,
    onUpdateChat,
    onCreateTripOnFirstUserMessage,
  ]);

  const handleSend = useCallback(async (text, personaOverride = null, sendOptions = null) => {
    if (!text?.trim() || isLoading) return;

    const rawText = typeof text === 'object' ? (text.text || '질문 내용 확인 불가') : text;
    const sessionBoundEarly = activeSessionPlace?.name
      ? {
          slug: boundDestinationSlug,
          name: activeSessionPlace.name,
        }
      : null;
    const accessDockActive =
      Boolean(sessionBoundEarly?.slug) && topicDockParent === 'access';
    const cleanText = normalizeAccessDepartureUserText(rawText, { accessDockActive });
    const personaToUse =
      personaOverride ||
      (shouldUsePlannerPersona(cleanText, messages) ? PERSONA_TYPES.PLANNER : currentPersona);

    if (personaToUse !== currentPersona) {
      setCurrentPersona(personaToUse);
    }

    if (!activeChatId && !chatDraft) {
      return;
    }

    const currentDest =
      (activeChatId && chatHistory.find((t) => String(t.id) === String(activeChatId))?.destination) ||
      chatDraft?.destination ||
      '';

    // Name-bound for prompts (uiPlace OK). Catalog slug only for planner/access docks.
    const sessionBound = activeSessionPlace?.name
      ? {
          slug: boundDestinationSlug,
          name: activeSessionPlace.name,
          lat: activeSessionPlace.lat ?? null,
          lng: activeSessionPlace.lng ?? null,
        }
      : null;
    const accessRoute = isAccessRouteQuery(cleanText);
    const ferryRoute = isFerryRouteQuery(cleanText);
    const departureLabel = accessRoute ? resolveDepartureLabelFromChat(cleanText, messages) : null;

    let resolution = resolveDestinationFromChat(cleanText, messages, currentDest);

    const placeBound = sessionBound;
    const effectiveBound = sessionBound;

    let sessionDest = currentDest;
    if (placeBound?.name) {
      sessionDest = placeBound.name;
    } else if (resolution?.confidence === 'high' && resolution.name) {
      sessionDest = resolution.name;
    } else if (effectiveBound?.name) {
      sessionDest = effectiveBound.name;
    }

    const chipDestination =
      (accessRoute || ferryRoute) && effectiveBound
        ? { slug: effectiveBound.slug, name: effectiveBound.name }
        : placeBound
          ? { slug: placeBound.slug, name: placeBound.name }
          : resolution?.confidence === 'high' && resolution.slug
            ? { slug: resolution.slug, name: resolution.name }
            : null;

    const shouldApplyBinding =
      resolution?.confidence === 'high' &&
      resolution.name &&
      !(accessRoute && effectiveBound && resolution.slug !== effectiveBound.slug) &&
      !(ferryRoute && effectiveBound && resolution.slug !== effectiveBound.slug) &&
      !placeBound;

    const userMsg = {
      role: 'user',
      text: cleanText,
      ...(chipDestination ? { confirmedDestination: chipDestination } : {}),
      ...(departureLabel && chipDestination ? { departureLabel } : {}),
      ...(resolution?.confidence === 'low' && resolution.candidates?.length
        ? { destinationCandidates: resolution.candidates, destinationPrompt: true }
        : {}),
    };

    const needsDestinationPick =
      resolution?.confidence === 'low' &&
      resolution.candidates?.length > 0 &&
      !effectiveBound;

    if (needsDestinationPick) {
      const newMessages = [...messages, userMsg];
      setMessages(newMessages);
      setInput('');
      if (activeChatId) onUpdateChat(activeChatId, newMessages);
      return;
    }

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    let effectiveChatId = activeChatId;
    if (!effectiveChatId) {
      const created = await onCreateTripOnFirstUserMessage({
        destination: sessionDest,
        lat:
          resolution?.confidence === 'high'
            ? (resolution.lat ?? chatDraft.lat)
            : chatDraft.lat,
        lng:
          resolution?.confidence === 'high'
            ? (resolution.lng ?? chatDraft.lng)
            : chatDraft.lng,
        persona: personaToUse,
        firstUserText: cleanText
      });
      if (!created?.id) {
        setIsLoading(false);
        setMessages((prev) => (prev.length > 0 ? prev.slice(0, -1) : []));
        return;
      }
      effectiveChatId = created.id;
    } else if (shouldApplyBinding) {
      await applyDestinationBinding(effectiveChatId, chatDraft, resolution);
    }

    onUpdateChat(effectiveChatId, newMessages);

    try {
      const destForPrompt =
        placeBound?.name ||
        (sessionDest === 'MOONi'
          ? (sessionBound?.name || resolution?.name || sessionDest)
          : sessionDest);
      const priorTurns = messages.map((m) => ({ role: m.role, text: m.text }));

      const slug =
        placeBound?.slug ||
        ((accessRoute || ferryRoute) && effectiveBound?.slug) ||
        resolution?.slug ||
        sessionBound?.slug ||
        resolveSlugFromDestination(destForPrompt === 'MOONi' ? null : destForPrompt);
      const destName =
        placeBound?.name ||
        (destForPrompt === 'MOONi'
          ? (resolution?.name ?? effectiveBound?.name ?? '')
          : destForPrompt);
      const essentialGuide = await ensureChatEssentialGuide(slug, destName);

      const chipId = sendOptions?.chipId ?? sendOptions?.chip?.id ?? null;

      const chatCtaHint = getChatCtaPromptHint({
        userText: cleanText,
        slug,
        destinationName: destName,
        chatHistory: priorTurns,
        essentialGuide,
      });

      const chipPromptHint = getMooniChipPromptHint({
        chipId,
        userText: cleanText,
        slug,
        destinationName: destName,
        chatHistory: priorTurns,
        essentialGuide,
      });

      const systemInstruction = getSystemPrompt(personaToUse, destForPrompt, {
        isMooni: Boolean(placeBound) || destForPrompt === 'MOONi',
        boundPlaceName: placeBound?.name ?? null,
        chipPromptHint,
        chatCtaHint,
      });
      const chatModelId = resolveMooniChatModel({
        userText: cleanText,
        chatHistory: priorTurns,
        persona: personaToUse,
      });

      const aiReply = await apiClient.fetchProxyGemini(
        null,
        priorTurns,
        systemInstruction,
        cleanText,
        [],
        chatModelId
      );

      const booking = resolveChatBookingActions({
        userText: cleanText,
        destinationName: destName,
        slug,
        chatHistory: priorTurns,
        chatSource: mooniPlaceContext ? 'place' : 'home',
        aiReplyText: aiReply,
        essentialGuide,
      });

      const hasTransportCta = (booking.actions ?? []).some((a) =>
        ['trip_com', 'twelve_go', 'direct', 'direct_ferries', 'klook_ferry'].includes(
          a.provider
        )
      );
      const { text: displayReply, hadBracketLinks } = sanitizeMooniModelReply(aiReply, {
        stripPhantomTicketMention: !hasTransportCta,
      });
      const plannerFocus = resolvePlannerFocusFromUserText(cleanText, {
        essentialGuide,
        chipId,
      });
      const plannerUrl =
        buildPlacePlannerPathWithFocus(slug, plannerFocus) ??
        booking.plannerUrl ??
        buildPlacePlannerPath(slug);
      const plannerFollowUp =
        Boolean(slug) &&
        shouldShowMooniPlannerFollowUp({
          slug,
          hadBracketLinks,
          bookingShow: booking.show,
          userText: cleanText,
          aiReplyText: aiReply,
        });

      const finalMessages = [
        ...newMessages,
        {
          role: 'model',
          text: displayReply,
          bookingActions: booking.show ? booking.actions : null,
          plannerFollowUp,
          bookingMeta:
            booking.show || plannerFollowUp
              ? { slug: booking.slug ?? slug, plannerUrl, plannerFocus, chipId: chipId ?? null }
              : null,
        },
      ];
      setMessages(finalMessages);

      onUpdateChat(effectiveChatId, finalMessages);
    } catch (error) {
      const text = getGeminiProxyErrorMessage(error);
      setMessages((prev) => [...prev, { role: 'error', text }]);
    } finally {
      setIsLoading(false);
    }
  }, [
    isLoading,
    currentPersona,
    messages,
    activeChatId,
    chatDraft,
    onUpdateChat,
    onCreateTripOnFirstUserMessage,
    chatHistory,
    applyDestinationBinding,
    activeSessionPlace,
    boundDestinationSlug,
    mooniPlaceContext,
    topicDockParent,
  ]);

  const handleAccessOriginSelect = useCallback(
    (iata) => {
      const code = String(iata ?? '').trim().toUpperCase();
      if (code.length !== 3) return;
      persistFlightOriginIata(code);
      setAccessOriginIata(code);
      setAccessOriginSearchOpen(false);
      setAccessOriginSearchActive(false);
      const option = getFlightCinemaOriginOption(code);
      const askText = buildAccessRouteAskText(code, option);
      handleSend(askText, PERSONA_TYPES.PLANNER, { chipId: MOONI_CHIP_IDS.ACCESS_ORIGIN });
    },
    [handleSend]
  );

  const handleAskWithAccessOrigin = useCallback(() => {
    const option = getFlightCinemaOriginOption(accessOriginIata);
    const askText = buildAccessRouteAskText(accessOriginIata, option);
    handleSend(askText, PERSONA_TYPES.PLANNER, { chipId: MOONI_CHIP_IDS.ACCESS_ORIGIN });
  }, [accessOriginIata, handleSend]);

  const topicDockChipsProps = useMemo(
    () => ({
      slug: effectiveQuickReplySlug,
      chips: quickReplies,
      onSelect: (text, persona, chip) =>
        handleSend(text, persona ?? null, chip ? { chipId: chip.id } : null),
      onDrillDown: (parentId) => setTopicDockParent(parentId),
      onBack: topicDockParent ? () => setTopicDockParent(null) : undefined,
      parentL1Label: topicDockParent
        ? getMooniL1ChipLabel(topicDockParent, { mobile: true })
        : null,
      onOpenPlanner: handlePlannerNavigate,
      disabled: isLoading,
      prompt: topicDockPrompt,
      showPrompt: showTopicDockPrompt,
      dock: true,
    }),
    [
      effectiveQuickReplySlug,
      quickReplies,
      handleSend,
      topicDockParent,
      handlePlannerNavigate,
      isLoading,
      topicDockPrompt,
      showTopicDockPrompt,
    ]
  );

  useEffect(() => {
    if (isOpen && initialQuery && !hasSentInitialRef.current) {
      hasSentInitialRef.current = true;

      let queryText = "";
      if (typeof initialQuery === 'string') {
        queryText = initialQuery;
      } else if (typeof initialQuery === 'object') {
        queryText = initialQuery?.text || initialQuery?.display || initialQuery?.query || "";
      }

      const queryPersona = initialQuery?.persona || PERSONA_TYPES.GENERAL;
      setCurrentPersona(queryPersona);

      if (queryText.trim().length > 0) {
        handleSend(queryText, queryPersona);
      }

    } else if (!isOpen) {
      hasSentInitialRef.current = false;
    }
  }, [isOpen, initialQuery, handleSend]);

  const handleSidebarClick = (id) => { if (onSwitchChat) onSwitchChat(id); };

  const lastUserIdx = messages.map(m => m.role).lastIndexOf('user');

  if (!isOpen) return null;

  return (
    <TripcomFlightSearchProvider>
    <div className={`fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center backdrop-blur-sm p-4 max-md:p-0 animate-fade-in ${overlaySuppressed ? 'invisible pointer-events-none' : ''}`}>
      <div className="bg-gray-900 w-[95vw] max-w-6xl h-[90vh] max-md:w-full max-md:h-[100dvh] max-md:max-h-[100dvh] rounded-3xl max-md:rounded-none border border-gray-700 max-md:border-0 shadow-2xl flex overflow-hidden relative transition-all">

        <div className="hidden md:flex w-72 bg-gray-900 border-r border-gray-700 flex-col">
          <div className="p-5 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare size={18} className="text-blue-400" />
              <span className="font-bold text-gray-200 text-sm">채팅 기록</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
            {chatHistory
              .filter((item) => !item.is_hidden && tripHasPersistedDialogue(item))
              .map((item) => (
              <div key={item.id} onClick={() => handleSidebarClick(item.id)} className={`p-3 rounded-xl border cursor-pointer transition-all ${activeChatId === item.id ? 'bg-gray-800 border-blue-500/50' : 'bg-gray-800/30 border-gray-700/50 hover:bg-gray-800'}`}>
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-gray-300 text-sm truncate max-w-[140px]">{item.destination}</span>
                  <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDeleteChat(item.id);
                        }}
                        className="text-gray-600 hover:text-red-400"
                        title="채팅방 삭제"
                      >
                        <Trash2 size={14} />
                      </button>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-[10px] text-gray-500">{item.date}</p>
                  {item.persona && <span className="text-[8px] px-1.5 py-0.5 rounded-md bg-gray-700 text-gray-400 uppercase">{item.persona}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-black/50 relative">
            <div
              className="bg-gray-800/50 p-4 md:py-2.5 md:px-4 max-md:px-3 max-md:py-2 max-md:pt-[max(0.4rem,env(safe-area-inset-top,0px))] flex items-center gap-3 max-md:gap-2 border-b border-gray-700 backdrop-blur-md"
              onPointerDown={() => {
                if (mobileDockInputFocused && !input.trim()) {
                  collapseMobileDockInput();
                }
              }}
            >
               <button
                 type="button"
                 onClick={handleClose}
                 aria-label="채팅 닫기"
                 title="닫기"
                 className="flex h-9 w-9 md:h-8 md:w-8 max-md:h-8 max-md:w-8 shrink-0 items-center justify-center rounded-full border border-gray-500/60 max-md:border-white/45 bg-gray-700/70 max-md:bg-gray-700 text-gray-200 max-md:text-white shadow-md transition-colors hover:border-gray-400 hover:bg-gray-600 hover:text-white touch-manipulation"
               >
                 <X size={16} className="pointer-events-none max-md:h-4 max-md:w-4" />
               </button>
               <div className="flex flex-col min-w-0 flex-1 justify-center">
                 <span className="font-bold text-white tracking-wide text-base md:text-[15px] max-md:text-[15px] max-md:leading-snug truncate">
                   {isMooniUi ? mooniHeaderLabel : (introDestinationRaw || 'MOONi')}
                 </span>
                 <span className="hidden md:block text-[11px] text-cyan-300/80 font-medium leading-tight truncate">
                   {isMooniUi
                     ? boundDestinationSlug
                       ? `${activeSessionPlace?.name ?? introDestinationRaw} 여행 대화 · ${currentPersona}`
                       : `여행 AI 도우미 · ${currentPersona}`
                     : `${introDestinationRaw || '여행'} 대화 · ${currentPersona}`}
                 </span>
                 <span className="md:hidden text-[10px] text-gray-400 font-medium leading-none mt-0.5 truncate">
                   {isMooniUi ? 'MOONi 여행 대화' : '여행 대화'}
                 </span>
               </div>
               <div className="flex items-center gap-2 shrink-0">
                 {effectiveQuickReplySlug ? (
                   <button
                     type="button"
                     onClick={() => handlePlannerNavigate(`/place/${effectiveQuickReplySlug}/planner`)}
                     className="inline-flex items-center gap-1 rounded-full border border-cyan-300/80 bg-cyan-500/30 px-2.5 py-1.5 max-md:min-h-[32px] text-[11px] font-semibold text-cyan-50 shadow-[0_0_12px_rgba(34,211,238,0.25)] ring-1 ring-cyan-400/35 hover:border-cyan-300 hover:bg-cyan-500/40 transition-colors touch-manipulation"
                     title="여행 플래너 열기"
                   >
                     📋 플래너 보기
                   </button>
                 ) : null}
               </div>
            </div>

            <div
              className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 md:space-y-8 custom-scrollbar"
              onPointerDown={() => {
                if (mobileDockInputFocused && !input.trim()) {
                  collapseMobileDockInput();
                }
              }}
            >
              {!isMooniUi && (placeIntro || placeIntroLoading || placeIntroError) && (
                <div className="rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-950/40 to-gray-900/60 p-4 shadow-lg">
                  <div className="flex items-center gap-2 mb-2 text-emerald-300/90">
                    <Sparkles size={16} className="shrink-0" />
                    <span className="text-xs font-bold uppercase tracking-wide">이 장소 한눈에 보기</span>
                  </div>
                  {placeIntroLoading && !placeIntro && (
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <Loader2 className="animate-spin shrink-0" size={18} />
                      <span>여행지 요약을 준비하고 있어요...</span>
                    </div>
                  )}
                  {placeIntroError && (
                    <p className="text-sm text-red-400">{placeIntroError}</p>
                  )}
                  {placeIntro && (
                    <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{placeIntro}</p>
                  )}
                </div>
              )}
              {isMooniUi && messages.length === 0 && !isLoading && placeIntroTarget && (
                <div className="flex flex-col items-start w-full">
                  <span className="text-[10px] font-bold mb-1 px-1 text-cyan-400 uppercase tracking-wider">MOONi</span>
                  <div className="w-full p-4 rounded-2xl text-base shadow-md bg-gray-800 text-gray-200 rounded-tl-sm leading-relaxed">
                    {placeIntroLoading && !placeIntro && (
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <Loader2 className="animate-spin shrink-0" size={18} />
                        <span>여행지 소개를 준비하고 있어요...</span>
                      </div>
                    )}
                    {placeIntroError && (
                      <p className="text-sm text-red-400 mb-2">{placeIntroError}</p>
                    )}
                    {(!placeIntroLoading || placeIntro) && (
                      <p className="whitespace-pre-wrap">
                        {buildMooniIntroWithHint(
                          placeIntro,
                          placeIntroTarget
                        )}
                      </p>
                    )}
                  </div>
                </div>
              )}
              {isMooniUi && messages.length === 0 && !isLoading && !placeIntroTarget && (
                <div className="flex flex-col items-start w-full">
                  <span className="text-[10px] font-bold mb-1 px-1 text-cyan-400 uppercase tracking-wider">MOONi</span>
                  <div className="w-full p-4 rounded-2xl text-base shadow-md bg-gray-800 text-gray-200 rounded-tl-sm leading-relaxed">
                    {buildMooniIntroWithHint('', null)}
                  </div>
                </div>
              )}
              {messages.map((msg, idx) => {
                const rawMsgText =
                  typeof msg.text === 'object' ? msg.text?.text ?? '내용 없음' : msg.text ?? '';
                const isModelMsg = msg.role === 'model';
                const { text: displayMsgText, hadBracketLinks } = isModelMsg
                  ? sanitizeMooniModelReply(rawMsgText)
                  : { text: rawMsgText, hadBracketLinks: false };
                const msgSlug = msg.bookingMeta?.slug ?? boundDestinationSlug;
                const msgDestinationName = isMooniUi
                  ? activeSessionPlace?.name ??
                    messages
                      .slice(0, idx)
                      .reverse()
                      .find((m) => m.confirmedDestination?.name)?.confirmedDestination?.name ??
                    (introDestinationRaw !== 'MOONi' ? introDestinationRaw : '')
                  : introDestinationRaw;
                const priorUserText =
                  messages[idx - 1]?.role === 'user'
                    ? (typeof messages[idx - 1].text === 'object'
                        ? messages[idx - 1].text?.text
                        : messages[idx - 1].text) ?? ''
                    : '';
                const showPlannerFollowUp =
                  isModelMsg &&
                  Boolean(msgSlug) &&
                  (msg.plannerFollowUp ??
                    shouldShowMooniPlannerFollowUp({
                      slug: msgSlug,
                      hadBracketLinks,
                      bookingShow: Boolean(msg.bookingActions?.length),
                      userText: priorUserText,
                      aiReplyText: rawMsgText,
                    }));

                return (
                <div
                  key={idx}
                  ref={idx === lastUserIdx ? lastQuestionRef : null}
                  className={`flex flex-col w-full ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <span className={`text-[10px] font-bold mb-1 px-1 uppercase tracking-wider ${
                    msg.role === 'user' ? 'text-blue-400' : msg.role === 'error' ? 'text-red-400' : 'text-cyan-400'
                  }`}>
                    {msg.role === 'user' ? 'Me' : 'MOONi'}
                  </span>
                  <div className={`p-4 rounded-2xl text-base shadow-md w-full ${
                    msg.role === 'user'
                      ? 'max-w-full md:max-w-[80%] bg-blue-600 text-white rounded-tr-sm'
                      : msg.role === 'error'
                        ? 'bg-red-950/50 text-red-200 rounded-tl-sm'
                        : 'bg-gray-800 text-gray-200 rounded-tl-sm leading-relaxed'
                  }`}>
                    <div style={{ whiteSpace: 'pre-wrap' }}>{displayMsgText}</div>
                    {(msg.confirmedDestination || (msg.destinationCandidates?.length > 0 && msg.destinationPrompt)) && (
                      <DestinationResolutionChips
                        confirmed={msg.confirmedDestination}
                        departure={msg.departureLabel}
                        candidates={msg.destinationCandidates}
                        onSelectCandidate={(c) => handleSelectDestinationCandidate(c, idx)}
                      />
                    )}
                    {msg.role === 'model' && msg.bookingActions?.length > 0 && (
                      <BookingActionCards
                        actions={refreshStoredBookingActionLabels(msg.bookingActions, {
                          slug: msg.bookingMeta?.slug ?? boundDestinationSlug,
                          destinationName: isMooniUi
                            ? (activeSessionPlace?.name
                              ?? messages.slice(0, idx).reverse().find((m) => m.confirmedDestination?.name)?.confirmedDestination?.name
                              ?? (introDestinationRaw !== 'MOONi' ? introDestinationRaw : ''))
                            : introDestinationRaw,
                          chatHistory: messages
                            .slice(0, idx)
                            .filter((m) => m.role === 'user')
                            .map((m) => ({ text: m.text, departureLabel: m.departureLabel })),
                          userText:
                            messages[idx - 1]?.role === 'user'
                              ? (typeof messages[idx - 1].text === 'object'
                                  ? messages[idx - 1].text?.text
                                  : messages[idx - 1].text) ?? ''
                              : '',
                          essentialGuide:
                            (msg.bookingMeta?.slug ?? boundDestinationSlug) === effectiveQuickReplySlug
                              ? topicEssentialGuide
                              : null,
                        })}
                        slug={msg.bookingMeta?.slug}
                        destinationName={msgDestinationName}
                        essentialGuide={
                          (msg.bookingMeta?.slug ?? boundDestinationSlug) === effectiveQuickReplySlug
                            ? topicEssentialGuide
                            : null
                        }
                        plannerUrl={msg.bookingMeta?.plannerUrl}
                        plannerFocus={msg.bookingMeta?.plannerFocus}
                        chipId={msg.bookingMeta?.chipId}
                        userText={priorUserText}
                        onPlannerNavigate={handlePlannerNavigate}
                      />
                    )}
                    {showPlannerFollowUp && (
                      <MooniPlannerFollowUp
                        destinationName={msgDestinationName}
                        plannerUrl={msg.bookingMeta?.plannerUrl}
                        plannerFocus={msg.bookingMeta?.plannerFocus}
                        chipId={msg.bookingMeta?.chipId}
                        userText={priorUserText}
                        essentialGuide={
                          (msg.bookingMeta?.slug ?? boundDestinationSlug) === effectiveQuickReplySlug
                            ? topicEssentialGuide
                            : null
                        }
                        onPlannerNavigate={handlePlannerNavigate}
                      />
                    )}
                  </div>
                </div>
                );
              })}
              {isLoading && (
                <div className="flex gap-4 items-center">
                  <Loader2 size={20} className="text-blue-400 animate-spin" />
                  <span className="text-sm text-blue-300 animate-pulse font-medium">{loadingStatus}</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="shrink-0 bg-gray-900 border-t border-gray-800 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]">
              {showAccessOriginDock ? (
                <div className="px-3 md:px-4 pt-3 md:pt-2 pb-2 md:pb-1.5 space-y-2 md:space-y-1.5 border-b border-gray-800/80">
                  <div className="flex items-center gap-2 min-w-0 flex-wrap">
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => setTopicDockParent(null)}
                      className="inline-flex shrink-0 items-center gap-0.5 min-h-[32px] rounded-full border border-gray-500/55 bg-gray-800/90 px-2.5 py-1 text-[11px] font-semibold text-gray-100 touch-manipulation hover:border-gray-400 hover:bg-gray-700/90 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                    >
                      <ChevronLeft size={14} className="shrink-0 -ml-0.5" aria-hidden />
                      다른 주제
                    </button>
                    <span className="text-[11px] text-cyan-400/75 font-medium break-keep min-w-0">
                      {getMooniL1ChipLabel('access', { mobile: true })}
                    </span>
                  </div>

                  {accessOriginSearchOpen ? (
                    <FlightOriginSelector
                      variant="chat"
                      selectedIata={accessOriginIata}
                      disabled={isLoading}
                      onSelect={handleAccessOriginSelect}
                      onCollapseRequest={() => {
                        setAccessOriginSearchOpen(false);
                        setAccessOriginSearchActive(false);
                      }}
                      onSearchActiveChange={setAccessOriginSearchActive}
                    />
                  ) : (
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="min-w-0 flex-1">
                        <FlightOriginSelector
                          variant="chat-header"
                          selectedIata={accessOriginIata}
                          disabled={isLoading}
                          onExpandRequest={() => setAccessOriginSearchOpen(true)}
                        />
                      </div>
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={handleAskWithAccessOrigin}
                        className="shrink-0 inline-flex items-center justify-center rounded-full border border-cyan-400/60 bg-cyan-500/25 px-3 py-2 text-[12px] font-semibold text-cyan-50 touch-manipulation hover:bg-cyan-500/35 disabled:opacity-50"
                      >
                        물어보기
                      </button>
                    </div>
                  )}

                  {!accessOriginSearchOpen && !accessOriginSearchActive && quickReplies.length > 0 ? (
                    <MooniQuickReplyChips
                      {...topicDockChipsProps}
                      onBack={undefined}
                      parentL1Label={null}
                      showPrompt={false}
                    />
                  ) : null}
                </div>
              ) : showBoundTopicDock ? (
                <>
                  <div className="md:hidden px-3 pt-2 pb-1 flex flex-col gap-1.5">
                    {!mobileDockInputExpanded ? (
                      <div className="min-w-0 w-full">
                        <MooniQuickReplyChips {...topicDockChipsProps} />
                      </div>
                    ) : null}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSend(input);
                      }}
                      className="relative w-full min-w-0"
                    >
                      <input
                        ref={mobileDockInputRef}
                        type="text"
                        inputMode="text"
                        enterKeyHint="send"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onFocus={() => {
                          if (mobileDockBlurTimerRef.current) {
                            clearTimeout(mobileDockBlurTimerRef.current);
                            mobileDockBlurTimerRef.current = null;
                          }
                          setMobileDockInputFocused(true);
                        }}
                        onBlur={() => {
                          mobileDockBlurTimerRef.current = setTimeout(() => {
                            setMobileDockInputFocused(false);
                            mobileDockBlurTimerRef.current = null;
                          }, 120);
                        }}
                        placeholder={
                          mobileDockInputExpanded
                            ? chatInputPlaceholder
                            : '직접 입력…'
                        }
                        title={chatInputPlaceholder}
                        className={
                          mobileDockInputExpanded
                            ? 'w-full bg-gray-800 text-white text-[16px] leading-normal pl-3.5 pr-10 py-2.5 rounded-full border border-gray-600 focus:outline-none focus:border-blue-500 placeholder:text-gray-500 transition-[padding] duration-150'
                            : 'w-full h-8 bg-gray-800/80 text-white text-[16px] leading-none pl-3 pr-8 py-0 rounded-full border border-gray-700 focus:outline-none focus:border-blue-500 placeholder:text-gray-500 placeholder:text-[12px] transition-[padding] duration-150'
                        }
                        disabled={isLoading}
                        aria-expanded={mobileDockInputExpanded}
                      />
                      <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        onMouseDown={(e) => e.preventDefault()}
                        className={
                          mobileDockInputExpanded
                            ? 'absolute right-1 top-1/2 -translate-y-1/2 p-1.5 bg-blue-600 rounded-full text-white disabled:opacity-40 touch-manipulation'
                            : 'absolute right-0.5 top-1/2 -translate-y-1/2 p-1 bg-blue-600/80 rounded-full text-white disabled:opacity-40 touch-manipulation'
                        }
                        aria-label="전송"
                      >
                        <Send size={mobileDockInputExpanded ? 17 : 13} />
                      </button>
                    </form>
                  </div>
                  <div className="hidden md:flex items-end gap-3 px-4 pt-2 pb-2">
                    <div className="min-w-0 flex-1">
                      <MooniQuickReplyChips {...topicDockChipsProps} />
                    </div>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSend(input);
                      }}
                      className="relative w-[min(18rem,40%)] shrink-0 mb-0.5"
                    >
                      <input
                        ref={chatInputRef}
                        type="text"
                        inputMode="text"
                        enterKeyHint="send"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="직접 입력…"
                        title={chatInputPlaceholder}
                        className="w-full min-h-[36px] bg-gray-700/95 text-white text-sm font-medium pl-3.5 pr-11 py-2 rounded-full border border-cyan-400/45 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_0_1px_rgba(34,211,238,0.08)] focus:outline-none focus:border-cyan-300/80 focus:ring-1 focus:ring-cyan-400/35 placeholder:text-gray-300/90"
                        disabled={isLoading}
                      />
                      <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 bg-cyan-500/90 hover:bg-cyan-400 rounded-full text-white disabled:opacity-40 disabled:bg-blue-600/70"
                        aria-label="전송"
                      >
                        <Send size={16} />
                      </button>
                    </form>
                  </div>
                </>
              ) : null}
              <div
                className={`px-3 pt-3 md:px-4 md:pt-2.5 md:pb-3 ${
                  showAccessOriginDock || showBoundTopicDock
                    ? 'hidden'
                    : 'pb-0'
                }`}
              >
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend(input);
                  }}
                  className="relative"
                >
                  <input
                    ref={!showBoundTopicDock ? chatInputRef : undefined}
                    type="text"
                    inputMode="text"
                    enterKeyHint="send"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={chatInputPlaceholder}
                    className="w-full bg-gray-800 md:bg-gray-700/95 text-white text-[16px] md:text-base md:font-medium pl-5 pr-14 py-3.5 md:py-2.5 rounded-full border border-gray-600 md:border-cyan-400/45 md:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_0_1px_rgba(34,211,238,0.08)] focus:outline-none focus:border-blue-500 md:focus:border-cyan-300/80 md:focus:ring-1 md:focus:ring-cyan-400/35 placeholder:text-gray-500 md:placeholder:text-gray-300/90"
                    disabled={isLoading}
                    autoFocus={!effectiveQuickReplySlug}
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 md:p-1.5 bg-blue-600 rounded-full text-white"
                  >
                    <Send size={18} />
                  </button>
                </form>
              </div>
            </div>
        </div>
      </div>
    </div>
    </TripcomFlightSearchProvider>
  );
};

export default ChatModal;
