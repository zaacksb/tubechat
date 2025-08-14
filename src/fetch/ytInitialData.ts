
import { findKey, getStr } from '../utils';

export type loggedInYT = "1" | "0"

export interface IYoutubeInitialDataResponse {
  code: "success"
  clientName: string
  clientVersion: string
  loggedIn: loggedInYT
  params: string
  apiKey: string
  continuation: string
}

export interface IYoutubeInitialDataResponseError {
  code: "error" | "chat_not_found" | "ended_event"
  message?: string
}


export interface IYoutubeInitialData {
  contents: {
    messageRenderer: {
      text: {
        runs: {
          text: string;
        }[];
      };
    };
    liveChatRenderer: {
      header: {
        liveChatHeaderRenderer: {
          viewSelector: {
            sortFilterSubMenuRenderer: {
              subMenuItems: {
                continuation: {
                  reloadContinuationData: {
                    continuation: string
                  }
                }
              }[]
            };
          };
        };
      };
    };
  };
  responseContext: {
    serviceTrackingParams: [
      {
        params: {
          key: string,
          value: string
        }[]
      },
      {
        params: {
          key: string
          value: loggedInYT | undefined
        }[]
      }
    ];
  };
}

export interface ISendLiveChatMessageEndpoint {
  params?: string
}
export async function ytInitialData(videoId: string, cookies: string = ""): Promise<IYoutubeInitialDataResponse | IYoutubeInitialDataResponseError> {
  let error = 0
  let messageError = ""
  try {
    const headers = {
      'Accept-Language': 'pt-BR',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36 OPR/100.0.0.0',
      "Cookies": cookies
    }
    const responseData = await fetch(`https://www.youtube.com/live_chat?is_popout=1&v=${videoId}`, {
      headers
    })
    const responseText = await responseData.text()
    if (responseText.includes("search-button")) {
      error = 1
    }
    const apiKey = getStr(responseText, 'INNERTUBE_API_KEY":"', '"')!
    const ytInitialDataText = getStr(responseText, `window["ytInitialData"] = `, `;</script>`)!
    const ytInitialData = JSON.parse(ytInitialDataText) as IYoutubeInitialData
    const endedEvent = ytInitialData.contents?.messageRenderer?.text?.runs[0]?.text || ""
    if (endedEvent) {
      error = 2
      messageError = endedEvent
    }
    const [clientName, clientVersion] = ytInitialData.responseContext.serviceTrackingParams[0].params
    const [loggedIn] = ytInitialData.responseContext.serviceTrackingParams[1].params
    const [_chatMain, chatAll] = ytInitialData.contents.liveChatRenderer.header.liveChatHeaderRenderer.viewSelector.sortFilterSubMenuRenderer.subMenuItems
    const continuation = chatAll?.continuation.reloadContinuationData.continuation
    const sendLiveChatMessageEndpoint = findKey(ytInitialData, "sendLiveChatMessageEndpoint") as ISendLiveChatMessageEndpoint
    return {
      code: "success",
      clientName: clientName?.value!,
      clientVersion: clientVersion?.value!,
      loggedIn: loggedIn?.value || "0",
      continuation: continuation!,
      params: sendLiveChatMessageEndpoint?.params || "",
      apiKey
    }
  } catch (err) {
    if (error == 0) {
      return {
        code: "error",
        message: "Unknown fetch error"
      }
    }
    if (error = 1) {
      return {
        code: "chat_not_found",
        message: "Cannot find stream chat"
      }
    }
    if (error = 2) {
      return {
        code: "ended_event",
        message: messageError
      }
    }
  }
  return {
    code: "error",
    message: "Unknown error"
  }
}


