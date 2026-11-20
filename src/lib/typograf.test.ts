import { describe, expect, it } from "vitest";
import { typograf } from "./typograf";
const N = "\u00a0";
describe("typograf", () => {
  it("glues one-letter prepositions to the next word", () => {
    expect(typograf("приходите к нам")).toBe(`приходите к${N}нам`);
  });
  it("glues two-letter words like за and chains", () => {
    expect(typograf("за чаем и в тишине")).toBe(`за${N}чаем и${N}в${N}тишине`);
  });
  it("keeps the address on one line", () => {
    expect(typograf("ЖК «Полярная 25»")).toBe(`ЖК${N}«Полярная${N}25»`);
  });
  it("does not touch long words", () => {
    expect(typograf("тёплое убежище")).toBe("тёплое убежище");
  });
});
