import { ref } from "vue";

// Estado compartido de PWA (instalación + conectividad).
const canInstall = ref(false);
const isOnline = ref(true);
let deferredPrompt: any = null;

export const setDeferredPrompt = (e: any) => {
  deferredPrompt = e;
  canInstall.value = !!e;
};

export const setOnline = (value: boolean) => {
  isOnline.value = value;
};

export const usePwa = () => {
  const promptInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    canInstall.value = false;
  };

  return { canInstall, isOnline, promptInstall };
};
