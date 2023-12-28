export async function fetchChat(continuation: string, apiKey: string, clientName: string, clientVersion: string) {
  try {
    const bodyPost = {
      context: {
        client: {
          clientName,
          clientVersion
        }
      },
      continuation
    }
    const requestOptions = {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify(bodyPost),
    } as unknown as RequestInit

    const fetchMessages = await fetch(`https://www.youtube.com/youtubei/v1/live_chat/get_live_chat?key=${apiKey}&prettyPrint=false`, requestOptions)
    const messageData = await fetchMessages.json()
    return messageData
  } catch (err) {
    return err
  }
}