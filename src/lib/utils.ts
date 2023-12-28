import type { IChatMessage, IChatThumbnail, IMessageParsed, YTChatBadges } from "../types/Types";
import { GiftRuns } from "./actions/liveChatTickerSponsorItemRenderer";

export function getStr(string: string, start: string, end: string) { // get part of stringg passing start and end
  var str
  var canSplit = function (str: string, token: string) {
    return (str || '').split(token).length > 1;
  }
  if (canSplit(string, start)) {
    str = string.split(start);
    if (end) {
      str = str[1].split(end);
      return str[0];
    } else { return str = str[1]; }

  } else { return "" }
}


export function sleep(time: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, time)
  })
}


type TFindKeyObj = any
export function findKey(obj: TFindKeyObj, key: string): TFindKeyObj {
  for (const k in obj) {
    if (k === key) {
      return obj[k];
    }
    if (typeof obj[k] === 'object') {
      const value = findKey(obj[k], key);
      if (value) {
        return value;
      }
    }
  }
  return null;
}

export function parseMessages(runs: IChatMessage[]): IMessageParsed[] {
  return runs.map((run: IChatMessage) => {
    if (!run?.emoji) {
      return run as any; // no time bro
    } else {
      const thumbnail = run.emoji.image.thumbnails.shift();
      const isCustomEmoji = Boolean(run.emoji.isCustomEmoji);
      const shortcut = run.emoji.shortcuts ? run.emoji.shortcuts[0] : "";
      return {
        url: thumbnail ? thumbnail.url : "",
        alt: shortcut,
        isCustomEmoji: isCustomEmoji,
        emojiText: isCustomEmoji ? shortcut : run.emoji.emojiId
      };
    }
  })
}

export function compactMessage(message: any) {
  const result = [];
  let currentGroup = null;
  if (!message) return
  for (const element of message) {
    if (element && "text" in element) {
      if (!currentGroup) {
        currentGroup = { text: element.text };
      } else {
        currentGroup.text += " " + element.text;
      }
    } else {
      if (currentGroup) {
        result.push(currentGroup);
        currentGroup = null;
      }
      result.push(element);
    }
  }

  if (currentGroup) {
    result.push(currentGroup);
  }

  return result;
}


export function convertColorToHex6(colorNum: number) {
  return `#${colorNum.toString(16).slice(2).toLocaleUpperCase()}`;
}


export function parseThumbnailToImageItem(data: IChatThumbnail[], alt: string): { url: string, alt: string } {
  const thumbnail = data.pop();
  if (thumbnail) {
    return {
      url: thumbnail.url,
      alt: alt,
    };
  } else {
    return {
      url: "",
      alt: "",
    };
  }
}

export function createBadgesElements(thumbnails: IChatThumbnail[], tooltip: string) {
  let badges = {} as YTChatBadges;
  if (thumbnails) {
    badges.thumbnail = parseThumbnailToImageItem(thumbnails, tooltip);
    badges.label = tooltip;
  }
  return badges
}

export function filterAndExtractSubGiftNames(giftRuns: GiftRuns[]) {
  const newArray = [];
  for (let i = 2; i < giftRuns.length - 1; i++) {
    if (giftRuns[i].text.trim() !== "") {
      newArray.push(giftRuns[i].text);
    }
  }
  return newArray;
}

interface CurrencyValue {
  amount: number;
  currency: string;
}

export function extractCurrencyValue(value: string): CurrencyValue {
  const currencyMatch = value.match(/[A-Z$€¥£]+/);
  const cleanedValue = parseFloat(value.replace(/[^\d.]/g, ''));

  if (!currencyMatch) {
    console.error("Unable to identify the currency.", value);
    return {
      amount: cleanedValue,
      currency: ''
    }
  }


  return {
    amount: cleanedValue,
    currency: currencyMatch[0],
  };
}