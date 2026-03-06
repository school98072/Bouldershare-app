import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import path from "path";

const PORT = process.env.PORT ? Number(process.env.PORT) : 3002;
const ALLOWED_GRADES = ["V0","V1","V2","V3","V4","V5","V6","V7","V8","V9"] as const;
type Grade = typeof ALLOWED_GRADES[number];

type VideoRecord = {
  id: number;
  url: string;
  city: string;
  gym: string;
  grade: Grade;
  timestamp: string;
};

const app = express();
app.use(cors());
app.use(express.json());

// Files and storage
const UPLOADS_DIR = path.join(process.cwd(), "uploads");
const DB_JSON = path.join(process.cwd(), "db.json");

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(DB_JSON)) {
  fs.writeFileSync(DB_JSON, JSON.stringify({ videos: [] }, null, 2), "utf-8");
}

// Multer setup
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const safeName = `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`;
    cb(null, safeName);
  }
});
const upload = multer({ storage });

// Simple JSON "DB" helpers (synchronous for simplicity)
function readDB(): { videos: VideoRecord[] } {
  try {
    const txt = fs.readFileSync(DB_JSON, "utf-8");
    return JSON.parse(txt);
  } catch (e) {
    return { videos: [] };
  }
}

function writeDB(data: { videos: VideoRecord[] }) {
  fs.writeFileSync(DB_JSON, JSON.stringify(data, null, 2), "utf-8");
}

function insertVideo(entry: Omit<VideoRecord, "id">): VideoRecord {
  const db = readDB();
  const id = db.videos.length ? Math.max(...db.videos.map(v => v.id)) + 1 : 1;
  const record: VideoRecord = { id, ...entry };
  db.videos.push(record);
  writeDB(db);
  return record;
}

function queryVideos(filters: { city?: string; gym?: string; grade?: string }): VideoRecord[] {
  const db = readDB();
  let items = db.videos.slice().reverse(); // newest first
  if (filters.city) items = items.filter(v => v.city === filters.city);
  if (filters.gym) items = items.filter(v => v.gym === filters.gym);
  if (filters.grade) items = items.filter(v => v.grade === filters.grade);
  return items.slice(0, 100);
}

// Serve uploads
app.use("/uploads", express.static(UPLOADS_DIR));

/**
 * GET /videos
 * Query params: city, gym, grade
 */
app.get("/videos", (req, res) => {
  const { city, gym, grade } = req.query;
  if (grade && typeof grade === "string" && !ALLOWED_GRADES.includes(grade as Grade)) {
    return res.status(400).json({ error: "Invalid grade filter" });
  }
  const filters: any = {};
  if (city && typeof city === "string") filters.city = city;
  if (gym && typeof gym === "string") filters.gym = gym;
  if (grade && typeof grade === "string") filters.grade = grade;
  const rows = queryVideos(filters);
  res.json(rows);
});

/**
 * POST /upload
 * multipart/form-data
 * fields: video (file), city, gym, grade
 */
app.post("/upload", upload.single("video"), (req, res) => {
  const file = req.file;
  const { city, gym, grade } = req.body;

  if (!file) return res.status(400).json({ error: "Video file is required (field name: video)" });
  if (!city || typeof city !== "string") return res.status(400).json({ error: "City is required" });
  if (!gym || typeof gym !== "string") return res.status(400).json({ error: "Gym name is required" });
  if (!grade || typeof grade !== "string" || !ALLOWED_GRADES.includes(grade as Grade)) {
    return res.status(400).json({ error: "Grade is required and must be one of V0-V9" });
  }

  const relativeUrl = `/uploads/${path.basename(file.path)}`;
  const timestamp = new Date().toISOString();

  try {
    const created = insertVideo({ url: relativeUrl, city, gym, grade: grade as Grade, timestamp });
    res.status(201).json(created);
  } catch (e: any) {
    console.error("Failed to save video metadata:", e);
    res.status(500).json({ error: "Failed to save metadata" });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`BoulderShare server (JSON DB) listening on http://0.0.0.0:${PORT}`);
  console.log(`Uploads served at /uploads (directory: ${UPLOADS_DIR})`);
  console.log(`DB file: ${DB_JSON}`);
});
