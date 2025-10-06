import type { Route } from "./+types/resume.$id";
import Navbar from "~/components/Navbar";
import {useParams, useNavigate} from "react-router";
import {useEffect, useState} from "react";
import {usePuterStore} from "~/lib/puter";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Resume Analysis" },
    { name: "description", content: "View AI-powered resume feedback" },
  ];
}

export default function ResumeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { kv } = usePuterStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!id) {
        setError("Invalid resume id");
        setLoading(false);
        return;
      }

      try {
        const item = await kv.get(`resume:${id}`);
        if (!item) {
          setError("Resume not found");
          setLoading(false);
          return;
        }
        const parsed = JSON.parse(item);
        if (!cancelled) {
          setData(parsed);
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setError((e as Error)?.message || "Failed to load resume");
          setLoading(false);
        }
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [id, kv]);

  if (loading) {
    return (
      <main className="bg-[url('/images/bg-main.svg')] bg-cover min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center justify-center">
          <img src="/images/resume-scan-2.gif" className="w-[200px]" />
          <p className="text-white mt-4">Loading analysis...</p>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="bg-[url('/images/bg-main.svg')] bg-cover min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center justify-center gap-4">
          <p className="text-white">{error || "Not found"}</p>
          <button className="primary-button" onClick={() => navigate("/")}>Go Home</button>
        </div>
      </main>
    );
  }

  const { companyName, jobTitle, imagePath, resumePath, feedback } = data;

  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover">
      <Navbar />
      <section className="main-section">
        <div className="page-heading py-16">
          <h1>Resume Analysis</h1>
          <h2>{companyName} — {jobTitle}</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="gradient-border">
            <img src={imagePath} alt="resume" className="w-full object-contain" />
          </div>
          <div className="gradient-border p-6 space-y-4">
            <h3 className="text-2xl font-semibold">Overall Score: {feedback?.overallScore ?? 'N/A'}</h3>
            <div className="space-y-2">
              {feedback ? (
                <>
                  <Section title="ATS" data={feedback.ATS} />
                  <Section title="Tone & Style" data={feedback.toneAndStyle} />
                  <Section title="Content" data={feedback.content} />
                  <Section title="Structure" data={feedback.structure} />
                  <Section title="Skills" data={feedback.skills} />
                </>
              ) : (
                <p>Feedback not available.</p>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function Section({ title, data }: { title: string; data: { score: number; tips: { type: string; tip?: string; explanation?: string }[] } | undefined }) {
  if (!data) return null;
  return (
    <div className="space-y-2">
      <h4 className="text-xl font-medium">{title}: {data.score}</h4>
      <ul className="list-disc list-inside space-y-1">
        {data.tips?.map((t, idx) => (
          <li key={idx}>
            <span className="font-semibold">[{t.type}]</span> {t.tip}
            {t.explanation ? <div className="text-gray-600">{t.explanation}</div> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}


