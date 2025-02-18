import express from "express";
import path from "path";
import cors from "cors";
import fileUpload from "express-fileupload";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import { htmlToXML } from "./htmltoxml.js";

const app = express();
const execPromise = promisify(exec);

app.use(cors());
app.use(
  fileUpload({
    createParentPath: true,
    useTempFiles: true,
    tempFileDir: path.join(process.cwd(), "tmp"),
  })
);

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

// Ensure uploads directory exists
const ensureUploadDir = async () => {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  } catch (err) {
    console.error("Error creating uploads directory:", err);
  }
};

// Serve uploads folder publicly
app.use("/uploads", express.static(UPLOAD_DIR));

// Convert PDF to HTML using pdf2htmlEX
const convertPdfToHTML = async ({ inputFileName, outputFilename }) => {
  const command = `pdf2htmlEX --zoom 1.3 "${inputFileName}" "${outputFilename}"`;
  await execPromise(command);
};

app.get("/api/v1", (req, res) => {
  res.send("ok running");
});

app.post("/api/v1/pdf-to-xml", async (req, res) => {
  try {
    if (!req.files || !req.files.pdfDoc) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    await ensureUploadDir();

    const uploadedFile = req.files.pdfDoc;
    const extName = path.extname(uploadedFile.name);
    const baseName =
      path.basename(uploadedFile.name, extName) + "-" + Date.now();
    const uploadedFileName = baseName + extName;

    const htmlFileName = baseName + ".html";
    const xmlFileName = baseName + ".xml";

    const pdfFilePath = path.join(UPLOAD_DIR, uploadedFileName);
    const htmlFilePath = path.join(UPLOAD_DIR, htmlFileName);
    const xmlFilePath = path.join(UPLOAD_DIR, xmlFileName);

    await uploadedFile.mv(pdfFilePath);

    await convertPdfToHTML({
      inputFileName: pdfFilePath,
      outputFilename: `./uploads/${htmlFileName}`,
    });
    await htmlToXML({ inputFileName: htmlFilePath, outputFilename: xmlFilePath });

    res.setHeader("Content-Type", "application/xml");
    res.setHeader("Content-Disposition", `attachment; filename="${xmlFileName}"`);
    res.download(xmlFilePath);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Conversion failed" });
  }
});

app.listen(8000, () => {
  console.log("Server running on port 8000");
});
