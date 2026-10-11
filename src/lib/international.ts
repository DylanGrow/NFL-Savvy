/**
 * Helper utilities for detecting and formatting NFL International Series games.
 * Supports ESPN Scoreboard, Schedule, and Game Summary endpoints.
 */

export interface InternationalGameInfo {
  isInternational: boolean;
  flag: string;
  country: string;
  city: string;
  venue?: string;
  headline: string;   // e.g. "NFL London Games", "NFL Melbourne Game"
  seriesName: string; // e.g. "NFL London Series", "NFL Melbourne Game"
  badgeLabel: string; // e.g. "🇬🇧 London Series", "🇦🇺 Melbourne Game"
  shortLabel: string; // e.g. "🇬🇧 London", "🇦🇺 Melbourne"
}

/**
 * Inspects an ESPN game object, competition, or game summary to determine if it is an
 * international (overseas / neutral site outside USA) game.
 */
export function getInternationalGameInfo(gameOrComp: any, extraData?: any): InternationalGameInfo | null {
  if (!gameOrComp && !extraData) return null;

  // Extract competition, venue, notes, gameNote
  const comp = gameOrComp?.competitions ? gameOrComp.competitions[0] : (gameOrComp || {});
  const venue = comp?.venue || extraData?.gameInfo?.venue || gameOrComp?.gameInfo?.venue || gameOrComp?.venue || extraData?.venue;
  const address = venue?.address;
  const country = (address?.country || '').trim();
  const city = (address?.city || '').trim();
  const venueName = (venue?.fullName || venue?.name || '').trim();

  // Extract notes/headlines
  const notes = comp?.notes || gameOrComp?.notes || extraData?.notes || [];
  const headlines: string[] = Array.isArray(notes)
    ? notes.map((n: any) => (typeof n === 'string' ? n : (n?.headline || n?.text || ''))).filter(Boolean)
    : [];
  if (gameOrComp?.header?.gameNote) headlines.push(gameOrComp.header.gameNote);
  if (extraData?.header?.gameNote) headlines.push(extraData.header.gameNote);
  if (comp?.gameNote) headlines.push(comp.gameNote);

  const headlineStr = headlines.join(' ');
  const allText = [country, city, venueName, headlineStr].join(' ').toLowerCase();

  let flag = '';
  let targetCountry = country;
  let targetCity = city;
  let seriesLabel = '';
  let shortCity = '';

  if (
    allText.includes('london') ||
    allText.includes('england') ||
    allText.includes('wembley') ||
    allText.includes('tottenham') ||
    allText.includes('twickenham') ||
    allText.includes('united kingdom')
  ) {
    flag = '🇬🇧';
    targetCountry = 'United Kingdom';
    targetCity = targetCity || 'London';
    shortCity = 'London';
    seriesLabel = 'NFL London Series';
  } else if (
    allText.includes('munich') ||
    allText.includes('frankfurt') ||
    allText.includes('germany') ||
    allText.includes('bayern') ||
    allText.includes('allianz arena') ||
    allText.includes('deutsche bank park')
  ) {
    flag = '🇩🇪';
    targetCountry = 'Germany';
    targetCity = targetCity || (allText.includes('munich') ? 'Munich' : 'Frankfurt');
    shortCity = targetCity;
    seriesLabel = 'NFL Germany Game';
  } else if (
    allText.includes('madrid') ||
    allText.includes('spain') ||
    allText.includes('bernabéu') ||
    allText.includes('bernabeu') ||
    allText.includes('metropolitano')
  ) {
    flag = '🇪🇸';
    targetCountry = 'Spain';
    targetCity = targetCity || 'Madrid';
    shortCity = 'Madrid';
    seriesLabel = 'NFL Madrid Game';
  } else if (
    allText.includes('paris') ||
    allText.includes('france') ||
    allText.includes('saint-denis') ||
    allText.includes('stade de france')
  ) {
    flag = '🇫🇷';
    targetCountry = 'France';
    targetCity = targetCity || 'Saint-Denis';
    shortCity = 'Paris';
    seriesLabel = 'NFL Paris Game';
  } else if (
    allText.includes('rio') ||
    allText.includes('brazil') ||
    allText.includes('brasil') ||
    allText.includes('são paulo') ||
    allText.includes('sao paulo') ||
    allText.includes('maracanã') ||
    allText.includes('maracana') ||
    allText.includes('corinthians')
  ) {
    flag = '🇧🇷';
    targetCountry = 'Brazil';
    targetCity = targetCity || (allText.includes('rio') ? 'Rio De Janeiro' : 'São Paulo');
    shortCity = targetCity.includes('Rio') ? 'Rio' : 'São Paulo';
    seriesLabel = 'NFL Brazil Game';
  } else if (
    allText.includes('melbourne') ||
    allText.includes('australia') ||
    allText.includes('cricket ground') ||
    allText.includes('sydney')
  ) {
    flag = '🇦🇺';
    targetCountry = 'Australia';
    targetCity = targetCity || 'Melbourne';
    shortCity = 'Melbourne';
    seriesLabel = 'NFL Melbourne Game';
  } else if (
    allText.includes('mexico') ||
    allText.includes('azteca') ||
    allText.includes('banorte')
  ) {
    flag = '🇲🇽';
    targetCountry = 'Mexico';
    targetCity = targetCity || 'Mexico City';
    shortCity = 'Mexico City';
    seriesLabel = 'NFL Mexico Game';
  } else if (
    allText.includes('dublin') ||
    allText.includes('ireland') ||
    allText.includes('croke park') ||
    allText.includes('aviva')
  ) {
    flag = '🇮🇪';
    targetCountry = 'Ireland';
    targetCity = targetCity || 'Dublin';
    shortCity = 'Dublin';
    seriesLabel = 'NFL Ireland Game';
  } else if (
    country &&
    country.toUpperCase() !== 'USA' &&
    country.toUpperCase() !== 'US' &&
    country.toUpperCase() !== 'UNITED STATES'
  ) {
    flag = '🌐';
    targetCountry = country;
    shortCity = city || country;
    seriesLabel = 'NFL International Game';
  }

  if (!flag) return null;

  const rawHeadline = headlineStr || seriesLabel;
  const badgeLabel = `${flag} ${shortCity || targetCity || targetCountry} Game`;
  const shortLabel = `${flag} ${shortCity || targetCity || targetCountry}`;

  return {
    isInternational: true,
    flag,
    country: targetCountry,
    city: targetCity || shortCity,
    venue: venueName,
    headline: rawHeadline,
    seriesName: seriesLabel || 'NFL International Series',
    badgeLabel,
    shortLabel,
  };
}
