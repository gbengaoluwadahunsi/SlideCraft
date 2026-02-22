'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Slide } from '@/components/Slide';
import { SlideData } from '@/lib/types';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function SharePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const [project, setProject] = useState<{ name: string; slides: SlideData[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    const loadSharedProject = async () => {
      try {
        const response = await fetch(`/api/projects/share/${token}`);
        if (!response.ok) {
          throw new Error('Project not found');
        }
        const data = await response.json();
        setProject(data.project);
      } catch (err) {
        setError('This shared project could not be found or is no longer available.');
      } finally {
        setLoading(false);
      }
    };

    loadSharedProject();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[#ffd700]" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Project Not Found</h1>
          <p className="text-gray-400 mb-6">{error || 'This project could not be loaded.'}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#ffd700] hover:bg-yellow-400 text-black font-bold rounded-xl transition"
          >
            <ArrowLeft size={18} />
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition mb-4"
          >
            <ArrowLeft size={18} />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold">{project.name}</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {project.slides.map((slide, index) => (
            <div key={slide.id || index} className="bg-gray-800 rounded-xl p-4">
              <div className="transform scale-[0.25] origin-top-left pointer-events-none w-[432px] h-[540px]">
                <Slide {...slide} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

