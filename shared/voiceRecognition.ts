interface SpeechResultLike {
  isFinal: boolean
  0?: { transcript: string }
}

interface SpeechResultEventLike {
  results: ArrayLike<SpeechResultLike>
}

interface SpeechErrorEventLike {
  error: string
}

export interface VoiceRecognition {
  lang: string
  interimResults: boolean
  continuous: boolean
  onresult: ((event: SpeechResultEventLike) => void) | null
  onerror: ((event: SpeechErrorEventLike) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

interface VoiceRecognitionWindow extends Window {
  SpeechRecognition?: new () => VoiceRecognition
  webkitSpeechRecognition?: new () => VoiceRecognition
}

interface VoiceRecognitionHandlers {
  onTranscript: (transcript: string) => void
  onError: (error: string) => void
  onEnd: () => void
}

export function createVoiceRecognition(
  language: string,
  handlers: VoiceRecognitionHandlers,
): VoiceRecognition | null {
  const speechWindow = window as VoiceRecognitionWindow
  const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition
  if (!Recognition) return null

  const recognition = new Recognition()
  recognition.lang = language
  recognition.interimResults = false
  recognition.continuous = false
  recognition.onresult = (event) => {
    const transcript = Array.from(event.results)
      .filter((result) => result.isFinal)
      .map((result) => result[0]?.transcript ?? '')
      .join(' ')
      .trim()
    if (transcript) handlers.onTranscript(transcript)
  }
  recognition.onerror = (event) => handlers.onError(event.error)
  recognition.onend = handlers.onEnd
  return recognition
}
