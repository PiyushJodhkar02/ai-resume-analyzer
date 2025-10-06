import type { Route } from "./+types/home";
import Navbar from "~/components/Navbar";
import ResumeCard from "~/components/ResumeCard";
import {usePuterStore} from "~/lib/puter";
import {Link, useNavigate} from "react-router";
import {useEffect, useState} from "react";
import { resumes } from "../../constants";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Resumind" },
    { name: "description", content: "Smart feedback for your dream job!" },
  ];
}

export default function Home() {
  const { auth, isLoading } = usePuterStore();
  const navigate = useNavigate();
  const [loadingResumes, setLoadingResumes] = useState(false);

  useEffect(() => {
    // Only redirect if we're not loading and not authenticated
    if(!isLoading && !auth.isAuthenticated) {
      navigate('/auth?next=/');
    }
  }, [auth.isAuthenticated, isLoading, navigate])

  useEffect(() => {
    // Simulate loading for better UX
    setLoadingResumes(true);
    const timer = setTimeout(() => {
      setLoadingResumes(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // Show loading while checking authentication
  if (isLoading) {
    return <main className="bg-[url('/images/bg-main.svg')] bg-cover min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center justify-center">
        <img src="/images/resume-scan-2.gif" className="w-[200px]" />
        <p className="text-white mt-4">Checking authentication...</p>
      </div>
    </main>
  }

  return <main className="bg-[url('/images/bg-main.svg')] bg-cover">
    <Navbar />

    <section className="main-section">
      <div className="page-heading py-16">
        <h1>Track Your Applications & Resume Ratings</h1>
        <h2>Review your submissions and check AI-powered feedback.</h2>
      </div>
      {loadingResumes && (
          <div className="flex flex-col items-center justify-center">
            <img src="/images/resume-scan-2.gif" className="w-[200px]" />
          </div>
      )}

      {!loadingResumes && (
        <div className="resumes-section">
          {resumes.map((resume: Resume) => (
              <ResumeCard key={resume.id} resume={resume} />
          ))}
        </div>
      )}
    </section>
  </main>
}