import { useEffect } from "react";
import { typograf } from "@/lib/typograf";

const SKIP = new Set(["SCRIPT", "STYLE", "TEXTAREA", "INPUT", "CODE", "PRE"]);

function fix(node: Node) {
  if (node.nodeType === Node.TEXT_NODE) {
    const p = node.parentElement;
    if (!p || SKIP.has(p.tagName) || p.isContentEditable) return;
    const v = node.nodeValue ?? "";
    const t = typograf(v);
    if (t !== v) node.nodeValue = t;
    return;
  }
  if (node.nodeType === Node.ELEMENT_NODE && SKIP.has((node as Element).tagName)) return;
  node.childNodes.forEach(fix);
}

/** Applies Russian typography to all page text after hydration and on updates. */
export function useTypograf() {
  useEffect(() => {
    fix(document.body);
    const obs = new MutationObserver((list) => {
      for (const m of list) {
        if (m.type === "characterData") fix(m.target);
        else m.addedNodes.forEach(fix);
      }
    });
    obs.observe(document.body, { subtree: true, childList: true, characterData: true });
    return () => obs.disconnect();
  }, []);
}
