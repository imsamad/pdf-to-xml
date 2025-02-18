import fs from "fs/promises";
import { parseDocument } from "htmlparser2";
import { create } from "xmlbuilder2";

export const htmlToXML = async ({ inputFileName, outputFilename }) => {
  try {
    const html = await fs.readFile(inputFileName, "utf8");
    const dom = parseDocument(html);

    const convertNode = (node, parent) => {
      if (node.type === "text" && node.data.trim()) {
        parent.txt(node.data.trim());
      } else if (node.type === "tag") {
        const child = parent.ele(node.name);
        if (node.attribs) {
          Object.entries(node.attribs).forEach(([key, value]) => {
            child.att(key, value);
          });
        }
        node.children?.forEach((n) => convertNode(n, child));
      }
    };

    const root = create({ version: "1.0" }).ele("root");
    dom.children.forEach((node) => convertNode(node, root));

    const xml = root.end({ prettyPrint: true });
    await fs.writeFile(outputFilename, xml, "utf8");

    console.log(`Conversion complete. Check ${outputFilename}.`);
  } catch (error) {
    console.error("Error during conversion:", error);
  }
};
