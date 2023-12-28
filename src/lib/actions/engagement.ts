const engagement = (value: any, emitter: NodeJS.EventEmitter, channel: string) => {
  emitter.emit("engagement", { channel, ...value });
}

export default engagement


// {"id":"CjEKL0NPTU1VTklUWV9HVUlERUxJTkVTX1ZFTTIwMjMvMDgvMjYtMDM6NTY6NTEuMzE5","timestampUsec":"1693047411319254","icon":{"iconType":"YOUTUBE_ROUND"},"message":{"runs":[{"text":"Welcome to live chat! Remember to guard your privacy and abide by our community guidelines."}]},"actionButton":{"buttonRenderer":{"style":"STYLE_BLUE_TEXT","size":"SIZE_DEFAULT","isDisabled":false,"text":{"simpleText":"Learn more"},"navigationEndpoint":{"clickTrackingParams":"CBgQ8FsiEwi5mqaMlfqAAxWlWkgAHd_wDWs=","commandMetadata":{"webCommandMetadata":{"url":"//support.google.com/youtube/answer/2853856?hl=en#safe","webPageType":"WEB_PAGE_TYPE_UNKNOWN","rootVe":83769}},"urlEndpoint":{"url":"//support.google.com/youtube/answer/2853856?hl=en#safe","target":"TARGET_NEW_WINDOW"}},"trackingParams":"CBgQ8FsiEwi5mqaMlfqAAxWlWkgAHd_wDWs=","accessibilityData":{"accessibilityData":{"label":"Learn more"}}}},"trackingParams":"CAEQl98BIhMIuZqmjJX6gAMVpVpIAB3f8A1r"}