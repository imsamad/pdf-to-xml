import fs from "fs/promises";
import { parseDocument } from "htmlparser2";
import { create } from "xmlbuilder2";

export const htmlToXML = async ({ inputFileName, outputFilename }) => {
  try {
    const html = await fs.readFile(inputFileName, "utf8");

    // Parse HTML
    const dom = parseDocument(html);

    function convertNode(node, parent) {
      if (node.type === "text") {
        parent.txt(node.data.trim());
      } else if (node.type === "tag") {
        const child = parent.ele(node.name);
        node.children?.forEach((n) => convertNode(n, child));
      }
    }

    // Create XML
    const root = create({ version: "1.0" }).ele("root");
    dom.children.forEach((node) => convertNode(node, root));

    const xml = root.end({ prettyPrint: true });

    // Write to XML file
    await fs.writeFile(outputFilename, xml, "utf8");

    console.log("Conversion complete. Check output.xml.");
  } catch (error) {
    console.error("Error during conversion:", error);
  }
};
