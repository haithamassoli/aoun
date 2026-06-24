"use client";

import Image from "next/image";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

type PartnerCard = {
  _id: string;
  name: string;
  logoUrl: string;
  websiteUrl?: string;
};

export function PartnersGrid() {
  const partners = useQuery(api.partners.list) as PartnerCard[] | undefined;

  return (
    <div>
      {/* Hero */}
      <div className="relative overflow-hidden bg-[linear-gradient(180deg,#407bf3_0%,#356eea_34%,#2d61df_62%,#2957d3_82%,#274fc7_100%)] px-4 py-16 text-center sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-60 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.24)_0%,transparent_72%)]" />
        <h1 className="public-section-title relative text-3xl font-bold text-white sm:text-4xl">
          شركاؤنا وداعمونــا
        </h1>
        <p className="relative mt-3 text-lg text-primary-100">
          الجهات التي تسـاهم في دعم منصة عون وتطويرها
        </p>
      </div>

      {/* Grid */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {partners === undefined ? (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-2xl border border-surface-200 bg-surface-100 p-6 dark:border-surface-700 dark:bg-surface-800"
                style={{ height: 140 }}
              />
            ))}
          </div>
        ) : partners.length === 0 ? (
          <p className="text-center text-surface-400 dark:text-surface-500">
            لا يوجد شركـاء حتى الآن
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
            {partners.map((partner) => {
              const card = (
                <div className="public-elevated-surface public-interactive-card flex flex-col items-center gap-3 rounded-[1.6rem] p-2">
                  <div className="relative h-40 w-32">
                    <Image
                      src={partner.logoUrl}
                      alt={partner.name}
                      fill
                      sizes="(min-width: 1024px) 8rem, (min-width: 640px) 33vw, 50vw"
                      className="object-contain rounded-lg"
                      unoptimized
                    />
                  </div>
                  {/* <span className="text-center text-sm font-medium text-surface-700 dark:text-surface-300">
                    {partner.name}
                  </span> */}
                </div>
              );

              return partner.websiteUrl ? (
                <a
                  key={partner._id}
                  href={partner.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {card}
                </a>
              ) : (
                <div key={partner._id}>{card}</div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
