/**
 * English banner notes for travel-spot airport overrides that have Korean
 * `bannerNote` but no inline `bannerNoteEn`. Keys include alias / place-id
 * spellings that share the same Korean note.
 *
 * @type {Record<string, string>}
 */
export const BANNER_NOTE_EN_BY_SLUG = {
  hvar:
    "Hvar is usually reached by ferry after landing at Split (SPU). For the return, Dubrovnik (DBV) or Zagreb (ZAG) outs are common depending on your itinerary. If the final arrival code on your ticket differs, switch search and affiliate links to that actual code.",
  kotor:
    "Kotor is typically reached via Tivat (TIV, about 15 minutes by car) or Podgorica (TGD, Montenegro’s main international airport). Balkan loop travelers also often enter via Dubrovnik (DBV, Croatia) then continue by bus. Confirm the final arrival code on your ticket, then match affiliate links to that airport.",
  lofoten:
    "Routes into Lofoten differ by airport. Leknes (LKN) and Svolvær (SVJ) sit on the archipelago, so arriving there on a domestic leg works well before continuing by rental car. Evenes (EVE) is a mainland gateway (Harstad–Narvik) with more international and larger domestic options; many itineraries continue to Lofoten by car or bus. Bodø (BOO) is often used when connecting from the mainland south of Lofoten by ferry (e.g. Bodø–Moskenes) or domestic flights. From Incheon, travelers usually connect via Oslo (OSL) or other European hubs, then take a domestic flight to one of the airports above. Confirm the arrival airport (IATA) on your ticket and itinerary, then adjust the affiliate search terms below to match that airport.",
  "costa-rica":
    "For Costa Rica, pick Juan Santamaría (SJO) in San José or Liberia (LIR) for easier northwest resort access, based on your itinerary. Connections via the US, Canada, or Mexico are typical; there is no direct flight. Confirm the final arrival code on your ticket, then match affiliate links to that airport.",
  코스타리카:
    "For Costa Rica, pick Juan Santamaría (SJO) in San José or Liberia (LIR) for easier northwest resort access, based on your itinerary. Connections via the US, Canada, or Mexico are typical; there is no direct flight. Confirm the final arrival code on your ticket, then match affiliate links to that airport.",
  "annapurna-circuit":
    "For the Annapurna Circuit, most travelers fly ICN→Kathmandu Tribhuvan International (KTM), prepare in the city, then enter the circuit overland via Besisahar. Some itineraries go via Pokhara (PKR) or a domestic flight. Use KTM as the arrival code for flight and Trip searches.",
  bled:
    "Bled is usually reached by shuttle or bus (about 30–45 minutes) after landing at Ljubljana (LJU). Itineraries that enter via Zagreb (ZAG) or Venice (VCE) then continue overland are also common to save on airfare. Confirm the final arrival code on your ticket, then match affiliate links to that airport.",
  crete:
    "Crete arrivals split between Heraklion (HER), Chania (CHQ), and similar airports. Open-jaw itineraries with different arrival and departure airports are common. Confirm the final arrival code on your ticket, then match affiliate links to that airport.",
  "santiago-de-compostela":
    "Santiago de Compostela is usually based on a direct arrival or entry at SCQ. Many travelers also fly into Madrid (MAD) then continue by train or domestic flight — confirm the final arrival code on your ticket, then match affiliate links to that airport.",
  miyakojima:
    "Direct flights from Incheon (Jin Air and others) usually arrive at Shimojishima (SHI); via Okinawa (Naha) the arrival is Miyako (MMY). Shimojishima is bridge-linked to the main island, so rental cars and transfers are convenient. Confirm the final arrival code on your ticket, then match affiliate search terms to that airport.",
  미야코지마:
    "Direct flights from Incheon (Jin Air and others) usually arrive at Shimojishima (SHI); via Okinawa (Naha) the arrival is Miyako (MMY). Shimojishima is bridge-linked to the main island, so rental cars and transfers are convenient. Confirm the final arrival code on your ticket, then match affiliate search terms to that airport.",
  okinawa:
    "Okinawa’s main island usually arrives at Naha (OKA). Miyakojima (SHI/MMY) and Ishigaki (ISG) are separate islands and destinations — confirm the final arrival code on your ticket.",
  오키나와:
    "Okinawa’s main island usually arrives at Naha (OKA). Miyakojima (SHI/MMY) and Ishigaki (ISG) are separate islands and destinations — confirm the final arrival code on your ticket.",
  borobudur:
    "For the Borobudur–Magelang area, the usual path is ICN→Jakarta (CGK) or Bali (DPS), then a domestic flight to Yogyakarta (YIA). If the final arrival code on your ticket differs, switch search and affiliate links to that actual code.",
  rarotonga:
    "Rarotonga (Cook Islands) is usually reached ICN→Auckland (AKL) then Rarotonga (RAR). The International Date Line can pull your arrival date forward by a day — double-check ticket and lodging dates.",
  aitutaki:
    "Aitutaki is usually reached ICN→Auckland (AKL), then Rarotonga (RAR) internationally, then Air Rarotonga domestic to Aitutaki (AIT). Car rental, pickup, and tours are based on Aitutaki Airport (AIT). The International Date Line can pull your arrival date forward by a day — double-check ticket and lodging dates.",
  아이투타키:
    "Aitutaki is usually reached ICN→Auckland (AKL), then Rarotonga (RAR) internationally, then Air Rarotonga domestic to Aitutaki (AIT). Car rental, pickup, and tours are based on Aitutaki Airport (AIT). The International Date Line can pull your arrival date forward by a day — double-check ticket and lodging dates.",
  tukao:
    "Manihiki (Tukao) is usually reached ICN→Tokyo (NRT) or Tahiti (PPT), then Rarotonga (RAR) internationally, then Air Rarotonga domestic to Manihiki (MHX). Car rental and pickup are based on MHX. The International Date Line can pull your arrival date forward by a day — double-check ticket and lodging dates.",
  Manihiki:
    "Manihiki (Tukao) is usually reached ICN→Tokyo (NRT) or Tahiti (PPT), then Rarotonga (RAR) internationally, then Air Rarotonga domestic to Manihiki (MHX). Car rental and pickup are based on MHX. The International Date Line can pull your arrival date forward by a day — double-check ticket and lodging dates.",
  samoa:
    "Samoa (Apia) has no direct flight from Incheon. Typical routings are ICN→Auckland (AKL) or Fiji Nadi (NAN), then APW. Confirm the final arrival code on your ticket.",
  "bora-bora":
    "Bora Bora has no direct flight from Incheon. Typical routing is ICN→Tokyo (NRT) to Tahiti (PPT), then Air Tahiti domestic to BOB. Confirm the final arrival code on your ticket.",
  boracay:
    "Boracay is often reached via Kalibo (KLO) international then bus/ferry, or via Caticlan (MPH) direct/domestic. Confirm the final arrival code on your ticket, then match the affiliate search terms below to that airport.",
  "el-nido":
    "Flight & route comparison\n· Route 1 (recommended · higher cost): ICN→Manila (MNL)→El Nido (ENI). AirSWIFT monopoly; MNL Terminal 4 (T4) transfer with no through-checked bags → allow 3–4+ hours for the connection.\n· Route 2 (value · overland): ICN→Puerto Princesa (PPS)→van/bus→El Nido (5+ hours). Physically demanding.\nMatch affiliate search terms to the final arrival code on your ticket.",
  palau:
    "Palau has no direct flight from Incheon. Typical routings are ICN→Taipei (TPE) or Manila (MNL), then Koror (ROR). Confirm the final arrival code on your ticket.",
  palawan:
    "Palawan and El Nido split between ENI direct (via MNL · AirSWIFT), the PPS overland route, and MNL as an international gateway. See the El Nido destination banner for detailed El Nido routings.",
  "abu-simbel":
    "Abu Simbel is typically ICN→Middle East (DXB, DOH, etc.) → Cairo (CAI) international → Cairo→Aswan (ASW) domestic (~1.5 hours) → then Aswan to Abu Simbel (ABS) by light aircraft (~45 minutes) or tour vehicle overland (~3.5 hours). Trip.com and other flight/affiliate searches should use Aswan (ASW) — if your itinerary includes Cairo and the domestic leg, set the final arrival code to ASW. ABS direct and local tours are booked separately. Car rental, pickup, and tours are based on Aswan (ASW).",
  "christmas-island":
    "Direct flights to Australian Christmas Island arrive at Christmas Island (XCH). Schedules usually connect from mainland Australia such as Perth (PER). Confirm the final arrival code on your ticket.",
  bagan:
    "International arrivals often go via Yangon (RGN) or Mandalay (MDL), then a domestic flight to Bagan landing at NYU (Nyaung U). Car rental, pickup, and flight affiliates are based on final arrival NYU.",
  tikal:
    "Tikal is usually entered after Guatemala City (GUA) international, then Flores (FRS) by domestic flight or road. Car rental and pickup are based on final arrival FRS; Trip flight search uses the international gateway GUA.",
  "torres-del-paine":
    "Torres del Paine is a national park in southern Chilean Patagonia. Most travelers fly direct or connect into Punta Arenas (PUQ), then continue by bus or tour. Gateways differ from northern Argentine Patagonia and Ushuaia.",
  "peninsula-valdes":
    "For Península Valdés: ICN→US/Europe (~14–18 hours) → Buenos Aires international (EZE) → ~1.5 hours airport transfer → domestic departure from AEP to Trelew (REL) or Puerto Madryn (PMY) (~2 hours) — then pick up a rental car and enter the peninsula. Trip.com and other flight/affiliate links should use final arrival PMY or REL — if your itinerary includes international and EZE, confirm the final arrival code on your ticket.",
  socotra:
    "Socotra is reached after ICN→Abu Dhabi (AUH) international, then a government-authorized charter (mainly Air Arabia, about 1–2 times per week) from Abu Dhabi to Socotra (SCT). Skyscanner, Trip.com, and similar flight searches go as far as AUH; the SCT segment is ticketed only through local tour agencies. Car rental, pickup, and island plans are based on SCT arrival. Confirm the final arrival code on your ticket, then match affiliate links.",
  "소코트라 섬":
    "Socotra is reached after ICN→Abu Dhabi (AUH) international, then a government-authorized charter (mainly Air Arabia, about 1–2 times per week) from Abu Dhabi to Socotra (SCT). Skyscanner, Trip.com, and similar flight searches go as far as AUH; the SCT segment is ticketed only through local tour agencies. Car rental, pickup, and island plans are based on SCT arrival. Confirm the final arrival code on your ticket, then match affiliate links.",
  "marshall-islands":
    "The Marshall Islands (Majuro) are usually reached ICN→Guam (GUM) direct, then United Airlines to MAJ (Island Hopper via Honolulu HNL is also possible). Trip.com and similar flight searches go as far as GUM — the MAJ segment requires a United official booking. Car rental, pickup, and island plans are based on MAJ arrival. Confirm the final arrival code on your ticket, then match affiliate links.",
  "마셜 제도":
    "The Marshall Islands (Majuro) are usually reached ICN→Guam (GUM) direct, then United Airlines to MAJ (Island Hopper via Honolulu HNL is also possible). Trip.com and similar flight searches go as far as GUM — the MAJ segment requires a United official booking. Car rental, pickup, and island plans are based on MAJ arrival. Confirm the final arrival code on your ticket, then match affiliate links.",
  "diego-garcia":
    "Diego Garcia is a British military base and closed to general tourism. Links below are for Indian Ocean region connections (e.g. Maldives) and itinerary reference only — they are not the actual destination.",
  "carstensz-pyramid":
    "Carstensz expeditions usually enter via Jakarta (CGK) or Bali (DPS) international, then a domestic flight to Timika (TIM). Sentani (DJJ) is the Jayapura gateway and is uncommon for this route. Confirm the final arrival code on your ticket, then match affiliate links to that airport.",
  "cape-verde":
    "Cape Verde airports differ by island. Sal Island Amílcar Cabral (SID) is typical for beach and marine activities; Santiago Island Praia Nelson Mandela (RAI) for administrative and cultural stays. From Korea, itineraries often connect via Lisbon (LIS) or Casablanca (CMN), then a direct island flight. Confirm the final arrival code on your ticket, then match affiliate links to that airport.",
  보베르데:
    "Cape Verde airports differ by island. Sal Island Amílcar Cabral (SID) is typical for beach and marine activities; Santiago Island Praia Nelson Mandela (RAI) for administrative and cultural stays. From Korea, itineraries often connect via Lisbon (LIS) or Casablanca (CMN), then a direct island flight. Confirm the final arrival code on your ticket, then match affiliate links to that airport.",
  lalibela:
    "Lalibela is usually ICN→Addis Ababa (ADD) international, then a domestic flight to Lalibela (LLI). Car rental, pickup, and tours are based on Lalibela Airport (LLI). Confirm the final arrival code on your ticket, then match affiliate links to that airport.",
  galapagos:
    "Galápagos itineraries often fly direct to San Cristóbal (GPS) or connect via Guayaquil (GYE). Confirm the final arrival code on your ticket.",
  iceland:
    "Flight booking tips\n· Direct: none (usually 1 stop) · total 14–18 hours\n· Recommended: Lufthansa or Finnair via Munich (MUC) or Helsinki (HEL)\n· Alternatives: Icelandair (Reykjavík), KLM (Amsterdam), Qatar (Doha)\n· Summer peak (Jun–Aug) — book 3–4 months ahead",
  reykjavik:
    "Flight booking tips\n· Direct: none (usually 1 stop) · total 14–18 hours\n· Recommended: Lufthansa or Finnair via Munich (MUC) or Helsinki (HEL)\n· Alternatives: Icelandair (Reykjavík), KLM (Amsterdam), Qatar (Doha)\n· Summer peak (Jun–Aug) — book 3–4 months ahead",
  "el-calafate":
    "El Calafate is the gateway (FTE) for Perito Moreno Glacier and Los Glaciares National Park. Gateways differ from northern Patagonia (Bariloche BRC), Ushuaia (USH), and Torres del Paine (PUQ). Confirm the final arrival code on your ticket.",
  cusco:
    "International flights arrive in Lima (LIM), then continue on a domestic flight to Cusco (CUZ). Car rental, pickup, and tours are based on Cusco Airport.",
  "machu-picchu":
    "International flights arrive in Lima (LIM), then continue on a domestic flight to Cusco (CUZ). Car rental, pickup, and tours are based on Cusco Airport.",
  "inca-trail":
    "International flights arrive in Lima (LIM), then continue on a domestic flight to Cusco (CUZ). Car rental, pickup, and tours are based on Cusco Airport.",
  쿠스코:
    "International flights arrive in Lima (LIM), then continue on a domestic flight to Cusco (CUZ). Car rental, pickup, and tours are based on Cusco Airport.",
  마추픽추:
    "International flights arrive in Lima (LIM), then continue on a domestic flight to Cusco (CUZ). Car rental, pickup, and tours are based on Cusco Airport.",
  patagonia:
    "This destination is **northern Argentine Patagonia** (Bariloche, lakes, Andes). Typical routing is Buenos Aires (EZE) international, then Bariloche (BRC) domestic. For the south (Ushuaia USH · Torres del Paine PUQ), see those separate destinations. Confirm the final arrival code on your ticket.",
  seoul:
    "Seoul splits between Incheon (ICN) for international and Gimpo (GMP) for domestic and short-haul international. Confirm the final arrival code on your ticket, then match affiliate links to that airport.",
  shanghai:
    "Shanghai commonly uses ICN→Pudong (PVG) direct and Gimpo→Hongqiao (SHA) short-haul. Hongqiao is better for city access; Pudong has more flight options. Confirm the final arrival code on your ticket, then match affiliate links to that airport.",
  상하이:
    "Shanghai commonly uses ICN→Pudong (PVG) direct and Gimpo→Hongqiao (SHA) short-haul. Hongqiao is better for city access; Pudong has more flight options. Confirm the final arrival code on your ticket, then match affiliate links to that airport.",
  kilimanjaro:
    "Kilimanjaro expeditions commonly fly into Kilimanjaro (JRO) or connect overland via Nairobi (NBO). Confirm the final arrival code on your ticket.",
  brussels:
    "Flight booking tips\n· Direct: none (no regular ICN↔Brussels nonstop; 1 stop required) · total 15–18 hours\n· Recommended: Lufthansa (Frankfurt/Munich), Air France (Paris), Qatar (Doha), KLM (Amsterdam)\n· Money-saver: fly into Paris (CDG) or Amsterdam (AMS) direct, then Eurostar/Thalys high-speed rail to Brussels Midi (~1 hour 30 minutes) — efficient on time and cost",
  oslo:
    "Flight booking tips\n· Direct: none (usually 1 stop) · total 14–18 hours\n· Recommended: Finnair via Helsinki (HEL) — better flight time and fatigue\n· Alternatives: Qatar (Doha), Lufthansa (Munich/Frankfurt), KLM (Amsterdam)\n· Summer peak (Jun–Aug) — book 3–4 months ahead",
  helsinki:
    "Flight booking tips\n· Direct: Finnair ICN↔Helsinki (HEL) nonstop (~9–10 hours)\n· Alternatives: 1 stop (total 12–16 hours) — SAS (Copenhagen), KLM (Amsterdam), Lufthansa (Munich/FRA)\n· Summer peak (Jun–Aug) — book 3–4 months ahead",
  stockholm:
    "Flight booking tips\n· Direct: none (usually 1 stop) · total 14–18 hours\n· Recommended: Finnair via Helsinki (HEL) — better flight time and fatigue\n· Alternatives: SAS (Copenhagen), KLM (Amsterdam), Lufthansa (Munich/FRA)\n· Summer peak (Jun–Aug) — book 3–4 months ahead",
  copenhagen:
    "Flight booking tips\n· Direct: none (usually 1 stop) · total 14–18 hours\n· Recommended: Finnair via Helsinki (HEL) — better flight time and fatigue\n· Alternatives: SAS (Copenhagen), KLM (Amsterdam), Lufthansa (Munich/FRA), Qatar (Doha)\n· Summer peak (Jun–Aug) — book 3–4 months ahead",
  luxor:
    "Luxor is typically ICN→Cairo (CAI) or Doha (DOH) international (~11–12 hours plus 2–5 hours layover), then Cairo→Luxor (LXR) domestic (~1 hour from CAI) or Doha→Luxor (~3.5 hours). Trip.com and other flight/affiliate searches should use Luxor (LXR) — if your itinerary includes connections and a domestic leg, set the final arrival code to LXR.",
  bohol:
    "Bohol is often reached via Tagbilaran (TAG) airport direct or by ferry from Cebu (CEB). Confirm the final arrival code on your ticket.",
  yokohama:
    "Yokohama is typically reached via Tokyo-area Haneda (HND) or Narita (NRT), then JR/subway. Confirm the final arrival code on your ticket.",
  tsushima:
    "Tsushima (対馬島) is the same island. The usual route from Korea is the ferry Busan International Passenger Terminal→Hitakatsu; there is no ICN direct flight. TSJ and FUK below are for Japanese domestic / Fukuoka-connection reference — prefer the toolkit itinerary (departing Busan) for ferry and rental cars.",
  yap:
    "Yap (YAP) is usually reached ICN→Guam (GUM) direct, then United Airlines to YAP (Island Hopper via Honolulu HNL is also possible). Trip.com and similar flight searches go as far as GUM — the YAP segment requires a United official booking. Car rental, pickup, and island plans are based on YAP arrival.",
  chuuk:
    "Chuuk (TKK) is usually reached ICN→Guam (GUM) direct, then United Airlines to TKK (Island Hopper via Honolulu HNL, or via MAJ, is also possible). Trip.com and similar flight searches go as far as GUM — the TKK segment requires a United official booking. Car rental, pickup, and island plans are based on TKK arrival.",
  kosrae:
    "Kosrae (KOS) is usually reached ICN→Guam (GUM) direct, then United Airlines to KOS (Island Hopper via Honolulu HNL is also possible). Trip.com and similar flight searches go as far as GUM — when booking on United, use destination code KSA. Car rental, pickup, and island plans are based on KOS arrival.",
  pohnpei:
    "Pohnpei (PNI) is usually reached ICN→Guam (GUM) direct, then United Airlines to PNI (Island Hopper via Honolulu HNL, or via MAJ, is also possible). Trip.com and similar flight searches go as far as GUM — the PNI segment requires a United official booking. Car rental, pickup, and island plans are based on PNI arrival.",
  "midway-atoll":
    "Midway Atoll has no commercial scheduled service; itineraries usually continue from Honolulu (HNL) under US Fish & Wildlife permits and tours.",
  "st-helena":
    "Final arrival for St Helena is St Helena (HLE). Connections and opening flights often continue from Johannesburg (JNB) and similar hubs. Confirm the final arrival code on your ticket.",
  ascension:
    "Final arrival for Ascension Island is Wideawake Airfield (ASI). Connections often continue from Johannesburg (JNB) on RAF or opening flights. It is a permit/restricted area — confirm the final arrival code on your ticket.",
  "어센션 섬":
    "Final arrival for Ascension Island is Wideawake Airfield (ASI). Connections often continue from Johannesburg (JNB) on RAF or opening flights. It is a permit/restricted area — confirm the final arrival code on your ticket.",
  "kerguelen-islands":
    "Kerguelen is reachable only by research/military ships or dedicated flights. Expedition itineraries typically pass through French Southern Territories gateways such as Réunion (RUN).",
  "angkor-wat":
    "Siem Reap Angkor (SAI) is the gateway after the old REP closed. Direct flights from Incheon are rare; Vietnam Airlines connections via Ho Chi Minh City (SGN) or Hanoi (HAN) are typical. Confirm the final arrival code on your ticket.",
  "angkor-thom":
    "The Angkor area (SAI) is the gateway after the old REP closed. Direct flights from Incheon are rare; Vietnam Airlines connections via Ho Chi Minh City (SGN) or Hanoi (HAN) are typical. Confirm the final arrival code on your ticket.",
  borneo:
    "Borneo spans Malaysia, Indonesia, and Brunei. Kinabalu/Sepilok (Sabah) use Kota Kinabalu (BKI); Kuching/Sarawak use Kuching (KCH); international connections often go via Kuala Lumpur (KUL). Brunei (BWN) is a separate destination. Confirm the final arrival code on your ticket.",
  brunei:
    "An independent country on northern Borneo. Entry documents and the gateway differ from Malaysian Sabah / Borneo (borneo) (BKI). Confirm ticket arrival as BWN.",
  "easter-island":
    "Easter Island has no direct flight from Incheon. Typical routing is ICN→LA (LAX), Atlanta (ATL), Sydney (SYD), or similar, then Santiago (SCL), then LATAM domestic to IPC. Confirm the final arrival code on your ticket.",
  antarctica:
    "Mainland Antarctica has no commercial flights. Tourist cruises usually use South American gateways such as Ushuaia (USH); McMurdo and similar bases often connect via Christchurch (CHC). Confirm the final arrival code on your ticket.",
  "cocos-islands":
    "The Australian Cocos (Keeling) Islands usually use Cocos Islands (CCK) direct or connections via mainland Australia such as Perth (PER). Confirm the final arrival code on your ticket.",
  "pitcairn-islands":
    "Pitcairn Islands have no commercial direct flight. Typical sequence is Tahiti (PPT) international → Mangareva (GMR) domestic → Rikitea ferry or dedicated passenger ship. Linked airports above are based on Tahiti (PPT).",
  greenland:
    "Greenland itineraries often connect via European gateways such as Copenhagen (CPH), then continue to Nuuk (GOH), Ilulissat, and similar. Confirm the final arrival code on your ticket.",
  "falkland-islands":
    "The Falkland Islands typically arrive at MPM (Mount Pleasant), often via Chile (SCL). Do not confuse with Torres del Paine (PUQ).",
  fiji:
    "Fiji (Nadi) has no direct flight from Incheon. Typical routings are ICN→Sydney (SYD), Auckland (AKL), or Tokyo (NRT), then NAN. Confirm the final arrival code on your ticket.",
  "new-caledonia":
    "New Caledonia has no direct flight from Incheon. Typical routing is ICN→Sydney (SYD) or Auckland (AKL), then Nouméa (NOU). Confirm the final arrival code on your ticket.",
  "solomon-islands":
    "The Solomon Islands have no direct flight from Incheon. Typical routing is ICN→Brisbane (BNE) or Sydney (SYD), then Honiara (HIR). Confirm the final arrival code on your ticket.",
  nauru:
    "Nauru has no direct flight from Incheon. Typical routing is ICN→Brisbane (BNE), then INU. Confirm the final arrival code on your ticket.",
  bahamas:
    "The Bahamas have different gateways by island (e.g. Nassau NAS). Connections via Miami (MIA) or Atlanta (ATL) are also common — confirm the final arrival code on your ticket.",
  vatican:
    "Vatican City is an independent state on the west side of central Rome. The international gateway is Rome Fiumicino (FCO); continue into the city/Vatican by metro, taxi, or on foot. Use arrival FCO when searching flights.",
  "la-spezia":
    "The La Spezia / Cinque Terre area has no airport. Most travelers enter internationally at Rome Fiumicino (FCO) or Milan Malpensa (MXP), then continue by train. Florence (FLR) or Pisa (PSA) can shorten the train ride to La Spezia. Confirm the final arrival code on your ticket, then match affiliate links to that airport.",
  라스페치아:
    "The La Spezia / Cinque Terre area has no airport. Most travelers enter internationally at Rome Fiumicino (FCO) or Milan Malpensa (MXP), then continue by train. Florence (FLR) or Pisa (PSA) can shorten the train ride to La Spezia. Confirm the final arrival code on your ticket, then match affiliate links to that airport.",
  ubud:
    "Ubud is a highland village in central Bali. The international gateway is Ngurah Rai (DPS); the drive to Ubud is about 1–1.5 hours. Use arrival DPS when searching flights.",
  bermuda:
    "Final arrival for Bermuda is Bermuda International (BDA). There is no ICN direct from Korea; typical connections are via the US East Coast (New York JFK, Boston BOS, Atlanta ATL, Miami MIA, etc.) or UK/Europe (London LHR, Paris CDG, etc.) then BDA. Via the US, check ESTA; via Canada or the UK, check the relevant entry/transit visa rules. Enter arrival code BDA when searching flights, confirm the final arrival airport on your ticket, then match affiliate links.",
  tonga:
    "Tonga (Nukuʻalofa) has no direct flight from Incheon. Typical routings are ICN→Fiji Nadi (NAN) on Fiji Airways or Auckland (AKL) on Air New Zealand, then TBU. Confirm the final arrival code on your ticket.",
  vanuatu:
    "Vanuatu has no direct flight from Incheon. Typical routing is ICN→Sydney (SYD) or Brisbane (BNE), then Port Vila (VLI). Confirm the final arrival code on your ticket.",
  콘다오:
    "Con Dao is typically ICN→Ho Chi Minh City (SGN) international, then a VASCO (or similar) domestic flight (SGN–VCS). Domestic seats are limited on small aircraft — book early. Car rental, pickup, and affiliate links are based on Con Dao Airport (VCS). Confirm the final arrival code on your ticket, then match search terms.",
  카바라티:
    "Kavaratti (Lakshadweep) is usually ICN→Cochin International (COK), then a domestic flight to Agatti (AGX), then boat or helicopter to Kavaratti. Trip.com and similar flight searches go as far as COK — AGX and island transfers follow the local schedule. Car rental and pickup are based on AGX.",
  kavaratti:
    "Kavaratti (Lakshadweep) is usually ICN→Cochin International (COK), then a domestic flight to Agatti (AGX), then boat or helicopter to Kavaratti. Trip.com and similar flight searches go as far as COK — AGX and island transfers follow the local schedule. Car rental and pickup are based on AGX.",
  아가티:
    "Agatti (Lakshadweep) is usually ICN→Cochin International (COK), then a domestic flight to Agatti (AGX). Trip.com and similar flight searches go as far as COK — match the AGX segment to your local schedule. Car rental and pickup are based on AGX.",
};
