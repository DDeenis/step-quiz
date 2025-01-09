"use client";

import Link from "next/link";
import {
  BadgeCheck,
  BookText,
  ChartNoAxesCombined,
  ChevronDown,
} from "lucide-react";
import React from "react";

export default function HomePage() {
  return (
    <div>
      <header className="bg-gray-100 px-6 py-4 flex justify-between items-center w-full">
        <Link href="/home" className="font-fancy font-bold text-2xl">
          Quizzz
        </Link>
        <nav className="flex items-center gap-12">
          <button className="text-gray-950 font-semibold flex items-center gap-3">
            Quizzes
            <ChevronDown className="w-5 stroke-gray-500" />
          </button>
          <Link href="/leaderboard" className="text-gray-400 font-semibold">
            Leaderboards
          </Link>
          <Link href="/results" className="text-gray-400 font-semibold">
            My Results
          </Link>
          <Link href="/profile" className="text-gray-400 font-semibold">
            Profile
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          <div className="flex flex-col justify-center items-end gap-1">
            <p className="text-sm font-semibold text-gray-950">John Doe</p>
            <p className="text-xs text-gray-400">Student</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-gray-300" />
        </div>
      </header>
      <main className="w-full mt-8">
        <div className="container mx-auto">
          <section>
            <p className="font-semibold text-gray-950">Last 30 days</p>
            <div className="mt-5 grid grid-cols-3 gap-5">
              <div className="p-6 flex gap-4 bg-gray-50 rounded-lg">
                <div className="w-16 h-16 flex justify-center items-center bg-gray-200 rounded-md">
                  <BookText className="w-8 h-8 stroke-gray-600" />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-sm text-gray-500 font-medium capitalize">
                    Quizzes Started
                  </p>
                  <p className="text-3xl text-gray-900 font-semibold">12</p>
                </div>
              </div>
              <div className="p-6 flex gap-4 bg-gray-50 rounded-lg">
                <div className="w-16 h-16 flex justify-center items-center bg-gray-200 rounded-md">
                  <BadgeCheck className="w-8 h-8 stroke-gray-600" />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-sm text-gray-500 font-medium capitalize">
                    Passed Successfully
                  </p>
                  <p className="text-3xl text-gray-900 font-semibold">80%</p>
                </div>
              </div>
              <div className="p-6 flex gap-4 bg-gray-50 rounded-lg">
                <div className="w-16 h-16 flex justify-center items-center bg-gray-200 rounded-md">
                  <ChartNoAxesCombined className="w-8 h-8 stroke-gray-600" />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-sm text-gray-500 font-medium capitalize">
                    Streak
                  </p>
                  <p className="text-3xl text-gray-900 font-semibold">5 days</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
