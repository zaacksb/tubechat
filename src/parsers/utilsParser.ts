import { LeaderboardBadge } from "./types";

export function formatBeforeContentButtons(beforeContentButtons: LeaderboardBadge[]) {
  return (beforeContentButtons || []).map(data => ({
    buttonViewModel: {
      accessibilityText: data.buttonViewModel.accessibilityText,
      iconName: data.buttonViewModel.iconName,
      title: data.buttonViewModel.title,
      ...(data.buttonViewModel.onTap && { onTap: data.buttonViewModel.onTap }),
    }
  }))
}
const currencies = {
  "د.إ": "aed",
  "؋": "afn",
  "֏": "amd",
  "ƒ": "ang",
  "Kz": "aoa",
  "₼": "azn",
  "KM": "bam",
  "৳": "bdt",
  "BGN": "bgn",
  "лв": "bgn",
  ".د.ب": "bhd",
  "FBu": "bif",
  "$b": "bob",
  "BOV": "bov",
  "R$": "brl",
  "₿": "btc",
  "Nu.": "btn",
  "P": "bwp",
  "Br": "byn",
  "BZ$": "bzd",
  "FC": "cdf",
  "CHE": "che",
  "CHF": "chf",
  "CHW": "chw",
  "CLF": "clf",
  "CN¥": "cny",
  "COU": "cou",
  "₡": "crc",
  "CUP": "cup",
  "Kč": "czk",
  "Fdj": "djf",
  "kr": "dkk",
  "RD$": "dop",
  "دج": "dzd",
  "Nfk": "ern",
  "Ξ": "eth",
  "€": "eur",
  "£": "gbp",
  "₾": "gel",
  "₵": "ghc",
  "GH₵": "ghs",
  "D": "gmd",
  "FG": "gnf",
  "Q": "gtq",
  "L": "hnl",
  "kn": "hrk",
  "G": "htg",
  "Ft": "huf",
  "Rp": "idr",
  "IRR": "irr",
  "J$": "jmd",
  "JD": "jod",
  "¥": "jpy",
  "KSh": "kes",
  "KGS": "kgs",
  "៛": "khr",
  "CF": "kmf",
  "KPW": "kpw",
  "₩": "krw",
  "KD": "kwd",
  "₸": "kzt",
  "₭": "lak",
  "₨": "lkr",
  "M": "lsl",
  "Ł": "ltc",
  "Lt": "ltl",
  "Ls": "lvl",
  "LD": "lyd",
  "MAD": "mad",
  "lei": "mdl",
  "Ar": "mga",
  "ден": "mkd",
  "K": "mmk",
  "MMK": "mmk",
  "₮": "mnt",
  "MOP$": "mop",
  "MRU": "mru",
  "MRO": "mro",
  "MUR": "mur",
  "Rf": "mvr",
  "MK": "mwk",
  "MXV": "mxv",
  "RM": "myr",
  "MT": "mzn",
  "₦": "ngn",
  "C$": "nio",
  "NPR": "npr",
  "﷼": "omr",
  "B/.": "pab",
  "S/.": "pen",
  "PGK": "pgk",
  "₱": "php",
  "PKR": "pkr",
  "zł": "pln",
  "Gs": "pyg",
  "QAR": "qar",
  "￥": "rmb",
  "RON": "ron",
  "Дин.": "rsd",
  "₽": "rub",
  "R₣": "rwf",
  "SAR": "sar",
  "SCR": "scr",
  "ج.س.": "sdg",
  "S$": "sgd",
  "Le": "sll",
  "S": "sos",
  "Db": "std",
  "STD": "std",
  "STN": "stn",
  "E": "szl",
  "฿": "thb",
  "SM": "tjs",
  "T": "tmt",
  "د.ت": "tnd",
  "T$": "top",
  "₤": "trl",
  "₺": "try",
  "TT$": "ttd",
  "NT$": "twd",
  "TSh": "tzs",
  "₴": "uah",
  "USh": "ugx",
  "$": "usd",
  "UYI": "uyi",
  "$U": "uyu",
  "UYW": "uyw",
  "UZS": "uzs",
  "Bs": "vef",
  "Bs.S": "ves",
  "₫": "vnd",
  "VT": "vuv",
  "WS$": "wst",
  "FCFA": "xaf",
  "Ƀ": "xbt",
  "CFA": "xof",
  "₣": "xpf",
  "Sucre": "xsu",
  "XUA": "xua",
  "YER": "yer",
  "R": "zar",
  "ZK": "zmw",
  "Z$": "zwd",
  "jp¥": "jpy",
  "₹": "inr",
  "A$": "aud",
  "CA$": "cad",
  "HK$": "hkd",
  "MX$": "mxn",
  "NZ$": "nzd",
  "SEK": "sek",
  "ARS": "ars"
}
export function convertSymbolCurrencies(stringValue: string, customFormats?: Record<string, string>): { symbol: string, currency: string, value: number } {
  const currencyFormats: Record<string, string> = customFormats || currencies;

  const raw = (stringValue || '').trim();
  const exp = /^(\D+?)\s?([\d.,\s]+)$/;
  const match = exp.exec(raw);

  if (!match) {
    return { symbol: raw, currency: raw, value: NaN };
  }

  const symbol = (match[1] || '').trim();
  const amount = (match[2] || '').replace(/\s/g, '');
  // Resolve decimal vs thousands separators:
  // - both '.' and ',' present -> last one is decimal ("1,000.00", "1.000,00")
  // - only commas -> thousands if /^\d{1,3}(,\d{3})+$/ ("1,000", "10,000,000"), else decimal ("5,00")
  // - only dots -> thousands if /^\d{1,3}(\.\d{3})+$/ ("1.000"), else decimal ("12.50")
  const hasDot = amount.includes('.');
  const hasComma = amount.includes(',');
  let normalized: string;
  if (hasDot && hasComma) {
    normalized = amount.lastIndexOf('.') > amount.lastIndexOf(',')
      ? amount.replace(/,/g, '')
      : amount.replace(/\./g, '').replace(',', '.');
  } else if (hasComma) {
    normalized = /^\d{1,3}(,\d{3})+$/.test(amount) ? amount.replace(/,/g, '') : amount.replace(',', '.');
  } else if (hasDot) {
    normalized = /^\d{1,3}(\.\d{3})+$/.test(amount) ? amount.replace(/\./g, '') : amount;
  } else {
    normalized = amount;
  }
  const value = parseFloat(normalized);

  if (Number.isNaN(value)) {
    return { symbol, currency: symbol, value: NaN };
  }

  const currency = currencyFormats[symbol] || symbol.toLowerCase();

  return { symbol, currency, value };
}

/** purchaseAmountText can be {simpleText} or {runs[]}. Returns joined text. */
export function purchaseAmountToText(purchaseAmountText: any): string {
  if (!purchaseAmountText) return '';
  if (typeof purchaseAmountText.simpleText === 'string') return purchaseAmountText.simpleText;
  if (Array.isArray(purchaseAmountText.runs)) {
    return purchaseAmountText.runs.map((r: any) => r?.text || '').join('');
  }
  return '';
}

/** Strip only a leading '//' (protocol-relative) instead of breaking https:// */
export function normalizeThumbUrl(url: string): string {
  if (!url) return '';
  return url.startsWith('//') ? 'https:' + url : url;
}