import type { Route } from "./+types/($lang)._index";
import { useIntlayer } from "react-intlayer";
import {
  SignedIn,
  SignedOut,
  UserButton,
  SignInButton,
  SignUpButton,
} from "@clerk/react-router";
import { ArrowRight, CornerDownRight, Database, Hash, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { prisma } from "@/config/supabase/db";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Silhouette - Industrial Archive" },
    {
      name: "description",
      content: "Capture and organize your digital world.",
    },
  ];
}

export async function loader(args: Route.LoaderArgs) {
  const tasks = await prisma.tasks.findMany();
  return tasks;
}

export default function LandingRoute({ loaderData }: Route.ComponentProps) {
  const {
    layout: {
      auth: { signIn, signUp },
      logo,
    },
    hero: { subtitle, primaryCta, secondaryCta },
    features,
    footer,
  } = useIntlayer("landing-page");

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-mono selection:bg-[#ccff00] selection:text-black overflow-x-hidden relative">
      <div className="bg-noise" />

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm">
        <div className="w-full px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#ccff00] flex items-center justify-center text-black font-anton text-xs">
              S
            </div>
            <span className="font-anton text-xl uppercase tracking-tighter">
              {logo}
            </span>
            <span className="text-[10px] text-zinc-500 ml-2 border border-zinc-800 px-1 rounded-sm">
              V1.0.0
            </span>
          </div>

          <div className="flex items-center gap-4">
            <SignedOut>
              <Button
                variant="ghost"
                className="text-zinc-400 hover:text-[#ccff00] hover:bg-transparent uppercase text-xs tracking-widest"
                render={
                  <SignInButton>
                    <span>[{signIn}]</span>
                  </SignInButton>
                }
              />
              <Button
                className="bg-zinc-100 text-black hover:bg-[#ccff00] hover:text-black rounded-none h-8 px-4 text-xs uppercase font-bold tracking-widest border border-transparent hover:border-black"
                render={
                  <SignUpButton>
                    <span>{signUp}</span>
                  </SignUpButton>
                }
              />
            </SignedOut>
            <SignedIn>
              <UserButton />
            </SignedIn>
          </div>
        </div>
      </header>

      <main className="relative z-10 w-full border-l border-r border-zinc-800 max-w-[1920px] mx-auto">
        {/* Hero Section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 border-b border-zinc-800">
          <div className="col-span-1 lg:col-span-8 p-6 md:p-12 lg:p-24 lg:border-r border-zinc-800 flex flex-col justify-center">
            <span className="text-zinc-500 text-xs uppercase tracking-widest mb-4 block">
              001 /// Archive Initiation
            </span>
            <h1 className="font-anton text-6xl md:text-8xl lg:text-9xl uppercase leading-[0.85] tracking-tight mb-8">
              Capture Your
              <br />
              <span className="text-[#ccff00]">Digital World</span>.
            </h1>
            <p className="font-mono text-zinc-400 text-sm md:text-base max-w-xl leading-relaxed mb-12 border-l-2 border-[#ccff00] pl-6">
              {subtitle}
            </p>

            <div className="flex flex-col sm:flex-row gap-6">
              <Button
                size="lg"
                className="bg-[#ccff00] text-black hover:bg-white hover:text-black rounded-none h-14 px-8 font-bold border-2 border-[#ccff00] hover:border-white transition-all uppercase tracking-wide"
                render={
                  <SignUpButton>
                    <span className="flex items-center gap-2">
                      {primaryCta} <CornerDownRight className="w-4 h-4" />
                    </span>
                  </SignUpButton>
                }
              />
            </div>
          </div>
          <div className="col-span-1 lg:col-span-4 bg-zinc-900/20 relative overflow-hidden hidden lg:flex items-center justify-center">
            <div className="w-full h-full border-t border-zinc-800 lg:border-t-0 p-12 flex flex-col justify-between">
              <div className="font-anton text-[200px] leading-none text-zinc-900 select-none absolute -top-5 -right-5">
                A
              </div>
              <div className="w-full h-full border border-zinc-800 rounded-sm relative p-4">
                <div className="absolute top-2 left-2 w-2 h-2 bg-[#ccff00]"></div>
                <div className="absolute top-2 right-2 w-2 h-2 border border-zinc-600"></div>
                <div className="absolute bottom-2 left-2 w-2 h-2 border border-zinc-600"></div>
                <div className="absolute bottom-2 right-2 w-2 h-2 bg-zinc-800"></div>

                <div className="font-mono text-[10px] text-zinc-600 space-y-2 mt-4">
                  <p>{`> INITIALIZING SEQUENCE...`}</p>
                  <p>{`> CONNECTING TO NEURAL LINK...`}</p>
                  <p>{`> STATUS: ONLINE`}</p>
                  <p className="text-[#ccff00] animate-pulse">{`> AWAITING INPUT_`}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border-b border-zinc-800">
          {features.list.map((feature, idx) => (
            <div
              key={idx}
              className="p-8 border-b md:border-b-0 border-r border-zinc-800 hover:bg-zinc-900 transition-colors group h-full"
            >
              <div className="flex justify-between items-start mb-12">
                <span className="font-mono text-zinc-600 text-xs">
                  0{idx + 1}
                </span>
                <div className="text-zinc-500 group-hover:text-[#ccff00] transition-colors">
                  {idx === 0 && <Zap className="w-5 h-5" />}
                  {idx === 1 && <Hash className="w-5 h-5" />}
                  {idx === 2 && <Database className="w-5 h-5" />}
                  {idx === 3 && <ArrowRight className="w-5 h-5" />}
                </div>
              </div>
              <h3 className="font-oswald text-2xl uppercase mb-4 text-zinc-100 group-hover:translate-x-1 transition-transform">
                {feature.title}
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed max-w-[200px]">
                {feature.desc}
              </p>
            </div>
          ))}
        </section>

        {/* Footer CTA */}
        <section className="p-12 md:p-24 text-center border-b border-zinc-800 bg-[#ccff00] text-black">
          <h2 className="font-anton text-5xl md:text-8xl uppercase leading-[0.8] tracking-tight mb-8">
            {secondaryCta}
          </h2>
          <Button
            size="lg"
            className="bg-black text-white hover:bg-white hover:text-black rounded-none h-16 px-12 text-lg font-mono uppercase tracking-widest border-2 border-black transition-all"
            render={
              <SignUpButton>
                <span>[ INITIATE_NOW ]</span>
              </SignUpButton>
            }
          />
        </section>
      </main>

      <footer className="w-full max-w-[1920px] mx-auto border-l border-r border-b border-zinc-800 bg-zinc-950 p-6 md:p-8">
        <div className="flex flex-col md:flex-row justify-between items-end text-[10px] uppercase font-mono tracking-widest text-zinc-500">
          <div className="flex flex-col gap-1">
            <span>Silhouette System</span>
            <span>Version 1.0.0 (Beta)</span>
            <p className="mt-4 text-zinc-600">{footer.copyright}</p>
          </div>
          <div className="flex gap-8 mt-8 md:mt-0">
            <span className="hover:text-[#ccff00] cursor-pointer">
              Privacy_Protocol
            </span>
            <span className="hover:text-[#ccff00] cursor-pointer">
              Terms_Of_engagement
            </span>
            <span className="hover:text-[#ccff00] cursor-pointer">
              System_Status: Operational
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
