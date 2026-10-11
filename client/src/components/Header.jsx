export default function Header() {
  return (
    <header className="w-full bg-white px-5 py-5 shadow-sm">
      <div className="grid grid-cols-3 items-center">
        <div className="justify-self-left">
          <h2 className="whitespace-nowrap font-[cursive] text-xl font-bold italic text-blue-600 sm:text-3xl">
            Exper Journal
          </h2>
        </div>

        {/* Right: Empty space keeps title centered */}
        <div aria-hidden="true" />
      </div>
    </header>
  );
}
