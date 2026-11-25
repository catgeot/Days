import { arrivalAirportForAccessDestination } from './koreaOriginGeolocation.js';
import { getFlightCinemaOriginOption, getFlightOriginDisplayLabel } from './flightCinemaOriginOptions.js';
import {
  resolveInternationalGatewayForCityId,
  resolveInternationalGatewayForProvince,
} from './koreaCityInternationalAirport.js';
import {
  buildFestivalAccessAskText,
  overseasSendRequest,
} from './festivalDomesticOrigins.js';

const DEFAULT_GATEWAY = 'ICN';

/**
 * GPS «내 위치» for the place card and the festival dock.
 * Overseas: city plus nearest airport. Korea: the city, with its international gateway.
 */
export function myLocationSendRequest({ kind = 'festival', found, destination } = {}) {
  const dest = destination || {};
  if (found?.originIata && found?.city && found?.country) {
    const arrival = arrivalAirportForAccessDestination(dest);
    const originIata = String(found.originIata).trim().toUpperCase();
    const same = !arrival?.iata || arrival.iata === originIata;
    return overseasSendRequest({
      city: found.city,
      country: found.country,
      cityEn: found.cityEn || found.city,
      countryEn: found.countryEn || found.country,
      originIata,
      originLabelKo: found.originLabelKo || originIata,
      originLabelEn: found.originLabelEn || originIata,
      koreaIata: same ? '' : arrival.iata,
      arrivalLabelKo: same ? '' : arrival.labelKo,
      arrivalLabelEn: same ? '' : arrival.labelEn,
    }, kind);
  }
  const city = found?.city;
  if (!city?.ko) return null;
  const gateway = String(
    resolveInternationalGatewayForCityId(city.id)
    || resolveInternationalGatewayForProvince(city.province)
    || DEFAULT_GATEWAY,
  ).toUpperCase();
  if (kind === 'festival') {
    const sentenceKo = buildFestivalAccessAskText({ ko: city.ko, en: city.en || city.ko }, 'ko');
    const sentenceEn = buildFestivalAccessAskText({ ko: city.ko, en: city.en || city.ko }, 'en');
    return {
      sentenceKo,
      sentenceEn,
      chipKo: `${city.ko} (${gateway})`,
      chipEn: `${city.en || city.ko} (${gateway})`,
      askKo: city.ko,
      askEn: city.en || city.ko,
      departureIata: gateway,
      arrivalIata: '',
      domesticGround: true,
    };
  }
  const hub = getFlightCinemaOriginOption(gateway);
  const arrival = arrivalAirportForAccessDestination(dest);
  const same = !arrival?.iata || arrival.iata === gateway;
  return overseasSendRequest({
    city: city.ko,
    country: '대한민국',
    cityEn: city.en || city.ko,
    countryEn: 'South Korea',
    originIata: gateway,
    originLabelKo: hub?.officialKo || gateway,
    originLabelEn: getFlightOriginDisplayLabel(gateway, 'en') || gateway,
    koreaIata: same ? '' : arrival.iata,
    arrivalLabelKo: same ? '' : arrival.labelKo,
    arrivalLabelEn: same ? '' : arrival.labelEn,
  }, 'place');
}
