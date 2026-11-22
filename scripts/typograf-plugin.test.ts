import { describe, expect, it } from "vitest";
import { typografSource } from "./typograf-plugin.mjs";
describe("build-time typograf", () => {
  it("glues short Russian words in source text", () => {
    expect(typografSource('<p>Приходите в кабинет</p>')).toBe("<p>Приходите в\u00a0кабинет</p>");
  });
  it("never touches code identifiers", () => {
    const code = "if (a && b) do { x = y } while (z)";
    expect(typografSource(code)).toBe(code);
  });
  it("keeps the address on one line", () => {
    expect(typografSource("ЖК Полярная 25")).toContain("Полярная\u00a025");
  });
});
