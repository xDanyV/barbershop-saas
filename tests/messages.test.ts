import { describe, expect, it } from "vitest";
import es from "../messages/es.json";
import en from "../messages/en.json";

type Messages = { [key: string]: string | Messages };

const flatten = (messages: Messages, prefix = ""): Record<string, string> =>
    Object.fromEntries(
        Object.entries(messages).flatMap(([key, value]) =>
            typeof value === "string" ? [[prefix + key, value]] : Object.entries(flatten(value, `${prefix}${key}.`))
        )
    );

const esFlat = flatten(es as Messages);
const enFlat = flatten(en as Messages);
// Variables como {name} o {count, plural, ...}: solo el nombre. El texto dentro de un plural ({# citas}) no cuenta.
const placeholders = (text: string) =>
    [...new Set([...text.matchAll(/(?<!(?:zero|one|two|few|many|other|=\d+)\s?)\{(\w+)\s*[,}]/g)].map((match) => match[1]))].sort();

describe("translations", () => {
    it("Spanish and English have exactly the same texts", () => {
        expect(Object.keys(enFlat).filter((key) => !(key in esFlat))).toEqual([]);
        expect(Object.keys(esFlat).filter((key) => !(key in enFlat))).toEqual([]);
    });

    it("every text uses the same variables in both languages", () => {
        const mismatched = Object.keys(esFlat).filter((key) => key in enFlat && placeholders(esFlat[key]).join() !== placeholders(enFlat[key]).join());
        expect(mismatched).toEqual([]);
    });

    it("no text is left empty", () => {
        expect(Object.entries({ ...esFlat, ...enFlat }).filter(([, value]) => !value.trim())).toEqual([]);
    });
});
