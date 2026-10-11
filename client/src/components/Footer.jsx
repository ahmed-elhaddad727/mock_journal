import { Code2 } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full border-t border-slate-100 bg-white px-4 py-6">
      <div className="flex flex-col items-center gap-2">
        <p className="text-center text-sm text-slate-500 sm:text-base">
          Powered by{" "}
          <span className="font-semibold italic text-blue-600">
            <a href="https://ahmed-elhaddad.vercel.app/">Ahmed Elhaddad</a>
          </span>
          <span className="text-slate-500"> · Behaira S&apos;29</span>
          {" and "}
          <span className="font-semibold italic text-blue-600">Adham</span>
          <span className="text-slate-500"> · Behaira S&apos;28</span>
        </p>

        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          Ahmed — Lead Developer & Bug Negotiator
        </span>
      </div>
    </footer>
  );
}
