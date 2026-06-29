import { ref } from "vue";

export interface SpeechInputOptions {
  /** BCP-47 language tag. Default: 'es-AR' */
  lang?: string;
  /** Dictado continuo (no corta tras la primera pausa). Default: false */
  continuous?: boolean;
}

/**
 * Dictado por voz sobre la Web Speech API (`SpeechRecognition`).
 *
 * Lo consumen `<VoiceTextField>` y `<VoiceTextarea>`: exponen un botón de
 * micrófono y delegan acá el ciclo de grabación. `toggle(onFinal)` arranca o
 * detiene la captura; al terminar invoca `onFinal` con el texto reconocido y
 * deja que el componente decida si reemplaza o agrega al `v-model`.
 *
 * El reconocimiento de voz no está tipado en la lib DOM estándar, por eso se
 * usa `any` para el motor y sus eventos.
 */
export function useSpeechInput(options: SpeechInputOptions = {}) {
  const { lang = "es-AR", continuous = false } = options;

  const SpeechRecognitionCtor =
    typeof window !== "undefined"
      ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      : undefined;

  const isSupported = !!SpeechRecognitionCtor;

  const isListening = ref(false);
  const isError = ref(false);
  const interimText = ref("");
  const errorMessage = ref("");

  let recognition: any = null;
  let finalTranscript = "";
  let onFinalCb: ((text: string) => void) | null = null;

  // Mensajes amigables para los códigos de error del API.
  const ERROR_MESSAGES: Record<string, string> = {
    "no-speech": "No se detectó voz",
    "audio-capture": "No se encontró micrófono",
    "not-allowed": "Permiso de micrófono denegado",
    "service-not-allowed": "Permiso de micrófono denegado",
    network: "Error de red en el reconocimiento",
    aborted: "Grabación cancelada",
  };

  const stop = () => {
    if (recognition) {
      try {
        recognition.stop();
      } catch {
        /* el motor ya estaba detenido */
      }
    }
  };

  const start = (onFinal: (text: string) => void) => {
    if (!isSupported) {
      isError.value = true;
      errorMessage.value = "Voz no disponible en este navegador";
      return;
    }

    onFinalCb = onFinal;
    finalTranscript = "";
    interimText.value = "";
    isError.value = false;
    errorMessage.value = "";

    recognition = new SpeechRecognitionCtor();
    recognition.lang = lang;
    recognition.continuous = continuous;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interim += transcript;
        }
      }
      interimText.value = interim;
    };

    recognition.onerror = (event: any) => {
      isError.value = true;
      errorMessage.value =
        ERROR_MESSAGES[event?.error] || "Error de reconocimiento de voz";
    };

    recognition.onend = () => {
      isListening.value = false;
      interimText.value = "";
      const text = finalTranscript.trim();
      if (text && onFinalCb && !isError.value) {
        onFinalCb(text);
      }
      onFinalCb = null;
      recognition = null;
    };

    try {
      recognition.start();
      isListening.value = true;
    } catch {
      // start() lanza si ya hay una sesión activa; lo ignoramos.
      isListening.value = false;
    }
  };

  /** Alterna entre iniciar y detener la grabación. */
  const toggle = (onFinal: (text: string) => void) => {
    if (isListening.value) {
      stop();
    } else {
      start(onFinal);
    }
  };

  return { isSupported, isListening, isError, interimText, errorMessage, toggle, stop };
}
