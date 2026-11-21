import { describe, it, expect } from "vitest";
import { ritualMessage } from "./ritual";

describe("ritualMessage", () => {
  it("names the chosen oil and tea", () => {
    expect(ritualMessage("hvoya", "ded")).toBe("Здравствуйте, Александра! К моему сеансу хочется: масло — хвоя и кедр, после — дедушкин чай.");
  });
  it("is empty until both are chosen", () => {
    expect(ritualMessage("kedr", "")).toBe("");
  });
});
