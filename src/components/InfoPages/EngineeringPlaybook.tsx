import React from "react";
import InfoPageLayout from "./InfoPageLayout";
import { motion } from "motion/react";
import { Sparkles, Calendar, Clock, User, Cpu, Code2, Server, Database, Settings } from "lucide-react";
import { Link } from "react-router-dom";

export default function EngineeringPlaybook() {
  const patterns = [
    {
      title: "🛡️ Pattern 1: The Serial Queue Execution Model",
      problem: "Free-tier endpoints (like Groq or Cerebras) enforce strict concurrency caps. Spawning multiple agents simultaneously triggers immediate 429 rate limit crashes.",
      solution: "We implemented a serial database coordinator. Only one task is marked \"todo\" at any time; the rest are set to \"blocked\". When the active agent transitions to \"done\", a coordinator script clears database locks, applies a 15-second rate cooldown delay, and unblocks the next task in the pipeline.",
    },
    {
      title: "🛡️ Pattern 2: Global Fallover Route Whitelisting",
      problem: "Free API endpoints regularly deprecate models (e.g., Cerebras deprecating Llama 3.1 8B on May 27, 2026), immediately breaking static developer scripts.",
      solution: "Our local client (Hermes adapter) utilizes dynamic fallback whitelists. If an active connection fails, the dispatcher instantly routes traffic to stable models, like Cerebras' high-performance Llama 3.3 70B, preventing task collapse.",
    },
    {
      title: "🛡️ Pattern 3: Automated Socratic Whitelisting",
      problem: "LLMs routinely hallucinate non-existent tool calls during agent loops, causing fatal application crashes.",
      solution: "All agent tool calls are isolated within a defensive wrapper. If an agent tries to execute a non-existent utility, the wrapper intercepts the process and feeds the model the whitelisted signature, letting the agent rectify its coordinates on the fly.",
    },
  ];

  return (
    <InfoPageLayout activePath="/engineering-playbook">
      <main className="flex-1 bg-[#0A192F] py-16 px-4 md:px-6 font-sans">
        <article className="max-w-4xl mx-auto bg-[#0F2A4A]/50 border border-white/5 rounded-3xl p-6 md:p-12 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <header className="mb-10 text-center md:text-left border-b border-white/5 pb-8">
            <span className="inline-block px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold tracking-widest rounded-full uppercase mb-4 font-mono">
              AI Systems Architecture
            </span>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-white mb-6 leading-tight font-sans">
              Building a Zero-Human Creative Agency: How Aegis Automates Its Own Content
            </h1>
            <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 text-slate-400 text-xs md:text-sm font-mono">
              <span className="flex items-center gap-1.5 font-semibold text-slate-300">
                <User className="w-4 h-4 text-emerald-400" /> By Aniket Dhuri
              </span>
              <span className="hidden md:inline">&bull;</span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-400" /> May 27, 2026
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-400" /> 11 Min Read
              </span>
            </div>
          </header>

          {/* Content */}
          <section className="space-y-6 text-slate-300 font-light text-base leading-relaxed font-sans">
            <p>
              When building a modern clinical translation startup like Aegis Health AI, resources are highly constrained. As a solo developer managing frontend code, regulatory compliance whitelists, database structures, and security audits, finding the time to design, write, format, and schedule marketing campaigns and clinical guides is a massive bottleneck.
            </p>
            <p>
              Instead of hiring a human content department or relying on generic, uninspired single-prompt LLM builders, we engineered a <strong className="text-white">highly specialized, autonomous multi-agent creative network</strong>. This network coordinates, outlines, drafts, edits, designs, and polishes brand material completely on autopilot. Here is the technical post-mortem, architecture layout, and playbook of our local WSL2-based agent team.
            </p>

            <h3 className="text-white font-bold text-lg pt-4 tracking-wide font-sans flex items-center gap-2">
              <Cpu className="w-5 h-5 text-emerald-400" /> Why the Agent Network Exists
            </h3>
            <p>
              Most developers attempt content creation using massive, monolithic prompts ("You are an expert copywriter. Write a post about blood sugar..."). This approach inevitably suffers from <strong className="text-white">generalist drift</strong>. The model attempts to handle target keywords, copy formatting, visual hierarchy, brand rules, and clinical guardrails all in a single pass. The output is usually generic "AI slop" loaded with corporate marketing jargon.
            </p>
            <p>
              By contrast, Aegis distributes the creative burden among highly specialized, autonomous agent roles. Each agent is modeled after a physical corporate specialist, carrying unique directives, and is assigned to an optimized model provider.
            </p>

            <h3 className="text-white font-bold text-lg pt-4 tracking-wide flex items-center gap-2">
              <Server className="w-5 h-5 text-emerald-400" /> High-Level Architecture & Integration
            </h3>
            <p>
              The agency runs locally in a hybrid WSL2 Ubuntu environment. It coordinates runs using the Paperclip AI Node.js backend. Here is the operational sequence:
            </p>
            <ol className="list-decimal pl-6 space-y-3 font-sans">
              <li>
                <strong className="text-white">Strategic Delegation:</strong> The <em>CEO Agent</em> reviews raw startup goals, defines a backlog of content requirements (issues), and writes detailed specialist briefs.
              </li>
              <li>
                <strong className="text-white">Drafting and Formatting:</strong> The <em>Content Writer</em> processes the clinical brief and drafts a long-form article. The <em>Copywriter Agent</em> edits the output, injecting engaging hooks and direct CTAs.
              </li>
              <li>
                <strong className="text-white">Brand and Visual Quality Assurance:</strong> The <em>Creative Director Agent</em> audits the drafts against the brand's visual bible, whitelisting compliant metaphors. The <em>Graphic Designer</em> designs visual layouts and assets.
              </li>
              <li>
                <strong className="text-white">Channel Optimization:</strong> The <em>Social Manager Agent</em> adapts the final polished posts into optimized formats for platforms like Twitter or LinkedIn.
              </li>
            </ol>

            <h3 className="text-white font-bold text-lg pt-6 tracking-wide flex items-center gap-2">
              <Code2 className="w-5 h-5 text-emerald-400" /> Three Dev Battles & Defensive Invariants
            </h3>
            <p className="text-sm text-slate-400">
              Running a high-volume autonomous network on free-tier API endpoints introduces strict limits and rate barriers (HTTP 429). We solved these challenges with three robust architectural patterns:
            </p>

            <div className="space-y-6 pt-2">
              {patterns.map((item, idx) => (
                <div key={idx} className="bg-[#0A192F]/50 p-6 rounded-2xl border border-white/5 font-sans space-y-3">
                  <h4 className="text-white font-bold text-sm tracking-wide uppercase text-emerald-300">{item.title}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    <strong className="text-red-400">The Problem:</strong> {item.problem}
                  </p>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    <strong className="text-emerald-400">The Solution:</strong> {item.solution}
                  </p>
                </div>
              ))}
            </div>

            <h3 className="text-white font-bold text-lg pt-6 tracking-wide flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-400" /> The Free-Tier Model Matrix (May 2026)
            </h3>
            <p>
              To stay within strict rate limits and align with specific agent strengths, we isolate our agents on different model providers:
            </p>
            <ul className="list-disc pl-6 space-y-3 font-mono text-xs text-slate-200">
              <li>
                <strong className="text-white font-sans">Groq (Llama-4-Scout):</strong> Reserved for high-speed reactive loops and formatting, featuring a resilient 30K TPM limit.
              </li>
              <li>
                <strong className="text-white font-sans">Google AI Studio (Gemini 2.5 Flash):</strong> Excellent for parsing long documents and performing web research using Google Search grounding.
              </li>
              <li>
                <strong className="text-white font-sans">Cerebras (Llama-3.3-70B):</strong> Reserved for small-input tool processing, boasting speeds of up to 1,500 tokens/sec.
              </li>
            </ul>

            <h3 className="text-white font-bold text-lg pt-6 tracking-wide flex items-center gap-2">
              <Settings className="w-5 h-5 text-emerald-400" /> Conclusion: The Future of Sovereign Engineering
            </h3>
            <p>
              By combining modular agent responsibilities, serial execution queues, and robust API fallbacks, we proved that a solo developer can run a fully autonomous creative content engine. This keeps Aegis' development costs at zero, allowing us to focus on what matters: delivering beautiful, secure, and clear medical translations to Indian homes.
            </p>
          </section>

          {/* Technical disclaimer */}
          <footer className="mt-12 pt-6 border-t border-white/5 text-xs text-slate-300 leading-relaxed font-mono">
            <strong>Platform Engineering Disclaimer:</strong> This article documents technical experiments running in sandboxed development channels. The code patterns and metrics listed represent local testing results. Under no circumstances should machine learning outputs be trusted unconditionally without human review.
          </footer>
        </article>
      </main>

      {/* Interactive Support CTA Strip */}
      <section className="relative overflow-hidden py-24 px-6 bg-[#0F2A4A] border-t border-white/5 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-3xl mx-auto relative z-10 flex flex-col items-center">
          <Sparkles className="w-8 h-8 text-emerald-400 mb-6 animate-pulse" />
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4">Explore Aegis Health AI</h2>
          <p className="text-slate-300 text-sm max-w-xl mb-8 leading-relaxed font-light">
            Our engineering architecture is open. Paste a sample report in our high-trust workspace sandbox to witness our extraction engine in action.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link 
              to="/dashboard"
              className="px-8 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-[#0A192F] font-extrabold uppercase text-xs tracking-widest rounded-full transition-all"
            >
              Launch Sandbox Portal
            </Link>
            <Link 
              to="/about.html"
              className="px-8 py-3.5 bg-[#0A192F] hover:bg-[#0E2444] text-white border border-white/15 text-xs font-extrabold uppercase tracking-widest rounded-full transition-all"
            >
              Read Founder Story
            </Link>
          </div>
        </div>
      </section>
    </InfoPageLayout>
  );
}
