import { promises as fs } from "fs";
import { pdf } from "pdf-to-img";
import sharp from "sharp";

export async function renderPDF(inputFilePath: string): Promise<ImageMetadata> {
  const inputFileName = inputFilePath.split("/").pop();
  const fullPath = `./src/pages/${inputFilePath}`;

  // Render at 4x so small diagram labels stay crisp on high-DPI screens
  const document = await pdf(fullPath, {
    scale: 4,
  });

  // Get the first page
  const page = await document.getPage(1);

  // Flatten onto white (so the figure stays legible in dark mode) and trim the
  // blank margins that diagram exports often leave around the content
  const { data: image, info } = await sharp(page)
    .flatten({ background: "#ffffff" })
    .trim({ threshold: 10 })
    .extend({
      top: 32,
      bottom: 32,
      left: 32,
      right: 32,
      background: "#ffffff",
    })
    .png()
    .toBuffer({ resolveWithObject: true });

  // Ensure directories exist before writing the file
  const outputDir = `./dist/_astro`;
  await fs.mkdir("./dist", { recursive: true });
  await fs.mkdir(outputDir, { recursive: true });

  // Write the image to disk
  await fs.writeFile(`${outputDir}/${inputFileName}.png`, image);

  let src: string;

  // If running astro build, env.PROD is true
  if (import.meta.env.PROD) {
    src = `_astro/${inputFileName}.png`;
  } else {
    src = `../dist/_astro/${inputFileName}.png`;
  }

  return {
    src: src,
    width: info.width,
    height: info.height,
    format: "png",
  };
}
