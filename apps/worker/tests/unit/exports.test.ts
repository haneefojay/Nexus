import { describe, expect, it } from "vitest";
import { csvCell, protectCsvFormula, renderCsv } from "../../src/exports.js";

describe("operational CSV", () => {
  it.each(["=2+2", "+cmd", "-10+20", "@SUM(A1)", '  =HYPERLINK("x")'])(
    "neutralizes formula input %s",
    (input) => {
      expect(protectCsvFormula(input)).toBe(`'${input}`);
    },
  );
  it("quotes values and produces stable CRLF output", () => {
    expect(csvCell('a,"b"')).toBe('"a,""b"""');
    const output = Buffer.from(
      renderCsv({ columns: ["name"], rows: [["=unsafe"], ["safe"]] }),
    ).toString();
    expect(output).toContain('"\'=unsafe"\r\n"safe"');
  });
});
