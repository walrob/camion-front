import { onMounted, onBeforeUnmount } from "vue";

// Publica en el root la variable CSS `--keyboard-inset` con la altura (px) que el
// teclado virtual tapa del viewport, usando la API visualViewport.
//
// - Android/Chrome (con `interactive-widget=resizes-content`): el viewport ya se
//   achica, así que el inset queda ~0 y el layout dvh hace el trabajo.
// - iOS Safari: dvh NO se achica con el teclado; acá visualViewport sí refleja el
//   alto real del teclado, permitiendo subir el contenido con `var(--keyboard-inset)`.
// onChange: callback opcional que se dispara cuando cambia el inset (p. ej. para
// re-scrollear un chat al último mensaje cuando el teclado abre/cierra).
export const useKeyboardInset = (onChange?: () => void) => {
  const setInset = () => {
    const vv = window.visualViewport;
    if (!vv) return;
    // Alto tapado = lo que queda del layout viewport por debajo del área visible.
    const overlap = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
    document.documentElement.style.setProperty("--keyboard-inset", `${overlap}px`);
    onChange?.();
  };

  const reset = () =>
    document.documentElement.style.setProperty("--keyboard-inset", "0px");

  onMounted(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    setInset();
    vv.addEventListener("resize", setInset);
    vv.addEventListener("scroll", setInset);
  });

  onBeforeUnmount(() => {
    const vv = window.visualViewport;
    vv?.removeEventListener("resize", setInset);
    vv?.removeEventListener("scroll", setInset);
    reset();
  });
};
