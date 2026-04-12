import yauzl from "yauzl";
import { Readable } from "stream";

type ZipStreamResult = {
  stream: Readable;
  entryName: string;
  close: () => void;
};

function isSafeEntry(name: string) {
  if (!name) return false;
  if (name.includes("..")) return false;
  if (name.startsWith("/") || name.startsWith("\\")) return false;
  return true;
}

function isCsvEntry(name: string) {
  const lowered = name.toLowerCase();
  return lowered.endsWith(".csv") || lowered.endsWith(".tsv") || lowered.endsWith(".txt");
}

export async function openZipCsvStream(zipPath: string): Promise<ZipStreamResult> {
  return new Promise((resolve, reject) => {
    yauzl.open(zipPath, { lazyEntries: true }, (error, zipfile) => {
      if (error || !zipfile) {
        reject(error || new Error("Unable to open ZIP file."));
        return;
      }

      const close = () => zipfile.close();

      zipfile.readEntry();
      zipfile.on("entry", (entry) => {
        const name = entry.fileName;
        if (!isSafeEntry(name) || !isCsvEntry(name)) {
          zipfile.readEntry();
          return;
        }

        zipfile.openReadStream(entry, (streamError, stream) => {
          if (streamError || !stream) {
            close();
            reject(streamError || new Error("Unable to read ZIP entry."));
            return;
          }

          stream.on("error", (err) => {
            close();
            reject(err);
          });
          stream.on("end", () => close());

          resolve({ stream, entryName: name, close });
        });
      });

      zipfile.on("end", () => {
        reject(new Error("No CSV entry found in ZIP."));
      });

      zipfile.on("error", (err) => {
        close();
        reject(err);
      });
    });
  });
}
