'use client';

const RAW_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '';
const PRESET_MESSAGE = process.env.NEXT_PUBLIC_WHATSAPP_MESSAGE || 'Hi! I have a question about my order on Apni Dukan.';

export default function WhatsAppButton() {
  // Strip non-digits so users can paste numbers in any common format.
  const number = RAW_NUMBER.replace(/[^0-9]/g, '');
  if (!number) return null;

  const href = `https://wa.me/${number}?text=${encodeURIComponent(PRESET_MESSAGE)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-5 right-5 z-50 group flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white rounded-full shadow-2xl pl-3 pr-4 py-3 transition-all duration-300 hover:scale-105 active:scale-95"
    >
      <svg
        viewBox="0 0 32 32"
        className="w-7 h-7 drop-shadow"
        aria-hidden="true"
        fill="currentColor"
      >
        <path d="M19.11 17.205c-.372 0-1.088 1.39-1.518 1.39a.63.63 0 0 1-.315-.1c-.802-.402-1.504-.817-2.163-1.447-.545-.516-1.146-1.29-1.46-1.963a.426.426 0 0 1-.073-.215c0-.33.99-.945.99-1.49 0-.143-.73-2.09-.832-2.335-.143-.372-.214-.487-.6-.487-.187 0-.36-.043-.53-.043-.302 0-.53.115-.746.315-.688.645-1.032 1.318-1.06 2.293v.143c-.014.99.472 1.977 1.017 2.78 1.23 1.82 2.506 3.41 4.554 4.34.616.287 2.035.99 2.722.99h.025c.33 0 .56-.03.717-.1.473-.21 1.39-.815 1.39-1.39 0-.115-.01-.215-.043-.314-.013-.272-1.93-.93-2.073-.93z" />
        <path d="M16.001 0C7.165 0 .001 7.165.001 16c0 2.715.687 5.387 2 7.755L0 32l8.448-2.221A15.92 15.92 0 0 0 16.001 32C24.836 32 32 24.836 32 16S24.836 0 16.001 0zm0 29.328a13.27 13.27 0 0 1-6.766-1.85l-.486-.286-5.013 1.317 1.339-4.886-.314-.5a13.27 13.27 0 0 1-2.043-7.123c0-7.327 5.962-13.288 13.282-13.288 7.327 0 13.288 5.962 13.288 13.282S23.328 29.328 16.001 29.328z" />
      </svg>
      <span className="hidden sm:inline font-semibold whitespace-nowrap">Chat with us</span>
    </a>
  );
}
