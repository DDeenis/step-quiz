import { describe, expect, it } from "vitest";
import { slugify } from "./utils";

describe("DB Utils", () => {
  describe("slugify", () => {
    it("function should the string and append a random number to it", () => {
      expect(slugify("String to be converted")).toMatch(
        /^string-to-be-converted-\d{4}$/
      );
    });

    it("function should truncate the string if it's too long", () => {
      expect(
        slugify("String that is way to long so it needs to be truncated", {
          maxChars: 20,
          appendRandomNumber: false,
        })
      ).toMatch(/^string-that-is-way-t$/);
    });

    it("function should truncate the string and append a random number to it", () => {
      expect(
        slugify("String that is way to long so it needs to be truncated", {
          maxChars: 20,
        })
      ).toMatch(/^string-that-is-\d{4}$/);
    });
  });
});
